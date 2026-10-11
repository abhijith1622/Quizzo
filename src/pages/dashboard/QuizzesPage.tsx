import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Play, 
  Gamepad2, 
  Edit3, 
  Copy, 
  Trash2, 
  Search, 
  Filter, 
  Layers 
} from 'lucide-react';
import { api } from '../../services/api';
import { Quiz } from '../../types/quiz';
import { sounds } from '../../utils/effects';

export const QuizzesPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, [category]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.getQuizzes({
        category: category !== 'All' ? category : undefined,
        search: search.trim() || undefined
      });
      setQuizzes(res.quizzes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHostGame = async (quizId: string) => {
    try {
      const res = await api.createGame(quizId, 'live');
      sounds.playClick();
      navigate(`/host/${res.session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (quizId: string) => {
    try {
      await api.duplicateQuiz(quizId);
      sounds.playClick();
      loadQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (quizId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteQuiz(quizId);
      sounds.playClick();
      loadQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = quizzes.filter(q => {
    if (!search) return true;
    const term = search.toLowerCase();
    return q.title.toLowerCase().includes(term) || q.description.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Quiz Management
          </h1>
          <p className="text-xs text-slate-500">
            Create, customize, host live multiplayer games, or test solo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/quizzes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Create Quiz
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Technology', 'Science', 'Cybersecurity', 'General Knowledge'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <Layers className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No quizzes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a fresh quiz challenge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(q => (
            <div
              key={q.id}
              className="flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div>
                <div className="h-36 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={q.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                    alt={q.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      q.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span>{q.category}</span>
                    <span>•</span>
                    <span>{q.slides.length} Questions</span>
                    <span>•</span>
                    <span>{q.playCount} Plays</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                    {q.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {q.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHostGame(q.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Host Live
                  </button>
                  <Link
                    to={`/play/${q.id}/solo`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    <Gamepad2 className="h-3 w-3 text-indigo-500" />
                    Solo
                  </Link>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/dashboard/quizzes/${q.id}/edit`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit in Studio"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Duplicate Quiz"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id, q.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Quiz"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
