import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useTelegram } from './TelegramContext';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, pass: string) => Promise<AuthResult>;
  telegramLogin: () => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  telegramLogin: async () => ({ success: false }),
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { webApp, user: tgUser } = useTelegram();

  useEffect(() => {
    // LocalStorage tekshirish
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else if (tgUser) {
      // Telegram user mavjud bo'lsa avtomatik kirish
      telegramLogin();
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tgUser]);

  const login = async (loginStr: string, pass: string): Promise<AuthResult> => {
    try {
      const res = await api.login(loginStr, pass);
      setUser(res.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Login yoki parol noto\'g\'ri.' };
    }
  };

  const telegramLogin = async (): Promise<AuthResult> => {
    try {
      const initData = webApp?.initData || '';
      const res = await api.telegramAuth(initData, tgUser);
      setUser(res.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Telegram orqali ulanishda xatolik yuz berdi.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        telegramLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
