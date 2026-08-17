import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Play, ArrowRight } from 'lucide-react';
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
    haptic.notification('success');
    // Ikki tomonlama konfetti — real jetakchi miniapplardagidek
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#22D3EE', '#8B5CF6', '#F5C66B', '#ffffff'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#22D3EE', '#8B5CF6', '#F5C66B', '#ffffff'],
      disableForReducedMotion: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-darkBg text-ink p-6 flex flex-col justify-between select-none animate-fade-up relative overflow-hidden">
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-cyan/[0.1] blur-[100px] pointer-events-none" />

      {/* Top pill */}
      <div className="pt-safe flex justify-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-chip text-cyan text-[10px] font-extrabold tracking-[0.16em]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-glow" />
          <span>TO‘LOV QABUL QILINDI</span>
        </div>
      </div>

      {/* Center */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 max-w-sm mx-auto relative z-10">
        {/* Yuklangan 3D artwork — muhr boncug'i */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="relative w-52 h-44 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(245,198,107,0.14),transparent_65%)]" />
          <img
            src="/images/hero_seal.webp"
            alt=""
            draggable={false}
            className="relative z-10 w-full h-full object-contain animate-floaty pointer-events-none"
            style={{ maskImage: 'radial-gradient(ellipse 95% 95% at 50% 50%, black 60%, transparent 98%)', WebkitMaskImage: 'radial-gradient(ellipse 95% 95% at 50% 50%, black 60%, transparent 98%)' }}
          />
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.25 }}
            className="absolute -bottom-1 -right-2 w-12 h-12 rounded-full bg-cyan text-[#05070A] flex items-center justify-center border-4 border-darkBg shadow-cyanGlowSm z-20"
          >
            <CheckCircle2 className="w-6 h-6" strokeWidth={2.4} />
          </motion.div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Tabriklaymiz!</h1>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Siz <strong className="text-cyan font-bold">{course.title}</strong> kursiga a'zo bo‘ldingiz. Admin tasdiqlagach darslar to‘liq ochiladi.
          </p>
        </div>

        <div className="w-full glass rounded-[22px] p-3.5 flex items-center space-x-3 text-left">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold text-cyan uppercase tracking-[0.14em] block">
              {course.category}
            </span>
            <h4 className="text-xs font-bold text-ink truncate">{course.title}</h4>
            <span className="text-[10px] text-ink-muted block mt-0.5">
              1 yillik kirish · {course.lesson_count} dars
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pb-safe w-full space-y-2.5 relative z-10">
        <motion.button
          onClick={() => {
            haptic.impact('medium');
            onStartLearning();
          }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl shadow-cyanGlow flex items-center justify-center space-x-2 text-sm"
        >
          <Play className="w-4 h-4 fill-[#05070A]" />
          <span>O‘quvlarimga o‘tish</span>
        </motion.button>

        <motion.button
          onClick={() => {
            haptic.impact('light');
            onGoHome();
          }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 glass-chip text-ink-secondary font-bold rounded-2xl flex items-center justify-center space-x-2 text-xs hover:text-ink transition-colors"
        >
          <span>Bosh sahifaga qaytish</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
};
