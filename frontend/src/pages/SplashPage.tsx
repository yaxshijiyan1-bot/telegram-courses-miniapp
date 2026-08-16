import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const { haptic } = useTelegram();

  const handleStart = () => {
    haptic.impact('medium');
    onStart();
  };

  return (
    <div className="min-h-full flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-brand-cream via-brand-surface to-brand-mint/40 select-none">
      {/* Top Brand Tag */}
      <div className="pt-safe flex justify-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-mint border border-brand-emerald/20 text-brand-emerald shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-[11px] font-bold tracking-widest uppercase">
            PREMIUM EDUCATION
          </span>
        </div>
      </div>

      {/* Center Hero Identity */}
      <div className="my-auto flex flex-col items-center text-center space-y-6">
        {/* Animated Brand Logo Symbol */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-emerald via-brand-deep to-brand-forest flex items-center justify-center shadow-elevated transform hover:rotate-3 transition-transform">
            <Sparkles className="w-12 h-12 text-brand-gold" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white px-2 py-0.5 rounded-full border border-brand-border shadow-sm text-[10px] font-bold text-brand-emerald">
            PRO
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-3 max-w-xs">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark leading-tight tracking-tight">
            Bilimingizni yangi bosqichga olib chiqing.
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
            Professional kurslar, amaliy darslar va o‘rganishingiz uchun qulay shaxsiy kabinet.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center space-x-3 text-[11px] text-brand-emerald font-medium pt-2">
          <span className="flex items-center space-x-1 bg-white/80 px-2.5 py-1 rounded-lg border border-brand-border/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sertifikatli ta'lim</span>
          </span>
          <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-brand-border/60">
            Telegram-native
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pb-safe w-full space-y-3">
        <button
          onClick={handleStart}
          className="w-full py-4 bg-brand-emerald text-white font-bold rounded-2xl shadow-elevated hover:bg-brand-deep active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm tracking-wide"
        >
          <span>Boshlash</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-center text-brand-muted">
          Platformaga kirish orqali barcha qoidalarga rozilik bildirasiz
        </p>
      </div>
    </div>
  );
};
