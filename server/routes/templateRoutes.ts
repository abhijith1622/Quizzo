import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';
import { Quiz, QuizSlide } from '../../src/types/quiz.js';

const router = Router();

// Get all templates
router.get('/', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let templates = Array.from(db.templates.values());

  if (category && category !== 'All') {
    templates = templates.filter(t => t.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    templates = templates.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  return res.json({ templates });
});

// Get single template
router.get('/:id', (req: Request, res: Response) => {
  const template = db.templates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  return res.json({ template });
});

// Use template to create a new quiz for the creator
router.post('/:id/use', requireAuth, (req: AuthRequest, res: Response) => {
  const template = db.templates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const user = db.users.get(req.user!.userId);
  const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const slides: QuizSlide[] = template.slides.map((s, idx) => ({
    id: `slide_${Date.now()}_${idx}`,
    quizId,
    position: idx,
    slideType: s.slideType || 'multiple_choice',
    title: s.title || `Question ${idx + 1}`,
    content: s.content,
    timeLimitSeconds: s.timeLimitSeconds || 20,
    basePoints: s.basePoints || 1000,
    speedScoring: s.speedScoring !== false,
    explanation: s.explanation,
    options: s.options?.map((opt, oIdx) => ({
      id: opt.id || `opt_${idx}_${oIdx}`,
      text: opt.text,
      isCorrect: opt.isCorrect,
      color: opt.color
    })),
    expectedNumericAnswer: s.expectedNumericAnswer,
    numericTolerance: s.numericTolerance,
    ratingMin: s.ratingMin,
    ratingMax: s.ratingMax,
    ratingMinLabel: s.ratingMinLabel,
    ratingMaxLabel: s.ratingMaxLabel,
    openEndedMaxChars: s.openEndedMaxChars,
    wordCloudMaxWords: s.wordCloudMaxWords
  }));

  const newQuiz: Quiz = {
    id: quizId,
    ownerId: req.user!.userId,
    ownerName: user?.displayName || 'Creator',
    title: template.title,
    description: template.description,
    coverImageUrl: template.coverImageUrl,
    category: template.category,
    tags: [...template.tags],
    language: 'English',
    visibility: 'public',
    status: 'draft',
    settings: {
      randomizeQuestions: false,
      randomizeOptions: false,
      showCorrectAnswerImmediately: true,
      allowTeamMode: true,
      soundEffectsEnabled: true
    },
    slides,
    playCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.quizzes.set(newQuiz.id, newQuiz);

  return res.status(201).json({ quiz: newQuiz });
});

export default router;
