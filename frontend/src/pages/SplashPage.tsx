import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
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
    <div className="min-h-full flex-1 flex flex-col justify-between p-6 bg-[#09090C] text-white select-none relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#B4F523]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="pt-safe flex justify-center relative z-10">
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-[#181820] border border-white/10 text-[#B4F523] shadow-soft">
          <Sparkles className="w-3.5 h-3.5 fill-[#B4F523]" />
          <span className="text-[11px] font-bold tracking-wider uppercase">
            PREMIUM TA'LIM PLATFORMASI
          </span>
        </div>
      </div>

      {/* Center Hero Identity */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 relative z-10">
        {/* Animated Brand Logo Symbol */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#B4F523] to-[#84CC16] text-black flex items-center justify-center shadow-neon transform hover:scale-105 transition-transform">
            <Sparkles className="w-12 h-12 fill-black stroke-black" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-black px-2.5 py-0.5 rounded-full border border-[#B4F523] shadow-sm text-[10px] font-black text-[#B4F523]">
            PRO
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-2.5 max-w-xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
            Bilimingizni yangi bosqichga olib chiqing.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
            Professional kurslar, amaliy topshiriqlar va o‘rganishingiz uchun qulay shaxsiy kabinet.
          </p>
        </div>

        {/* Feature Badges - Highly readable dark pills with bright text */}
        <div className="flex items-center space-x-2.5 text-xs font-semibold pt-1">
          <span className="flex items-center space-x-1.5 bg-[#181820] text-zinc-200 px-3 py-1.5 rounded-xl border border-white/10">
            <ShieldCheck className="w-4 h-4 text-[#B4F523]" />
            <span>Sertifikatli ta'lim</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-[#181820] text-zinc-200 px-3 py-1.5 rounded-xl border border-white/10">
            <Zap className="w-4 h-4 text-[#B4F523]" />
            <span>Telegramga mos</span>
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pb-safe w-full space-y-3 relative z-10">
        <button
          onClick={handleStart}
          className="w-full py-4 bg-[#B4F523] text-black font-black rounded-2xl shadow-neon hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm tracking-wide"
        >
          <span>Boshlash</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
        <p className="text-[11px] text-center text-zinc-400 font-medium">
          Platformadan foydalanish orqali barcha qoidalarga rozilik bildirasiz
        </p>
      </div>
    </div>
  );
};
