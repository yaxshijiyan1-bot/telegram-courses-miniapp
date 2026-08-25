import { useEffect, useState, useCallback, useRef } from 'react';

export interface SecurityShieldOptions {
  enableDevToolsBlock?: boolean;
  enableScreenshotBlock?: boolean;
  enableBlurProtection?: boolean;
  enableContextMenuBlock?: boolean;
  onSecurityAlert?: (reason: string) => void;
}

export function useSecurityShield(options: SecurityShieldOptions = {}) {
  const {
    enableDevToolsBlock = true,
    enableScreenshotBlock = true,
    enableBlurProtection = true,
    enableContextMenuBlock = true,
    onSecurityAlert
  } = options;

  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);

  const triggerSecurityWarning = useCallback((message: string) => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    setSecurityWarning(message);
    onSecurityAlert?.(message);

    // Xabarni 3.5 soniyadan so'ng yopish
    warningTimeoutRef.current = window.setTimeout(() => {
      setSecurityWarning(null);
    }, 3500);
  }, [onSecurityAlert]);

  // 1. Kontekst menyu (O'ng tugma) va matn tanlashni to'sish
  useEffect(() => {
    if (!enableContextMenuBlock) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning("Xavfsizlik: Sichqonchaning o'ng tugmasi ushbu platformada o'chirilgan.");
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, [enableContextMenuBlock, triggerSecurityWarning]);

  // 2. Klaviatura kombinatsiyalari (PrintScreen, F12, DevTools, Inspect, Save, Print)
  useEffect(() => {
    if (!enableScreenshotBlock && !enableDevToolsBlock) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const code = e.code;

      // PrintScreen / Skrinshot tugmalari
      if (
        key === 'printscreen' ||
        code === 'PrintScreen' ||
        (isCtrl && e.shiftKey && (key === 's' || key === '3' || key === '4')) ||
        (e.metaKey && e.shiftKey && (key === '4' || key === '3' || key === '5'))
      ) {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch {}
        triggerSecurityWarning("Mualliflik huquqi himoyasi: Skrinshot olish taqiqlanadi!");
        return;
      }

      // DevTools va Inspect: F12, Ctrl+Shift+I/J/C
      if (
        key === 'f12' ||
        (isCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))
      ) {
        e.preventDefault();
        triggerSecurityWarning("Xavfsizlik: Dasturchi vositalari (DevTools) ochish taqiqlanadi.");
        return;
      }

      // Sahifani saqlash / Manbani ko'rish / Chop etish: Ctrl+U, Ctrl+S, Ctrl+P
      if (isCtrl && (key === 'u' || key === 's' || key === 'p')) {
        e.preventDefault();
        triggerSecurityWarning("Xavfsizlik: Sahifani saqlash yoki chop etish mumkin emas.");
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch {}
        triggerSecurityWarning("Mualliflik huquqi himoyasi: Skrinshot olish taqiqlanadi!");
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [enableScreenshotBlock, enableDevToolsBlock, triggerSecurityWarning]);

  // 3. Oyna fokusini yo'qotishi / Tab almashtirilishi / Control Center surilishi (Screen Recording paytida)
  useEffect(() => {
    if (!enableBlurProtection) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setTimeout(() => setIsWindowBlurred(false), 300);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setTimeout(() => setIsWindowBlurred(false), 300);
    };

    const handlePageHide = () => {
      setIsWindowBlurred(true);
    };

    // Ekran yozish panelini ochish uchun ekranning tepasidan surilganda (Control Center)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0] && e.touches[0].clientY < 30) {
        setIsWindowBlurred(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [enableBlurProtection]);

  // 4. DevTools ochilganligini aniqlash konsol tuzog'i
  useEffect(() => {
    if (!enableDevToolsBlock) return;

    const threshold = 160;
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        setIsWindowBlurred(true);
      }
    };

    const interval = setInterval(checkDevTools, 1500);
    return () => clearInterval(interval);
  }, [enableDevToolsBlock]);

  return {
    isWindowBlurred,
    securityWarning,
    dismissWarning: () => setSecurityWarning(null),
    resumeFromProtection: () => setIsWindowBlurred(false)
  };
}
