import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface TelegramContextType {
  webApp: any;
  user: any;
  isExpanded: boolean;
  isTelegram: boolean;
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
  isTelegram: false,
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
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        // Vertikal surishda tasodifiy yopilib ketishning oldini olish
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }
      } catch {}

      setWebApp(tg);
      setIsExpanded(tg.isExpanded || false);

      const hasInitData = Boolean(tg.initData && tg.initData.length > 0);
      const hasTgUser = Boolean(tg.initDataUnsafe?.user?.id);
      setIsTelegram(hasInitData || hasTgUser || Boolean((window as any).TelegramWebviewProxy));

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
        isTelegram,
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
