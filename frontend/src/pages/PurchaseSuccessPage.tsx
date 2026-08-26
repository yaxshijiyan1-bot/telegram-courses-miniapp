import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Play, ArrowRight } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface PurchaseSuccessPageProps {
  course: Course;
  onGoHome: () => void;
}

export const PurchaseSuccessPage: React.FC<PurchaseSuccessPageProps> = ({
  course,
  onGoHome
}) => {
  const { haptic } = useTelegram();

  useEffect(() => {
    haptic?.notification?.('success');
    // Ikki tomonlama konfetti
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#0284C7', '#7C3AED', '#D97706', '#ffffff'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#0284C7', '#7C3AED', '#D97706', '#ffffff'],
      disableForReducedMotion: true,
    });
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-white text-slate-900 p-6 flex flex-col justify-between select-none animate-fade-up relative overflow-hidden">
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-cyan/[0.08] blur-[100px] pointer-events-none" />

      {/* Top pill */}
      <div className="pt-safe flex justify-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-chip text-sky-600 text-[10px] font-extrabold tracking-[0.16em]">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse-glow" />
          <span>KUTILMOQDA...</span>
        </div>
      </div>

      {/* Center */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 max-w-sm mx-auto relative z-10">
        {/* 3D artwork */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="relative"
        >
          <div className="w-40 h-40 rounded-full bg-sky-50 flex items-center justify-center border-8 border-white shadow-xl relative z-10 mx-auto">
            <CheckCircle2 className="w-20 h-20 text-sky-500" strokeWidth={1.5} />
          </div>
          {/* Decorative rings */}
          <div className="absolute inset-0 rounded-full border border-sky-200 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            To'lov adminga yuborildi!
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto font-medium">
            Sizning to'lov chekingiz muvaffaqiyatli qabul qilindi. Admin tomonidan tasdiqlanishi bilan kurs avtomatik ravishda ochiladi.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full">
          <div className="flex items-center space-x-3 text-left">
            <img 
              src={course.cover_url} 
              alt="" 
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                Kutilayotgan kurs
              </span>
              <p className="text-xs font-bold text-slate-900 truncate">{course.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pb-safe space-y-3 relative z-10 mt-6">
        <button
          onClick={() => {
            haptic?.impact?.('light');
            onGoHome();
          }}
          className="w-full py-4.5 bg-slate-100 text-slate-600 font-extrabold rounded-2xl flex items-center justify-center space-x-2 text-[15px] active:scale-[0.98] transition-transform"
        >
          <span>Asosiy sahifaga qaytish</span>
          <ArrowRight className="w-5 h-5 opacity-50" />
        </button>
      </div>
    </div>
  );
};
