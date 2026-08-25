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

const defaultGuestUser: User = {
  id: 'guest',
  name: 'Talaba',
  role: 'student'
};

const AuthContext = createContext<AuthContextType>({
  user: defaultGuestUser,
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ success: false }),
  telegramLogin: async () => ({ success: false }),
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultGuestUser;
  });
  const [isLoading, setIsLoading] = useState(false);
  const { webApp, user: tgUser } = useTelegram();

  useEffect(() => {
    if (tgUser) {
      // Telegram user ma'lumotlari bo'lsa avtomatik moslashtiramiz
      const tgUserData: User = {
        id: String(tgUser.id),
        telegram_id: tgUser.id,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Talaba',
        username: tgUser.username,
        role: [8544023815, 8112688757].includes(tgUser.id) ? 'superadmin' : 'student'
      };

      setUser(tgUserData);
      localStorage.setItem('user', JSON.stringify(tgUserData));

      // Backend bilan jimgina sinxronlash (xatolik bo'lsa ham foydalanuvchini to'xtatmaydi)
      const initData = webApp?.initData || '';
      api.telegramAuth(initData, tgUser).then(res => {
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      }).catch(() => {
        // Offline yoki sekin internetda ham foydalanuvchi bemalol kiradi
      });
    }
  }, [tgUser, webApp]);

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
    setUser(defaultGuestUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || defaultGuestUser,
        isAuthenticated: true,
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
