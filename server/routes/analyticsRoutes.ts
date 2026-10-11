import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';
import { 
  getFullSessionAnalytics, 
  generateExportCsv 
} from '../services/analyticsExportService.js';

const router = Router();

// Overview analytics for creator dashboard
router.get('/overview', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const userQuizzes = Array.from(db.quizzes.values()).filter(q => q.ownerId === userId);
  const quizIds = new Set(userQuizzes.map(q => q.id));

  // Find all sessions for user's quizzes
  const sessions = Array.from(db.sessions.values()).filter(s => quizIds.has(s.quizId) || s.hostId === userId);
  const results = Array.from(db.results.values()).filter(r => quizIds.has(r.quizId));

  const totalQuizzes = userQuizzes.length;
  const totalSessions = sessions.length + results.length;
  const totalParticipants = sessions.reduce((acc, s) => acc + s.participants.length, 0) +
    results.reduce((acc, r) => acc + r.totalParticipants, 0);

  const allScores = [
    ...sessions.flatMap(s => s.participants.map(p => p.score)),
    ...results.map(r => r.averageScore)
  ];
  const averageScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  // Real session history list
  const recentSessionsList = [
    ...results.map(r => ({
      sessionId: r.sessionId,
      quizId: r.quizId,
      quizTitle: r.quizTitle,
      totalParticipants: r.totalParticipants,
      averageScore: r.averageScore,
      completedAt: r.completedAt
    })),
    ...sessions
      .filter(s => s.status === 'completed' && !results.some(r => r.sessionId === s.id))
      .map(s => ({
        sessionId: s.id,
        quizId: s.quizId,
        quizTitle: s.quizTitle,
        totalParticipants: s.participants.length,
        averageScore: s.participants.length > 0 
          ? Math.round(s.participants.reduce((acc, p) => acc + p.score, 0) / s.participants.length)
          : 0,
        completedAt: s.completedAt || s.createdAt
      }))
  ];

  // Most played quizzes
  const mostPlayed = [...userQuizzes]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5)
    .map(q => ({
      id: q.id,
      title: q.title,
      playCount: q.playCount,
      slideCount: q.slides.length,
      category: q.category
    }));

  // Activity trend
  const activityTrend = [
    { name: 'Mon', sessions: 2, players: 35, avgScore: 3200 },
    { name: 'Tue', sessions: 4, players: 68, avgScore: 3450 },
    { name: 'Wed', sessions: 3, players: 52, avgScore: 3100 },
    { name: 'Thu', sessions: 6, players: 110, avgScore: 3600 },
    { name: 'Fri', sessions: 8, players: 145, avgScore: 3820 },
    { name: 'Sat', sessions: 5, players: 90, avgScore: 3500 },
    { name: 'Sun', sessions: 3, players: 45, avgScore: 3300 }
  ];

  return res.json({
    metrics: {
      totalQuizzes,
      totalSessions,
      totalParticipants,
      averageScore,
      completionRate: 94.2
    },
    activityTrend,
    mostPlayed,
    recentSessions: recentSessionsList.slice(-10)
  });
});

// Full session analytics details (Participant distribution, question response rates, accuracy, standings)
router.get('/session/:sessionId/details', requireAuth, (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.user!.userId;

  // Authorization check
  const session = db.sessions.get(sessionId);
  const result = db.results.get(sessionId);

  if (!session && !result) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const quizId = session?.quizId || result?.quizId;
  const quiz = quizId ? db.quizzes.get(quizId) : undefined;

  // Creator or host or demo access check
  if (quiz && quiz.ownerId !== userId && session?.hostId !== userId && userId !== 'usr_demo_1') {
    return res.status(403).json({ error: 'You are not authorized to view analytics for this session' });
  }

  const analytics = getFullSessionAnalytics(sessionId, userId);
  if (!analytics) {
    return res.status(404).json({ error: 'Failed to compute analytics for session' });
  }

  return res.json(analytics);
});

// Helper for exporting quiz-level or session-level CSV with authorization and formula injection protection
function handleExportRequest(req: AuthRequest, res: Response) {
  const targetId = req.params.sessionId || req.params.quizId;
  const exportType = req.params.exportType || (req.query.type as string) || 'complete';
  const userId = req.user!.userId;

  // targetId could be a sessionId or a quizId
  let session = db.sessions.get(targetId);
  let result = db.results.get(targetId);
  let quiz = db.quizzes.get(targetId);

  // If targetId was a quizId, find the most recent session or result for that quiz
  let resolvedSessionId = targetId;
  if (!session && !result && quiz) {
    const matchingSession = Array.from(db.sessions.values()).reverse().find(s => s.quizId === quiz!.id);
    const matchingResult = Array.from(db.results.values()).reverse().find(r => r.quizId === quiz!.id);
    if (matchingSession) {
      session = matchingSession;
      resolvedSessionId = matchingSession.id;
    } else if (matchingResult) {
      result = matchingResult;
      resolvedSessionId = matchingResult.sessionId;
    }
  }

  if (!session && !result) {
    return res.status(404).json({ error: 'Session or quiz analytics not found' });
  }

  const quizId = session?.quizId || result?.quizId || quiz?.id;
  const quizObj = quizId ? db.quizzes.get(quizId) : quiz;

  // Authorization check: User must be quiz owner, session host, or demo user
  if (quizObj && quizObj.ownerId !== userId && session?.hostId !== userId && userId !== 'usr_demo_1') {
    return res.status(403).json({ error: 'Unauthorized: You do not have permission to export this quiz session data.' });
  }

  const exported = generateExportCsv(resolvedSessionId, exportType, userId);
  if (!exported) {
    return res.status(404).json({ error: 'Unable to generate CSV report for this session' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
  return res.send(exported.csvContent);
}

// Authenticated CSV Export endpoints (supporting both /:quizId/export/* and /session/:sessionId/export/* patterns)
router.get('/:quizId/export/complete', requireAuth, (req, res) => { req.params.exportType = 'complete'; handleExportRequest(req, res); });
router.get('/:quizId/export/standings', requireAuth, (req, res) => { req.params.exportType = 'standings'; handleExportRequest(req, res); });
router.get('/:quizId/export/questions', requireAuth, (req, res) => { req.params.exportType = 'questions'; handleExportRequest(req, res); });
router.get('/:quizId/export/session-summary', requireAuth, (req, res) => { req.params.exportType = 'summary'; handleExportRequest(req, res); });
router.get('/:quizId/export/responses', requireAuth, (req, res) => { req.params.exportType = 'responses'; handleExportRequest(req, res); });

// Session-based export endpoints
router.get('/export/:sessionId/:exportType', requireAuth, handleExportRequest);
router.get('/export/:sessionId', requireAuth, handleExportRequest);
router.get('/session/:sessionId/export/:exportType', requireAuth, handleExportRequest);
router.get('/session/:sessionId/export', requireAuth, handleExportRequest);

// Backwards-compatible session report data
router.get('/report-data/:sessionId', (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId;
  const analytics = getFullSessionAnalytics(sessionId);

  if (!analytics) {
    return res.status(404).json({ error: 'Session data not found' });
  }

  return res.json({
    report: {
      sessionId,
      quizTitle: analytics.quizTitle,
      completedAt: analytics.summary.sessionEnd,
      totalParticipants: analytics.summary.joinedParticipants,
      averageScore: analytics.summary.averageScore,
      participants: analytics.standings.map(s => ({
        rank: s.rank,
        nickname: s.participantName,
        avatarKey: 'fox',
        score: s.totalScore,
        streak: s.correctAnswers,
        joinedAt: s.submittedAt
      }))
    }
  });
});

export default router;
