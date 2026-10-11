import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth, AuthRequest } from '../auth.js';
import { Quiz, QuizSlide } from '../../src/types/quiz.js';
import { persistQuiz, removeQuiz } from '../mongoService.js';

const router = Router();

// List quizzes
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { category, search, filter } = req.query;

  let list = Array.from(db.quizzes.values());

  if (filter === 'mine' && userId) {
    list = list.filter(q => q.ownerId === userId);
  } else if (!userId) {
    list = list.filter(q => q.visibility === 'public');
  } else if (filter !== 'all') {
    // Show user's quizzes plus public quizzes
    list = list.filter(q => q.ownerId === userId || q.visibility === 'public');
  }

  if (category && category !== 'All') {
    list = list.filter(q => q.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(quiz => quiz.title.toLowerCase().includes(q) || quiz.description.toLowerCase().includes(q));
  }

  // Sort by updatedAt descending
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.json({ quizzes: list });
});

// Get single quiz
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const quiz = db.quizzes.get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  return res.json({ quiz });
});

// Create quiz
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, description, category, tags, language, visibility, settings, slides, coverImageUrl } = req.body;
  const user = db.users.get(req.user!.userId);

  const initialSlides: QuizSlide[] = Array.isArray(slides) && slides.length > 0 ? slides : [
    {
      id: `slide_${Date.now()}_1`,
      quizId: '',
      position: 0,
      slideType: 'multiple_choice',
      title: 'What is the answer to this question?',
      timeLimitSeconds: 20,
      basePoints: 1000,
      speedScoring: true,
      options: [
        { id: 'opt_1', text: 'Option A', isCorrect: true, color: '#3B82F6' },
        { id: 'opt_2', text: 'Option B', isCorrect: false, color: '#EF4444' },
        { id: 'opt_3', text: 'Option C', isCorrect: false, color: '#F59E0B' },
        { id: 'opt_4', text: 'Option D', isCorrect: false, color: '#10B981' }
      ]
    }
  ];

  const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const preparedSlides = initialSlides.map((s, idx) => ({
    ...s,
    id: s.id || `slide_${Date.now()}_${idx}`,
    quizId,
    position: idx
  }));

  const newQuiz: Quiz = {
    id: quizId,
    ownerId: req.user!.userId,
    ownerName: user?.displayName || 'Creator',
    title: (title || 'Untitled Quiz').trim(),
    description: (description || 'Interactive quiz challenge').trim(),
    coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    category: category || 'General Knowledge',
    tags: Array.isArray(tags) ? tags : ['Quiz'],
    language: language || 'English',
    visibility: visibility || 'public',
    status: 'draft',
    settings: settings || {
      randomizeQuestions: false,
      randomizeOptions: false,
      showCorrectAnswerImmediately: true,
      allowTeamMode: true,
      soundEffectsEnabled: true
    },
    slides: preparedSlides,
    playCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.quizzes.set(newQuiz.id, newQuiz);
  persistQuiz(newQuiz);
  return res.status(201).json({ quiz: newQuiz });
});

// Update quiz
router.patch('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const quiz = db.quizzes.get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Permission check: only owner or admin can edit
  if (quiz.ownerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this quiz' });
  }

  const { title, description, category, tags, language, visibility, status, settings, slides, coverImageUrl } = req.body;
  if (title !== undefined) quiz.title = title;
  if (description !== undefined) quiz.description = description;
  if (category !== undefined) quiz.category = category;
  if (tags !== undefined) quiz.tags = tags;
  if (language !== undefined) quiz.language = language;
  if (visibility !== undefined) quiz.visibility = visibility;
  if (status !== undefined) quiz.status = status;
  if (settings !== undefined) quiz.settings = { ...quiz.settings, ...settings };
  if (coverImageUrl !== undefined) quiz.coverImageUrl = coverImageUrl;
  if (Array.isArray(slides)) {
    quiz.slides = slides.map((s, idx) => ({
      ...s,
      position: idx,
      quizId: quiz.id
    }));
  }
  quiz.updatedAt = new Date().toISOString();

  persistQuiz(quiz);
  return res.json({ quiz });
});

// Duplicate quiz
router.post('/:id/duplicate', requireAuth, (req: AuthRequest, res: Response) => {
  const quiz = db.quizzes.get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const user = db.users.get(req.user!.userId);
  const newQuizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const duplicatedSlides = quiz.slides.map((s, idx) => ({
    ...s,
    id: `slide_${Date.now()}_${idx}`,
    quizId: newQuizId,
    position: idx
  }));

  const duplicatedQuiz: Quiz = {
    ...quiz,
    id: newQuizId,
    title: `${quiz.title} (Copy)`,
    ownerId: req.user!.userId,
    ownerName: user?.displayName || 'Creator',
    status: 'draft',
    playCount: 0,
    slides: duplicatedSlides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.quizzes.set(duplicatedQuiz.id, duplicatedQuiz);
  persistQuiz(duplicatedQuiz);
  return res.status(201).json({ quiz: duplicatedQuiz });
});

// Publish quiz
router.post('/:id/publish', requireAuth, (req: AuthRequest, res: Response) => {
  const quiz = db.quizzes.get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  if (quiz.ownerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (quiz.slides.length === 0) {
    return res.status(400).json({ error: 'Quiz must have at least one slide to publish' });
  }

  quiz.status = 'published';
  quiz.updatedAt = new Date().toISOString();
  persistQuiz(quiz);
  return res.json({ quiz });
});

// Delete quiz
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const quiz = db.quizzes.get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  if (quiz.ownerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.quizzes.delete(req.params.id);
  removeQuiz(req.params.id);
  return res.json({ message: 'Quiz deleted successfully' });
});

export default router;
