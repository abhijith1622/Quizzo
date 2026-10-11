import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/quiz';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: (data: { credential?: string; accessToken?: string; email?: string; displayName?: string; avatarUrl?: string; googleId?: string }) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: { displayName?: string; avatarUrl?: string; preferredTheme?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('quizzo_token') || localStorage.getItem('pulsequiz_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('quizzo_token') || localStorage.getItem('pulsequiz_token');
      if (storedToken) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.warn('Failed to restore user from token:', err);
          localStorage.removeItem('quizzo_token');
          localStorage.removeItem('pulsequiz_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('quizzo_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await api.register(email, pass, name);
    localStorage.setItem('quizzo_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const loginWithGoogle = async (data: { credential?: string; email?: string; displayName?: string; avatarUrl?: string; googleId?: string }) => {
    const res = await api.loginWithGoogle(data);
    localStorage.setItem('quizzo_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const loginAsDemo = async () => {
    try {
      return await login('demo@quizzo.com', 'password123');
    } catch {
      return await login('demo@pulsequiz.com', 'password123');
    }
  };

  const logout = () => {
    localStorage.removeItem('quizzo_token');
    localStorage.removeItem('pulsequiz_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: { displayName?: string; avatarUrl?: string; preferredTheme?: string }) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, loginWithGoogle, loginAsDemo, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
