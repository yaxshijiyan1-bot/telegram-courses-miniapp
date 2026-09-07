import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

interface LightboxProps {
  images: string[];
  activeIndex: number;
  onClose: () => void;
  onNavigate?: (nextIndex: number) => void;
  altFor?: (index: number) => string;
}

/**
 * To'liq ekran rasm ko'rish oynasi.
 *
 * MUHIM: createPortal(document.body) orqali render qilinadi. Sabab —
 * CourseDetailPage/LessonPlayerPage ildiz elementida `animate-fade-up`
 * (transform animatsiyasi) bor: transform'li ota ichidagi `position: fixed`
 * bola CSS bo'yicha viewport'ga emas, o'sha otasiga nisbatan joylashadi.
 * Natijada lightbox sahifa skroli bilan surilib, ko'rinishdan kesilib
 * chiqib ketardi (2026-09-07'da topilgan xato). Portal orqali
 * document.body'ga chiqarilib, ota-transform ta'siri butunlay uziladi.
 */
export const Lightbox: React.FC<LightboxProps> = ({
  images,
  activeIndex,
  onClose,
  onNavigate,
  altFor,
}) => {
  const { haptic } = useTelegram();
  const canPrev = images.length > 1 && activeIndex > 0;
  const canNext = images.length > 1 && activeIndex < images.length - 1;

  // Portal'da bo'lsak ham fonda sahifa skrol bo'lmasligi kerak.
  // Telegram WebView'da body scroll bilan birga iFrame ham "elastik"
  // surilishi mumkin — ikkalasini ham qulflash kerak.
  useEffect(() => {
    const { body } = document;
    const html = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Desktop'da ← → klaviatura navigatsiyasi + Esc bilan yopish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && canPrev) {
        e.preventDefault();
        haptic?.selection?.();
        onNavigate?.(activeIndex - 1);
      }
      if (e.key === 'ArrowRight' && canNext) {
        e.preventDefault();
        haptic?.selection?.();
        onNavigate?.(activeIndex + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, canPrev, canNext, onClose, onNavigate, haptic]);

  // Touch swipe — chapga/o'ngga surib almashish (faqat 1 ta rasm bo'llsa o'chadi)
  let startX: number | null = null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in touch-none select-none"
      onClick={onClose}
      onTouchStart={(e) => {
        startX = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (startX === null || images.length < 2) return;
        const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
        startX = null;
        if (Math.abs(dx) < 48) return;
        const nextIdx = dx < 0 ? activeIndex + 1 : activeIndex - 1;
        if (nextIdx >= 0 && nextIdx < images.length) {
          haptic?.selection?.();
          onNavigate?.(nextIdx);
        }
      }}
    >
      <img
        key={activeIndex}
        src={images[activeIndex]}
        alt={altFor?.(activeIndex) ?? `Rasm ${activeIndex + 1}`}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full object-contain animate-zoom-in select-none"
        style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all"
        aria-label="Yopish"
      >
        <X className="w-5 h-5" strokeWidth={2.4} />
      </button>

      {canPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            haptic?.selection?.();
            onNavigate?.(activeIndex - 1);
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all"
          aria-label="Oldingi surat"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>
      )}

      {canNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            haptic?.selection?.();
            onNavigate?.(activeIndex + 1);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all"
          aria-label="Keyingi surat"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-bold pointer-events-none">
          {activeIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
};
