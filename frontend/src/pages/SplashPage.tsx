import React from 'react';
import { ArrowRight, ShieldCheck, Zap, BookOpen } from 'lucide-react';
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
    <div className="min-h-screen flex-1 flex flex-col justify-between p-6 bg-[#f8fafc] text-[#0f172a] select-none relative overflow-hidden">
      {/* Top Brand Pill Tag */}
      <div className="pt-safe flex justify-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[#2563eb]">
          <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase">
            COURSE ACADEMY
          </span>
        </div>
      </div>

      {/* Center Hero Identity */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 relative z-10 max-w-xs mx-auto">
        {/* Blue Squircle Logo */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
          <BookOpen className="w-8 h-8" strokeWidth={2.2} />
        </div>

        {/* Headlines */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] leading-tight tracking-tight">
            Bilimingizni<br />
            <em className="font-serif italic font-normal text-[#2563eb]">o‘stiring.</em>
          </h1>
          <p className="text-xs text-[#64748b] leading-relaxed font-medium">
            Professional amaliy kurslar, o‘quv yo‘li va Telegram uchun moslashtirilgan qulay muhit.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center space-x-2 text-xs font-bold pt-1">
          <span className="flex items-center space-x-1.5 bg-white text-[#1e293b] px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
            <span>Sertifikatli</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-white text-[#1e293b] px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Zap className="w-4 h-4 text-[#2563eb]" />
            <span>Telegramga mos</span>
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pb-safe w-full space-y-3 relative z-10">
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
        >
          <span>Boshlash</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-center text-[#94a3b8] font-medium">
          bilim qiymatga aylanadi · Course Academy 2026
        </p>
      </div>
    </div>
  );
};
