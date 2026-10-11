import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Play, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Image, 
  Layers, 
  ChevronRight, 
  Check, 
  ArrowLeft,
  Settings,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Quiz, QuizSlide, SlideType, SlideOption } from '../../types/quiz';
import { sounds } from '../../utils/effects';

const SLIDE_TYPES: { type: SlideType; label: string; icon: string; desc: string }[] = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: '🔘', desc: 'Up to 6 options with 1 or more correct' },
  { type: 'true_false', label: 'True / False', icon: '⚖️', desc: 'Fast binary response check' },
  { type: 'numeric', label: 'Numeric', icon: '🔢', desc: 'Exact number or tolerance range' },
  { type: 'poll', label: 'Poll Survey', icon: '📊', desc: 'Anonymous voting & percentage share' },
  { type: 'rating', label: 'Rating Scale', icon: '⭐', desc: '1 to 5 scale feedback' },
  { type: 'open_ended', label: 'Open Ended', icon: '💬', desc: 'Free text submissions' },
  { type: 'word_cloud', label: 'Word Cloud', icon: '☁️', desc: 'Real-time collective word frequency' },
  { type: 'content', label: 'Content Slide', icon: '📄', desc: 'Informational title, notes, or break' }
];

const PRESET_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

export const QuizEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load quiz from server or scaffold new
  useEffect(() => {
    if (!id || id === 'new') {
      // Create new quiz template
      api.createQuiz({
        title: 'New Interactive Quiz',
        description: 'An exciting interactive challenge for participants',
        category: 'General Knowledge',
        slides: [
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
        ]
      }).then(res => {
        setQuiz(res.quiz);
        navigate(`/dashboard/quizzes/${res.quiz.id}/edit`, { replace: true });
      }).catch(err => console.error(err));
    } else {
      api.getQuiz(id).then(res => {
        setQuiz(res.quiz);
      }).catch(err => {
        console.error(err);
        setErrorMsg('Failed to load quiz');
      });
    }
  }, [id]);

  // Debounced Auto-save
  useEffect(() => {
    if (!quiz || saveStatus !== 'unsaved') return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await api.updateQuiz(quiz.id, quiz);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('unsaved');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [quiz, saveStatus]);

  // Update current slide helper
  const updateCurrentSlide = (updates: Partial<QuizSlide>) => {
    if (!quiz) return;
    const slides = [...quiz.slides];
    slides[activeSlideIndex] = { ...slides[activeSlideIndex], ...updates };
    setQuiz({ ...quiz, slides });
    setSaveStatus('unsaved');
  };

  // Add Slide
  const handleAddSlide = (type: SlideType) => {
    if (!quiz) return;
    const newSlide: QuizSlide = {
      id: `slide_${Date.now()}_${quiz.slides.length}`,
      quizId: quiz.id,
      position: quiz.slides.length,
      slideType: type,
      title: type === 'content' ? 'Information & Guidelines' : 'Type your question prompt here...',
      timeLimitSeconds: 20,
      basePoints: type === 'content' ? 0 : 1000,
      speedScoring: true,
      options: type === 'multiple_choice' ? [
        { id: `opt_${Date.now()}_1`, text: 'Option 1', isCorrect: true, color: '#3B82F6' },
        { id: `opt_${Date.now()}_2`, text: 'Option 2', isCorrect: false, color: '#EF4444' },
        { id: `opt_${Date.now()}_3`, text: 'Option 3', isCorrect: false, color: '#F59E0B' },
        { id: `opt_${Date.now()}_4`, text: 'Option 4', isCorrect: false, color: '#10B981' }
      ] : type === 'true_false' ? [
        { id: 'tf_1', text: 'True', isCorrect: true, color: '#3B82F6' },
        { id: 'tf_2', text: 'False', isCorrect: false, color: '#EF4444' }
      ] : type === 'poll' ? [
        { id: 'p_1', text: 'Choice 1', color: '#3B82F6' },
        { id: 'p_2', text: 'Choice 2', color: '#EF4444' }
      ] : [],
      expectedNumericAnswer: type === 'numeric' ? 42 : undefined,
      numericTolerance: type === 'numeric' ? 0 : undefined,
      ratingMin: type === 'rating' ? 1 : undefined,
      ratingMax: type === 'rating' ? 5 : undefined,
      ratingMinLabel: type === 'rating' ? 'Low' : undefined,
      ratingMaxLabel: type === 'rating' ? 'High' : undefined
    };

    const updatedSlides = [...quiz.slides, newSlide];
    setQuiz({ ...quiz, slides: updatedSlides });
    setActiveSlideIndex(updatedSlides.length - 1);
    setShowAddTypeModal(false);
    setSaveStatus('unsaved');
    sounds.playClick();
  };

  // Delete Slide
  const handleDeleteSlide = (indexToDelete: number) => {
    if (!quiz || quiz.slides.length <= 1) return;
    const filtered = quiz.slides.filter((_, idx) => idx !== indexToDelete);
    setQuiz({ ...quiz, slides: filtered });
    setActiveSlideIndex(Math.max(0, indexToDelete - 1));
    setSaveStatus('unsaved');
  };

  // Duplicate Slide
  const handleDuplicateSlide = (indexToDup: number) => {
    if (!quiz) return;
    const target = quiz.slides[indexToDup];
    const duplicated: QuizSlide = {
      ...target,
      id: `slide_${Date.now()}_dup`,
      title: `${target.title} (Copy)`,
      options: target.options?.map((o, idx) => ({ ...o, id: `opt_${Date.now()}_${idx}` }))
    };
    const updated = [...quiz.slides];
    updated.splice(indexToDup + 1, 0, duplicated);
    setQuiz({ ...quiz, slides: updated });
    setActiveSlideIndex(indexToDup + 1);
    setSaveStatus('unsaved');
  };

  // Reorder Slide (up / down)
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (!quiz) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= quiz.slides.length) return;

    const slides = [...quiz.slides];
    const temp = slides[index];
    slides[index] = slides[targetIdx];
    slides[targetIdx] = temp;

    setQuiz({ ...quiz, slides });
    setActiveSlideIndex(targetIdx);
    setSaveStatus('unsaved');
  };

  // Save & Publish
  const handlePublish = async () => {
    if (!quiz) return;
    try {
      setSaveStatus('saving');
      await api.publishQuiz(quiz.id);
      setQuiz({ ...quiz, status: 'published' });
      setSaveStatus('saved');
      sounds.playCorrect();
    } catch (err) {
      console.error(err);
    }
  };

  // Start Host Live
  const handleHostGame = async () => {
    if (!quiz) return;
    try {
      await api.updateQuiz(quiz.id, quiz);
      const res = await api.createGame(quiz.id, 'live');
      navigate(`/host/${res.session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const currentSlide = quiz.slides[activeSlideIndex] || quiz.slides[0];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* 1. TOP TOOLBAR */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/quizzes')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Back to Quizzes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => {
              setQuiz({ ...quiz, title: e.target.value });
              setSaveStatus('unsaved');
            }}
            className="font-bold text-base bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 py-1 rounded-md border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none max-w-sm truncate"
          />
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            quiz.status === 'published' 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
          }`}>
            {quiz.status}
          </span>
          <span className="text-xs text-slate-400">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/play/${quiz.id}/solo`)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Preview Solo
          </button>
          <button
            onClick={handlePublish}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
          >
            Publish Quiz
          </button>
          <button
            onClick={handleHostGame}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Host Live Game
          </button>
        </div>
      </div>

      {/* 2. THREE-PANEL STUDIO LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: SLIDE LIST TRAY */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Slides ({quiz.slides.length})
            </span>
            <button
              onClick={() => setShowAddTypeModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2 py-1 rounded-md"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Slide
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {quiz.slides.map((s, idx) => {
              const isActive = idx === activeSlideIndex;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive 
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-bold">#{idx + 1}</span>
                    <span className="capitalize">{s.slideType.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {s.title || 'Untitled question'}
                  </p>

                  {/* Reorder and Delete Controls */}
                  <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, 'up'); }}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, 'down'); }}
                        disabled={idx === quiz.slides.length - 1}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateSlide(idx); }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {quiz.slides.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSlide(idx); }}
                          className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER PANEL: VISUAL QUESTION & OPTIONS EDITOR */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col items-center">
          <div className="max-w-2xl w-full space-y-6">
            {/* Question Prompt Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question / Slide Statement
              </label>
              <textarea
                rows={2}
                value={currentSlide.title}
                onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                placeholder="Type your question prompt here..."
                className="w-full text-lg sm:text-xl font-bold p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Slide Type Specific Configuration */}
            {/* 1. Multiple Choice Options */}
            {currentSlide.slideType === 'multiple_choice' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Answer Options (Check the correct answer)
                  </label>
                  {(currentSlide.options?.length || 0) < 6 && (
                    <button
                      onClick={() => {
                        const opts = currentSlide.options || [];
                        const newOpt: SlideOption = {
                          id: `opt_${Date.now()}_${opts.length}`,
                          text: `Option ${opts.length + 1}`,
                          isCorrect: false,
                          color: PRESET_COLORS[opts.length % PRESET_COLORS.length]
                        };
                        updateCurrentSlide({ options: [...opts, newOpt] });
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentSlide.options?.map((opt, oIdx) => (
                    <div
                      key={opt.id}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                        opt.isCorrect 
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = currentSlide.options?.map((o, idx) => ({
                            ...o,
                            isCorrect: idx === oIdx
                          }));
                          updateCurrentSlide({ options: updated });
                        }}
                        className={`h-6 w-6 rounded-lg flex items-center justify-center border font-bold text-xs cursor-pointer ${
                          opt.isCorrect 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 dark:border-slate-700 text-slate-400'
                        }`}
                        title="Mark as correct answer"
                      >
                        {opt.isCorrect ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + oIdx)}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = currentSlide.options?.map((o, idx) => idx === oIdx ? { ...o, text: e.target.value } : o);
                          updateCurrentSlide({ options: updated });
                        }}
                        className="flex-1 font-semibold text-sm bg-transparent focus:outline-none"
                      />

                      {(currentSlide.options?.length || 0) > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = currentSlide.options?.filter((_, idx) => idx !== oIdx);
                            updateCurrentSlide({ options: updated });
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. True / False Selection */}
            {currentSlide.slideType === 'true_false' && (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Correct Answer
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {currentSlide.options?.map((opt, oIdx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const updated = currentSlide.options?.map((o, idx) => ({
                          ...o,
                          isCorrect: idx === oIdx
                        }));
                        updateCurrentSlide({ options: updated });
                      }}
                      className={`p-6 rounded-2xl border text-center font-black text-xl transition-all cursor-pointer ${
                        opt.isCorrect
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.text} {opt.isCorrect && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Numeric Settings */}
            {currentSlide.slideType === 'numeric' && (
              <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                      Expected Number
                    </label>
                    <input
                      type="number"
                      value={currentSlide.expectedNumericAnswer ?? ''}
                      onChange={(e) => updateCurrentSlide({ expectedNumericAnswer: Number(e.target.value) })}
                      className="w-full font-mono text-xl font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                      Allowed Tolerance (±)
                    </label>
                    <input
                      type="number"
                      value={currentSlide.numericTolerance ?? 0}
                      onChange={(e) => updateCurrentSlide({ numericTolerance: Number(e.target.value) })}
                      className="w-full font-mono text-xl font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Explanation box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Explanation / Did You Know? (Shown after reveal)
              </label>
              <textarea
                rows={2}
                value={currentSlide.explanation || ''}
                onChange={(e) => updateCurrentSlide({ explanation: e.target.value })}
                placeholder="Give learners extra context on why this answer is right..."
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: QUESTION SETTINGS */}
        <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-6 overflow-y-auto shrink-0">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="h-4 w-4 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Slide Settings</h3>
          </div>

          {/* Time Limit Setting */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Time Limit (Seconds)
              </label>
              <span className="text-xs font-black font-mono text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                {currentSlide.timeLimitSeconds}s
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 15, 20, 30, 45, 60].map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateCurrentSlide({ timeLimitSeconds: sec })}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    currentSlide.timeLimitSeconds === sec
                      ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Manual Custom Time Input */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Clock className="h-4 w-4 text-blue-700 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none mb-1">Manual Time</span>
                <input
                  type="number"
                  min={5}
                  max={600}
                  step={1}
                  value={currentSlide.timeLimitSeconds}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    if (!isNaN(parsed)) {
                      updateCurrentSlide({ timeLimitSeconds: Math.max(1, parsed) });
                    }
                  }}
                  className="w-full font-mono font-black text-sm bg-transparent border-none p-0 focus:outline-none text-slate-900 dark:text-white"
                  placeholder="Set custom seconds"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">sec</span>
            </div>
          </div>

          {/* Base Points / Score Setting */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Question Score / Points
              </label>
              <span className="text-xs font-black font-mono text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                {currentSlide.basePoints} pts
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {[500, 1000, 2000].map(pts => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => updateCurrentSlide({ basePoints: pts })}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    currentSlide.basePoints === pts
                      ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>

            {/* Manual Custom Score Input */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Zap className="h-4 w-4 text-blue-700 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none mb-1">Manual Score</span>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  step={50}
                  value={currentSlide.basePoints}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    if (!isNaN(parsed)) {
                      updateCurrentSlide({ basePoints: Math.max(0, parsed) });
                    }
                  }}
                  className="w-full font-mono font-black text-sm bg-transparent border-none p-0 focus:outline-none text-slate-900 dark:text-white"
                  placeholder="Set custom points"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">pts</span>
            </div>
          </div>

          {/* Scoring modifiers */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Speed Scoring Factor</span>
              <input
                type="checkbox"
                checked={currentSlide.speedScoring !== false}
                onChange={(e) => updateCurrentSlide({ speedScoring: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Double Points (2x)</span>
              <input
                type="checkbox"
                checked={Boolean(currentSlide.isDoublePoints)}
                onChange={(e) => updateCurrentSlide({ isDoublePoints: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </aside>
      </div>

      {/* ADD SLIDE TYPE MODAL */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Choose Slide Type
              </h3>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {SLIDE_TYPES.map(st => (
                <button
                  key={st.type}
                  onClick={() => handleAddSlide(st.type)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-all"
                >
                  <span className="text-2xl block mb-1">{st.icon}</span>
                  <span className="font-bold text-sm block text-slate-900 dark:text-white">{st.label}</span>
                  <span className="text-[11px] text-slate-500 leading-tight block">{st.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
