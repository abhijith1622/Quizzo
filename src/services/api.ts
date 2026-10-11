import { Quiz, QuizTemplate, User, GameSession, GameResult } from '../types/quiz';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('quizzo_token') || localStorage.getItem('pulsequiz_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(email: string, password: string, displayName: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    return handleResponse(res);
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async loginWithGoogle(data: { credential?: string; accessToken?: string; email?: string; displayName?: string; avatarUrl?: string; googleId?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateProfile(updates: { displayName?: string; avatarUrl?: string; preferredTheme?: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  // Quizzes
  async getQuizzes(params?: { category?: string; search?: string; filter?: string }): Promise<{ quizzes: Quiz[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.filter) query.append('filter', params.filter);

    const res = await fetch(`${API_BASE}/quizzes?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getQuiz(id: string): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createQuiz(quizData: Partial<Quiz>): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(quizData)
    });
    return handleResponse(res);
  },

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  async duplicateQuiz(id: string): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes/${id}/duplicate`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async publishQuiz(id: string): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/quizzes/${id}/publish`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async deleteQuiz(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Games
  async createGame(quizId: string, mode: string = 'live'): Promise<{ session: GameSession }> {
    const res = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ quizId, mode })
    });
    return handleResponse(res);
  },

  async getGameSession(id: string): Promise<{ session: GameSession }> {
    const res = await fetch(`${API_BASE}/games/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async lookupGameCode(code: string): Promise<{ sessionId: string; quizTitle: string; mode: string; status: string; isLobbyLocked: boolean; teams: any[] }> {
    const res = await fetch(`${API_BASE}/games/code/${encodeURIComponent(code)}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async joinGame(code: string, nickname: string): Promise<{ sessionId: string; quizTitle: string; mode: string; teams: any[] }> {
    const res = await fetch(`${API_BASE}/games/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ code, nickname })
    });
    return handleResponse(res);
  },

  async getGameResults(id: string): Promise<{ result: GameResult }> {
    const res = await fetch(`${API_BASE}/games/${id}/results`);
    return handleResponse(res);
  },

  async getHostedSessions(params?: { status?: string; search?: string }): Promise<{ sessions: any[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/games/sessions/hosted?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },


  // Templates
  async getTemplates(params?: { category?: string; search?: string }): Promise<{ templates: QuizTemplate[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/templates?${query.toString()}`);
    return handleResponse(res);
  },

  async getTemplate(id: string): Promise<{ template: QuizTemplate }> {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    return handleResponse(res);
  },

  async useTemplate(id: string): Promise<{ quiz: Quiz }> {
    const res = await fetch(`${API_BASE}/templates/${id}/use`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalyticsOverview(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSessionAnalytics(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/session/${sessionId}/details`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getSessionReportData(sessionId: string): Promise<{ report: any }> {
    const res = await fetch(`${API_BASE}/analytics/report-data/${sessionId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async downloadSessionCsv(sessionId: string, exportType: string = 'complete'): Promise<void> {
    const res = await fetch(`${API_BASE}/analytics/export/${sessionId}/${exportType}`, {
      headers: { ...getAuthHeader() }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || `Failed to download CSV (${res.status})`);
    }

    // Extract filename from Content-Disposition header if available
    let filename = `quizzo-${exportType}-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`;
    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  getExportCsvUrl(sessionId: string, exportType: string = 'complete'): string {
    return `${API_BASE}/analytics/export/${sessionId}/${exportType}`;
  }
};
