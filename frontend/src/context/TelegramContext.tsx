import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface TelegramContextType {
  webApp: any;
  user: any;
  isExpanded: boolean;
  haptic: {
    impact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notification: (type?: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  isExpanded: false,
  haptic: {
    impact: () => {},
    notification: () => {},
    selection: () => {}
  },
  showBackButton: () => {},
  hideBackButton: () => {}
});

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setIsExpanded(tg.isExpanded);

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Ranglarni sozlash — oq toza tema
      if (tg.setHeaderColor) {
        try { tg.setHeaderColor('#FFFFFF'); } catch {}
      }
      if (tg.setBackgroundColor) {
        try { tg.setBackgroundColor('#FFFFFF'); } catch {}
      }
    }
  }, []);

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      try {
        webApp?.HapticFeedback?.impactOccurred(style);
      } catch {}
    },
    notification: (type: 'error' | 'success' | 'warning' = 'success') => {
      try {
        webApp?.HapticFeedback?.notificationOccurred(type);
      } catch {}
    },
    selection: () => {
      try {
        webApp?.HapticFeedback?.selectionChanged();
      } catch {}
    }
  };

  const backButtonHandlerRef = useRef<(() => void) | null>(null);

  const showBackButton = (onClick: () => void) => {
    if (webApp?.BackButton) {
      // Eski handlerni olib tashlaymiz — aks holda ular to'planib, orqaga bosilganda bir nechta amal bajariladi
      if (backButtonHandlerRef.current) {
        try { webApp.BackButton.offClick(backButtonHandlerRef.current); } catch {}
      }
      backButtonHandlerRef.current = onClick;
      webApp.BackButton.show();
      webApp.BackButton.onClick(onClick);
    }
  };

  const hideBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        isExpanded,
        haptic,
        showBackButton,
        hideBackButton
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
