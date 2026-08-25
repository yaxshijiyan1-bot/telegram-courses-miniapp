import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap, GraduationCap } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const { haptic } = useTelegram();

  const handleStart = () => {
    haptic?.impact?.('medium');
    onStart();
  };

  return (
    <div className="min-h-screen flex-1 flex flex-col justify-between p-6 bg-white text-slate-900 select-none relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-cyan/[0.08] blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-36 -right-24 w-96 h-96 rounded-full bg-violet/[0.06] blur-[110px] pointer-events-none" />

      {/* Top brand pill */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pt-safe flex justify-center relative z-10"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-chip text-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-glow" />
          <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase">
            Kreativ AI
          </span>
        </div>
      </motion.div>

      {/* Center hero */}
      <div className="my-auto flex flex-col items-center text-center space-y-7 relative z-10 max-w-xs mx-auto">
        {/* 3D artwork */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 0.15 }}
          className="relative w-56 h-44 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(2,132,199,0.14),transparent_65%)]" />
          <motion.img
            src="/images/hero_grad.webp"
            alt=""
            draggable={false}
            className="relative z-10 w-full h-full object-contain animate-floaty pointer-events-none"
            style={{ maskImage: 'radial-gradient(ellipse 95% 95% at 50% 50%, black 60%, transparent 98%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 95% at 50% 50%, black 60%, transparent 98%)' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2.5"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Bilimingizni<br />
            <em className="serif-accent">oshiring.</em>
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Professional amaliy kurslar, tizimli o‘quv yo‘li va Telegram uchun moslashtirilgan qulay muhit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center space-x-2 text-[11px] font-bold"
        >
          <span className="flex items-center space-x-1.5 glass-chip text-slate-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan" strokeWidth={2.2} />
            <span>Sertifikatli</span>
          </span>
          <span className="flex items-center space-x-1.5 glass-chip text-slate-800 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5 text-cyan" strokeWidth={2.2} />
            <span>Telegramga mos</span>
          </span>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pb-safe w-full space-y-3 relative z-10"
      >
        <motion.button
          type="button"
          onClick={handleStart}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-cyanGlow"
        >
          <GraduationCap className="w-[18px] h-[18px]" strokeWidth={2.4} />
          <span>Boshlash</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </motion.button>
        <p className="text-[10px] text-center text-slate-400 font-medium">
          bilim qiymatga aylanadi · Kreativ AI 2026
        </p>
      </motion.div>
    </div>
  );
};
