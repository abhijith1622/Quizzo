import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth, AuthRequest } from '../auth.js';
import { GameSession, Team } from '../../src/types/quiz.js';

const router = Router();

// Create game session
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { quizId, mode } = req.body;
  const quiz = db.quizzes.get(quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const user = db.users.get(req.user!.userId);
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const joinCode = db.generateJoinCode();

  const teams: Team[] = (mode === 'team') ? [
    { id: 'team_red', sessionId, name: 'Red Dragons', avatarKey: 'dragon', totalScore: 0, memberCount: 0 },
    { id: 'team_blue', sessionId, name: 'Blue Titans', avatarKey: 'shield', totalScore: 0, memberCount: 0 },
    { id: 'team_green', sessionId, name: 'Green Falcons', avatarKey: 'falcon', totalScore: 0, memberCount: 0 },
    { id: 'team_purple', sessionId, name: 'Purple Wizards', avatarKey: 'wand', totalScore: 0, memberCount: 0 }
  ] : [];

  const session: GameSession = {
    id: sessionId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    hostId: req.user!.userId,
    hostName: user?.displayName || 'Host',
    joinCode,
    mode: mode || 'live',
    status: 'waiting',
    currentSlideIndex: 0,
    isLobbyLocked: false,
    participants: [],
    teams,
    slides: quiz.slides,
    createdAt: new Date().toISOString()
  };

  db.sessions.set(session.id, session);
  quiz.playCount += 1;

  return res.status(201).json({ session });
});

// Get all hosted game sessions for current user (History)
router.get('/sessions/hosted', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { status, search } = req.query;

  let userSessions = Array.from(db.sessions.values()).filter(s => s.hostId === userId);

  // If status filter provided
  if (status && status !== 'all') {
    userSessions = userSessions.filter(s => s.status === String(status));
  }

  // If search filter provided
  if (search) {
    const q = String(search).toLowerCase();
    userSessions = userSessions.filter(s => 
      s.quizTitle.toLowerCase().includes(q) || 
      s.joinCode.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }

  // Sort descending by createdAt or startedAt
  userSessions.sort((a, b) => {
    const timeA = new Date(a.startedAt || a.createdAt).getTime();
    const timeB = new Date(b.startedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  const formattedSessions = userSessions.map(s => {
    const totalScore = s.participants.reduce((sum, p) => sum + (p.score || 0), 0);
    const avgScore = s.participants.length > 0 ? Math.round(totalScore / s.participants.length) : 0;
    return {
      id: s.id,
      quizId: s.quizId,
      quizTitle: s.quizTitle,
      joinCode: s.joinCode,
      mode: s.mode,
      status: s.status,
      participantCount: s.participants.length,
      averageScore: avgScore,
      slideCount: s.slides?.length || 0,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      createdAt: s.createdAt
    };
  });

  return res.json({ sessions: formattedSessions });
});

// Lookup session by join code (Protected: requires authentication)
router.get('/code/:code', requireAuth, (req: AuthRequest, res: Response) => {
  const code = String(req.params.code).trim().toUpperCase();
  let foundSession: GameSession | undefined;

  for (const session of db.sessions.values()) {
    if (session.joinCode === code && session.status !== 'completed' && session.status !== 'cancelled') {
      foundSession = session;
      break;
    }
  }

  if (!foundSession) {
    return res.status(404).json({ error: 'Invalid or expired game code' });
  }

  return res.json({
    sessionId: foundSession.id,
    quizTitle: foundSession.quizTitle,
    mode: foundSession.mode,
    status: foundSession.status,
    isLobbyLocked: foundSession.isLobbyLocked,
    teams: foundSession.teams
  });
});

// Join game verification (Protected: requires authentication)
router.post('/join', requireAuth, (req: AuthRequest, res: Response) => {
  const { code, nickname } = req.body;
  if (!code || !nickname) {
    return res.status(400).json({ error: 'Code and nickname are required' });
  }

  const cleanCode = String(code).trim().toUpperCase();
  const cleanNick = String(nickname).trim();

  let targetSession: GameSession | undefined;
  for (const session of db.sessions.values()) {
    if (session.joinCode === cleanCode && session.status !== 'completed' && session.status !== 'cancelled') {
      targetSession = session;
      break;
    }
  }

  if (!targetSession) {
    return res.status(404).json({ error: 'Game not found with this code' });
  }

  if (targetSession.isLobbyLocked) {
    return res.status(403).json({ error: 'This game lobby is currently locked' });
  }

  // Check if nickname already taken in active participants
  const nickExists = targetSession.participants.some(p => p.nickname.toLowerCase() === cleanNick.toLowerCase() && p.connectionStatus === 'connected');
  if (nickExists) {
    return res.status(409).json({ error: 'Nickname already taken in this game. Choose another nickname.' });
  }

  return res.json({
    sessionId: targetSession.id,
    quizTitle: targetSession.quizTitle,
    mode: targetSession.mode,
    teams: targetSession.teams
  });
});

// Get session details
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const session = db.sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Game session not found' });
  }
  return res.json({ session });
});

// Get game results
router.get('/:id/results', (req: Request, res: Response) => {
  const result = db.results.get(req.params.id);
  if (result) {
    return res.json({ result });
  }

  const session = db.sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Calculate ad-hoc if not marked completed
  const totalScore = session.participants.reduce((sum, p) => sum + p.score, 0);
  const avg = session.participants.length > 0 ? Math.round(totalScore / session.participants.length) : 0;
  const sortedParticipants = [...session.participants].sort((a, b) => b.score - a.score);

  return res.json({
    result: {
      sessionId: session.id,
      quizId: session.quizId,
      quizTitle: session.quizTitle,
      totalParticipants: session.participants.length,
      averageScore: avg,
      topParticipants: sortedParticipants.map((p, idx) => ({
        participantId: p.id,
        nickname: p.nickname,
        avatarKey: p.avatarKey,
        score: p.score,
        rank: idx + 1,
        previousRank: idx + 1,
        streak: p.streak,
        lastPointsEarned: 0
      })),
      completedAt: session.completedAt || new Date().toISOString()
    }
  });
});

export default router;
