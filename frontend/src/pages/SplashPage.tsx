import React from 'react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
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
    <div className="min-h-full flex-1 flex flex-col justify-between p-6 bg-[#05070A] text-white select-none relative overflow-hidden">
      {/* Background 3D Portal Ambience */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img
          src="/images/hero_portal.jpg"
          alt="Portal Ambience"
          className="w-full h-full object-cover filter blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/80 to-transparent" />
      </div>

      {/* Subtle Cyan Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="pt-safe flex justify-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-cyan/30 text-cyan shadow-cyanGlowSm">
          <div className="w-2 h-2 rounded-full bg-cyan shadow-cyanGlowSm" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-sans">
            COURSE ACADEMY
          </span>
        </div>
      </div>

      {/* Center Hero Identity */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 relative z-10">
        {/* Animated Brand Geometric Logo Symbol */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0D1117] to-[#11161D] border border-cyan/40 text-cyan flex items-center justify-center shadow-cyanGlow transform hover:scale-105 transition-transform">
            <div className="w-8 h-8 rounded-xl bg-cyan/20 border border-cyan flex items-center justify-center rotate-45">
              <div className="w-3.5 h-3.5 bg-cyan rounded-sm" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#05070A] px-2 py-0.5 rounded-full border border-cyan/50 text-[9px] font-black text-cyan">
            PRO
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-2 max-w-xs">
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Bilimingizni yangi bosqichga olib chiqing.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Professional kurslar, amaliy topshiriqlar va o‘rganishingiz uchun qulay shaxsiy kabinet.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center space-x-2.5 text-xs font-semibold pt-1">
          <span className="flex items-center space-x-1.5 glass-panel text-slate-200 px-3 py-1.5 rounded-xl border border-white/[0.08]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan" />
            <span>Sertifikatli ta'lim</span>
          </span>
          <span className="flex items-center space-x-1.5 glass-panel text-slate-200 px-3 py-1.5 rounded-xl border border-white/[0.08]">
            <Zap className="w-3.5 h-3.5 text-cyan" />
            <span>Telegramga mos</span>
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pb-safe w-full space-y-3 relative z-10">
        <button
          onClick={handleStart}
          className="w-full py-4 bg-cyan text-black font-black rounded-2xl shadow-cyanGlow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm tracking-wide"
        >
          <span>Boshlash</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
        <p className="text-[11px] text-center text-slate-500 font-medium">
          Platformadan foydalanish orqali barcha qoidalarga rozilik bildirasiz
        </p>
      </div>
    </div>
  );
};
