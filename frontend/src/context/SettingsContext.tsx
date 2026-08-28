import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toCyrillic } from '../utils/transliterate';

// Sozlamalar: mavzu, til va bildirishnoma imtiyozlari qurilmada saqlanadi.
// Sahifalar `t()` orqali matnlarni o'raydi — lotin rejimida matn o'zgarishsiz
// qaytadi, kirill rejimida esa lotin→kirill transkripsiyasi qo'llanadi.

export type Theme = 'light' | 'dark';
export type Lang = 'lat' | 'cyr';
export interface NotifPrefs {
  new: boolean;
  pay: boolean;
  promo: boolean;
}

const THEME_KEY = 'kai_theme';
const LANG_KEY = 'kai_lang';
const NOTIF_KEY = 'kai_notif';

const readTheme = (): Theme => {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};
const readLang = (): Lang => {
  try {
    return localStorage.getItem(LANG_KEY) === 'cyr' ? 'cyr' : 'lat';
  } catch {
    return 'lat';
  }
};
const readNotif = (): NotifPrefs => {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIF_KEY) || '');
    return {
      new: raw?.new !== false,
      pay: raw?.pay !== false,
      promo: raw?.promo === true,
    };
  } catch {
    return { new: true, pay: true, promo: false };
  }
};

interface SettingsContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  notif: NotifPrefs;
  setNotif: (n: NotifPrefs) => void;
  t: (s: string) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [lang, setLangState] = useState<Lang>(readLang);
  const [notif, setNotifState] = useState<NotifPrefs>(readNotif);

  // Tungi mavzu — <html> ga klass qo'shiladi, index.css'dagi .theme-dark
  // qatlami barcha sirtlarni qayta bo'yaydi
  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang === 'cyr' ? 'uz-cyrl' : 'uz-lat';
  }, [lang]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch {}
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  }, []);
  const setNotif = useCallback((n: NotifPrefs) => {
    setNotifState(n);
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(n)); } catch {}
  }, []);

  const t = useCallback((s: string) => (lang === 'cyr' ? toCyrillic(s) : s), [lang]);

  const value = useMemo(
    () => ({ theme, setTheme, lang, setLang, notif, setNotif, t }),
    [theme, setTheme, lang, setLang, notif, setNotif, t]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

// Qisqa yordamchi: faqat tarjima funksiyasi kerak bo'lgan joylar uchun
export const useT = () => useSettings().t;
