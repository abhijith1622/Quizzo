import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db.js';
import { GameSession, QuizSlide, Participant, LeaderboardEntry, AnswerRecord, Team, GameResult } from '../../src/types/quiz.js';
import { persistGameResult, persistSession, persistAnswer } from '../mongoService.js';

export function setupGameSockets(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentSessionId: string | null = null;
    let currentParticipantId: string | null = null;
    let isHost = false;

    // 1. Join Game Lobby as Participant or Host
    socket.on('game:join', (payload: { sessionId: string; nickname?: string; avatarKey?: string; teamId?: string; hostSecret?: string; participantId?: string }, callback) => {
      const { sessionId, nickname, avatarKey, teamId, participantId } = payload;
      const session = db.sessions.get(sessionId);

      if (!session) {
        if (callback) callback({ success: false, error: 'Game session not found' });
        return;
      }

      currentSessionId = sessionId;
      socket.join(`game:${sessionId}`);

      // Check if participant already exists (reconnection)
      let participant: Participant | undefined;
      if (participantId) {
        participant = session.participants.find(p => p.id === participantId);
      }

      if (!participant && nickname) {
        if (session.isLobbyLocked) {
          if (callback) callback({ success: false, error: 'Lobby is currently locked by the host' });
          return;
        }

        const newParticipant: Participant = {
          id: participantId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sessionId,
          nickname: nickname.trim(),
          avatarKey: avatarKey || 'fox',
          teamId: teamId || undefined,
          score: 0,
          streak: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastResponseTimeMs: 0,
          connectionStatus: 'connected',
          joinedAt: new Date().toISOString()
        };

        // If team assigned, update team count
        if (teamId) {
          const team = session.teams.find(t => t.id === teamId);
          if (team) {
            team.memberCount += 1;
          }
        }

        session.participants.push(newParticipant);
        participant = newParticipant;
      }

      if (participant) {
        participant.connectionStatus = 'connected';
        currentParticipantId = participant.id;
      }

      // Notify room about participant update
      io.to(`game:${sessionId}`).emit('lobby:update', {
        participants: session.participants,
        teams: session.teams,
        isLobbyLocked: session.isLobbyLocked,
        status: session.status
      });

      // Send state back to the joining client
      const sanitizedSlide = getSanitizedCurrentSlide(session);
      if (callback) {
        callback({
          success: true,
          session: {
            id: session.id,
            quizTitle: session.quizTitle,
            status: session.status,
            currentSlideIndex: session.currentSlideIndex,
            currentSlide: sanitizedSlide,
            questionDeadline: session.questionDeadline,
            isLobbyLocked: session.isLobbyLocked,
            participantsCount: session.participants.length
          },
          participant
        });
      }
    });

    // 2. Host identifies socket connection
    socket.on('host:join', (payload: { sessionId: string; hostId: string }, callback) => {
      const { sessionId, hostId } = payload;
      const session = db.sessions.get(sessionId);

      if (!session || session.hostId !== hostId) {
        if (callback) callback({ success: false, error: 'Unauthorized host session' });
        return;
      }

      currentSessionId = sessionId;
      isHost = true;
      socket.join(`game:${sessionId}`);
      socket.join(`host:${sessionId}`);

      if (callback) {
        callback({
          success: true,
          session
        });
      }
    });

    // 3. Host Starts Game
    socket.on('game:start', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      session.status = 'active_question';
      session.currentSlideIndex = 0;
      session.startedAt = new Date().toISOString();

      activateSlide(io, session);
    });

    // 4. Host advances to next question / slide or jumps to specific slide
    socket.on('question:next', (payload: { sessionId: string; slideIndex?: number }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      if (typeof payload.slideIndex === 'number' && payload.slideIndex >= 0 && payload.slideIndex < session.slides.length) {
        session.currentSlideIndex = payload.slideIndex;
        session.status = 'active_question';
        activateSlide(io, session);
      } else if (session.currentSlideIndex + 1 < session.slides.length) {
        session.currentSlideIndex += 1;
        session.status = 'active_question';
        activateSlide(io, session);
      } else {
        // Quiz completed
        finishGame(io, session);
      }
    });

    // 4b. Host goes to previous question
    socket.on('question:prev', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      if (session.currentSlideIndex > 0) {
        session.currentSlideIndex -= 1;
        session.status = 'active_question';
        activateSlide(io, session);
      }
    });

    // 5. Host locks question early
    socket.on('question:lock', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      session.status = 'question_locked';
      io.to(`game:${session.id}`).emit('question:locked', {
        slideIndex: session.currentSlideIndex
      });
      io.to(`host:${session.id}`).emit('question:locked', {
        slideIndex: session.currentSlideIndex
      });
    });

    // 5b. Host unlocks question options to re-open submissions
    socket.on('question:unlock', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      session.status = 'active_question';
      io.to(`game:${session.id}`).emit('question:unlocked', {
        slideIndex: session.currentSlideIndex
      });
      io.to(`host:${session.id}`).emit('question:unlocked', {
        slideIndex: session.currentSlideIndex
      });
    });

    // 5c. Host restarts game
    socket.on('game:restart', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      session.status = 'active_question';
      session.currentSlideIndex = 0;
      session.startedAt = new Date().toISOString();
      // Reset participants scores
      session.participants.forEach(p => {
        p.score = 0;
        p.streak = 0;
        p.correctCount = 0;
        p.incorrectCount = 0;
      });
      db.answers.set(session.id, []);

      activateSlide(io, session);
    });

    // 6. Host reveals answers
    socket.on('question:reveal', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      session.status = 'answer_reveal';
      const currentSlide = session.slides[session.currentSlideIndex];
      const answersForSlide = (db.answers.get(session.id) || []).filter(a => a.slideId === currentSlide.id);

      // Distribution breakdown
      const distribution: Record<string, number> = {};
      if (currentSlide.options) {
        currentSlide.options.forEach(opt => {
          distribution[opt.id] = 0;
        });
      }
      answersForSlide.forEach(a => {
        const key = String(a.answer);
        distribution[key] = (distribution[key] || 0) + 1;
      });

      io.to(`game:${session.id}`).emit('answer:revealed', {
        slide: currentSlide, // Now includes isCorrect flag and explanation
        distribution,
        totalAnswers: answersForSlide.length,
        totalParticipants: session.participants.length
      });
    });

    // 7. Host shows leaderboard
    socket.on('leaderboard:show', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;

      session.status = 'leaderboard';
      const leaderboard = calculateLeaderboard(session);

      io.to(`game:${session.id}`).emit('leaderboard:update', {
        leaderboard,
        isFinal: false,
        slideIndex: session.currentSlideIndex,
        totalSlides: session.slides.length
      });
    });

    // 8. Participant submits an answer
    socket.on('answer:submit', (payload: { sessionId: string; participantId: string; answer: string | number | string[]; responseTimeMs: number }, callback) => {
      const { sessionId, participantId, answer, responseTimeMs } = payload;
      const session = db.sessions.get(sessionId);

      if (!session) {
        if (callback) callback({ success: false, error: 'Session not found' });
        return;
      }

      if (session.status !== 'active_question') {
        if (callback) callback({ success: false, error: 'Submissions are closed for this question' });
        return;
      }

      const currentSlide = session.slides[session.currentSlideIndex];
      if (!currentSlide) {
        if (callback) callback({ success: false, error: 'Invalid slide' });
        return;
      }

      // Check deadline with grace period (1500ms)
      const now = Date.now();
      if (session.questionDeadline && now > session.questionDeadline + 1500) {
        if (callback) callback({ success: false, error: 'Time limit exceeded' });
        return;
      }

      // Concurrency check: duplicate submission check
      let sessionAnswers = db.answers.get(sessionId);
      if (!sessionAnswers) {
        sessionAnswers = [];
        db.answers.set(sessionId, sessionAnswers);
      }

      const existingAnswer = sessionAnswers.find(a => a.participantId === participantId && a.slideId === currentSlide.id);
      if (existingAnswer) {
        if (callback) callback({ success: false, error: 'Answer already recorded' });
        return;
      }

      // Authoritative Answer Validation & Scoring
      let isCorrect = false;
      let pointsEarned = 0;

      if (currentSlide.slideType === 'multiple_choice' || currentSlide.slideType === 'true_false') {
        const correctOption = currentSlide.options?.find(o => o.isCorrect);
        if (correctOption && String(answer) === String(correctOption.id)) {
          isCorrect = true;
        }
      } else if (currentSlide.slideType === 'numeric') {
        const numVal = Number(answer);
        const expected = Number(currentSlide.expectedNumericAnswer);
        const tol = Number(currentSlide.numericTolerance || 0);
        if (!isNaN(numVal) && !isNaN(expected) && Math.abs(numVal - expected) <= tol) {
          isCorrect = true;
        }
      } else if (currentSlide.slideType === 'poll' || currentSlide.slideType === 'rating' || currentSlide.slideType === 'open_ended' || currentSlide.slideType === 'word_cloud') {
        // Participatory slides award base participation points
        isCorrect = true;
      }

      if (isCorrect) {
        const base = currentSlide.basePoints || 1000;
        const totalTime = (currentSlide.timeLimitSeconds || 20) * 1000;
        const clampedResp = Math.min(Math.max(responseTimeMs || 1000, 200), totalTime);
        const remaining = Math.max(0, totalTime - clampedResp);

        let speedFactor = 1;
        if (currentSlide.speedScoring !== false && totalTime > 0) {
          speedFactor = 0.5 + 0.5 * (remaining / totalTime);
        }

        const multiplier = currentSlide.isDoublePoints ? 2 : 1;
        pointsEarned = Math.round(base * speedFactor * multiplier);
      }

      // Record answer
      const answerRecord: AnswerRecord = {
        id: `ans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sessionId,
        participantId,
        slideId: currentSlide.id,
        answer,
        isCorrect,
        responseTimeMs,
        pointsEarned,
        submittedAt: new Date().toISOString()
      };
      sessionAnswers.push(answerRecord);
      persistAnswer(answerRecord);

      // Update Participant score & streak
      const participant = session.participants.find(p => p.id === participantId);
      if (participant) {
        participant.score += pointsEarned;
        participant.lastResponseTimeMs = responseTimeMs;
        if (isCorrect) {
          participant.correctCount += 1;
          participant.streak += 1;
        } else {
          participant.incorrectCount += 1;
          participant.streak = 0;
        }

        // If team exists, update team score
        if (participant.teamId) {
          const team = session.teams.find(t => t.id === participant.teamId);
          if (team) {
            team.totalScore += pointsEarned;
          }
        }
      }

      // Broadcast answer submission count to host
      const answersForThisSlide = sessionAnswers.filter(a => a.slideId === currentSlide.id);
      io.to(`host:${sessionId}`).emit('answer:count', {
        answeredCount: answersForThisSlide.length,
        totalParticipants: session.participants.length
      });

      if (callback) {
        callback({
          success: true,
          pointsEarned,
          isCorrect,
          newScore: participant ? participant.score : 0,
          streak: participant ? participant.streak : 0
        });
      }

      // If all participants have submitted, optionally notify host
      if (answersForThisSlide.length >= session.participants.length && session.participants.length > 0) {
        io.to(`host:${sessionId}`).emit('question:all_answered');
      }
    });

    // 9. Interactive Emoji Reaction
    socket.on('game:reaction', (payload: { sessionId: string; emoji: string; nickname?: string }) => {
      io.to(`game:${payload.sessionId}`).emit('game:reaction', {
        emoji: payload.emoji,
        nickname: payload.nickname || 'Player',
        id: Math.random().toString(36).substring(2, 9)
      });
    });

    // 10. Host toggles lobby lock
    socket.on('lobby:toggle_lock', (payload: { sessionId: string }) => {
      const session = db.sessions.get(payload.sessionId);
      if (!session) return;
      session.isLobbyLocked = !session.isLobbyLocked;
      io.to(`game:${session.id}`).emit('lobby:locked', { isLobbyLocked: session.isLobbyLocked });
    });

    // 11. Disconnect handling
    socket.on('disconnect', () => {
      if (currentSessionId && currentParticipantId) {
        const session = db.sessions.get(currentSessionId);
        if (session) {
          const p = session.participants.find(part => part.id === currentParticipantId);
          if (p) {
            p.connectionStatus = 'disconnected';
            io.to(`game:${currentSessionId}`).emit('lobby:update', {
              participants: session.participants,
              teams: session.teams,
              isLobbyLocked: session.isLobbyLocked,
              status: session.status
            });
          }
        }
      }
    });
  });
}

function activateSlide(io: SocketIOServer, session: GameSession) {
  const currentSlide = session.slides[session.currentSlideIndex];
  const now = Date.now();
  const durationMs = (currentSlide.timeLimitSeconds || 20) * 1000;

  session.currentSlideStartedAt = now;
  session.questionDeadline = now + durationMs;

  // Sanitize slide for players (do not leak isCorrect or explanation!)
  const sanitizedForPlayers: QuizSlide = {
    ...currentSlide,
    explanation: undefined,
    options: currentSlide.options ? currentSlide.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      color: opt.color
      // isCorrect is intentionally stripped!
    })) : []
  };

  // Broadcast to participants
  io.to(`game:${session.id}`).emit('question:started', {
    slideIndex: session.currentSlideIndex,
    totalSlides: session.slides.length,
    slide: sanitizedForPlayers,
    startedAt: now,
    deadline: session.questionDeadline,
    durationSeconds: currentSlide.timeLimitSeconds
  });

  // Host also gets full slide info
  io.to(`host:${session.id}`).emit('host:slide_started', {
    slideIndex: session.currentSlideIndex,
    slide: currentSlide
  });
}

function finishGame(io: SocketIOServer, session: GameSession) {
  session.status = 'completed';
  session.completedAt = new Date().toISOString();

  const leaderboard = calculateLeaderboard(session);
  const totalScore = session.participants.reduce((sum, p) => sum + p.score, 0);
  const averageScore = session.participants.length > 0 ? Math.round(totalScore / session.participants.length) : 0;

  const result: GameResult = {
    sessionId: session.id,
    quizId: session.quizId,
    quizTitle: session.quizTitle,
    totalParticipants: session.participants.length,
    averageScore,
    topParticipants: leaderboard, // Store every participant's final standing without slicing
    completedAt: session.completedAt
  };

  db.results.set(session.id, result);
  persistGameResult(result);
  persistSession(session);

  io.to(`game:${session.id}`).emit('game:completed', {
    leaderboard,
    podium: leaderboard.slice(0, 3),
    averageScore,
    totalParticipants: session.participants.length
  });
}

function calculateLeaderboard(session: GameSession): LeaderboardEntry[] {
  // Deterministic tie-breaking rules:
  // 1. Higher total score
  // 2. Higher correct answers
  // 3. Lower response time
  const sorted = [...session.participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.lastResponseTimeMs - b.lastResponseTimeMs;
  });

  return sorted.map((p, idx) => {
    const team = p.teamId ? session.teams.find(t => t.id === p.teamId) : undefined;
    return {
      participantId: p.id,
      nickname: p.nickname,
      avatarKey: p.avatarKey,
      score: p.score,
      rank: idx + 1,
      previousRank: idx + 1,
      streak: p.streak,
      lastPointsEarned: 0,
      teamId: p.teamId,
      teamName: team?.name
    };
  });
}

function getSanitizedCurrentSlide(session: GameSession): QuizSlide | null {
  if (session.status === 'waiting' || session.status === 'completed') {
    return null;
  }
  const slide = session.slides[session.currentSlideIndex];
  if (!slide) return null;

  if (session.status === 'active_question' || session.status === 'question_locked') {
    return {
      ...slide,
      explanation: undefined,
      options: slide.options ? slide.options.map(o => ({ id: o.id, text: o.text, color: o.color })) : []
    };
  }

  return slide;
}
