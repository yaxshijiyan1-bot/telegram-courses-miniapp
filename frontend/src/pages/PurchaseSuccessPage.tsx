import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight, Home, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface PurchaseSuccessPageProps {
  course: Course;
  onStartLearning: () => void;
  onGoHome: () => void;
}

export const PurchaseSuccessPage: React.FC<PurchaseSuccessPageProps> = ({
  course,
  onStartLearning,
  onGoHome
}) => {
  const { haptic } = useTelegram();

  useEffect(() => {
    // Gold & Emerald celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#159A6B', '#C9A96B', '#E8D3A7', '#0D6B4E']
      });
    } catch {}
  }, []);

  return (
    <div className="min-h-full flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-brand-cream via-brand-surface to-brand-mint/30 animate-in zoom-in-95 duration-300">
      {/* Top Decor */}
      <div className="pt-safe flex justify-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-mint border border-brand-emerald/20 text-brand-emerald">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Xarid Tasdiqlandi
          </span>
        </div>
      </div>

      {/* Center Success Info */}
      <div className="my-auto flex flex-col items-center text-center space-y-5">
        {/* Emerald Checkmark Circle */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-brand-mint border-4 border-brand-emerald flex items-center justify-center shadow-elevated">
            <CheckCircle2 className="w-10 h-10 text-brand-emerald stroke-[2.5]" />
          </div>
          <Sparkles className="w-5 h-5 text-brand-gold absolute -top-1 -right-1 animate-spin" />
        </div>

        <div className="space-y-2 max-w-xs">
          <h1 className="text-2xl font-serif font-bold text-brand-dark">
            Tabriklaymiz! 🎉
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
            Kurs muvaffaqiyatli xarid qilindi va shaxsiy kabinetingizga to'liq biriktirildi.
          </p>
        </div>

        {/* Purchased Course Details Card */}
        <div className="w-full bg-white rounded-2xl p-4 border border-brand-border/80 shadow-soft text-left flex items-center space-x-3.5">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-brand-emerald uppercase">
              {course.category}
            </span>
            <h4 className="text-xs font-bold text-brand-dark line-clamp-1 mt-0.5">
              {course.title}
            </h4>
            <div className="flex items-center space-x-2 text-[10px] text-brand-secondary mt-1">
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3 text-brand-emerald" />
                <span>{course.lesson_count} ta dars</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-brand-emerald font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Umrbod kirish</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pb-safe w-full space-y-2.5">
        <button
          onClick={() => {
            haptic.impact('medium');
            onStartLearning();
          }}
          className="w-full py-4 bg-brand-emerald text-white font-bold rounded-2xl shadow-elevated hover:bg-brand-deep active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm tracking-wide"
        >
          <span>Kursni boshlash</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            haptic.impact('light');
            onGoHome();
          }}
          className="w-full py-3 bg-white text-brand-dark font-semibold rounded-2xl border border-brand-border hover:bg-brand-surface active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs"
        >
          <Home className="w-4 h-4 text-brand-secondary" />
          <span>Bosh sahifaga qaytish</span>
        </button>
      </div>
    </div>
  );
};
