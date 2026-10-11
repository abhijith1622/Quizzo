import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Clock, 
  Layers, 
  ArrowRight, 
  Check, 
  Copy,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { QuizTemplate } from '../../types/quiz';
import { useAuth } from '../../contexts/AuthContext';
import { sounds } from '../../utils/effects';

export const TemplatesPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<QuizTemplate | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.getTemplates({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() || undefined
      });
      setTemplates(res.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    setCloningId(templateId);
    sounds.playClick();
    try {
      if (!user) {
        await loginAsDemo();
      }
      const res = await api.useTemplate(templateId);
      sounds.playCorrect();
      navigate(`/dashboard/quizzes/${res.quiz.id}/edit`);
    } catch (err) {
      console.error(err);
      setCloningId(null);
    }
  };

  const categories = ['All', 'Technology', 'Science', 'Team Building', 'Cybersecurity'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Pre-Built Games
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Curated Quiz Templates
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Jumpstart your live gathering with ready-to-play trivia, team icebreakers, and technical challenges.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={tmpl.coverImageUrl}
                      alt={tmpl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-sm">
                        {tmpl.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>{tmpl.category}</span>
                      <span>•</span>
                      <span>{tmpl.questionCount} Questions</span>
                      <span>•</span>
                      <span>~{tmpl.estimatedDurationMinutes} mins</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedTemplate(tmpl)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:underline"
                  >
                    Preview Questions
                  </button>
                  <button
                    onClick={() => handleUseTemplate(tmpl.id)}
                    disabled={cloningId === tmpl.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {cloningId === tmpl.id ? 'Cloning...' : 'Use Template'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                    {selectedTemplate.category} • {selectedTemplate.difficulty}
                  </span>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {selectedTemplate.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {selectedTemplate.slides.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Question #{idx + 1}</span>
                      <span className="capitalize">{s.slideType?.replace('_', ' ')}</span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.title}</h5>
                    {s.explanation && (
                      <p className="text-xs text-slate-500 pt-1">{s.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUseTemplate(selectedTemplate.id);
                    setSelectedTemplate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                >
                  Use This Template Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
