import React from 'react';
import { CheckCircle2, Play, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
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

  return (
    <div className="flex-1 min-h-screen bg-[#05070A] text-white p-6 flex flex-col justify-between select-none animate-fade-up">
      {/* Top Success Badge */}
      <div className="pt-safe flex justify-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan/30 text-cyan text-xs font-bold shadow-cyanGlowSm">
          <div className="w-2 h-2 rounded-full bg-cyan shadow-cyanGlowSm" />
          <span>TO‘LOV MUVAFFAQIYATLI</span>
        </div>
      </div>

      {/* Main Success Content */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 max-w-sm mx-auto">
        {/* Animated Checkmark Circle */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-cyan/15 border border-cyan/40 text-cyan flex items-center justify-center shadow-cyanGlow">
            <CheckCircle2 className="w-10 h-10 stroke-cyan" />
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight leading-snug">
            Tabriklaymiz!
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Siz <strong className="text-cyan font-bold">{course.title}</strong> kursiga muvaffaqiyatli a'zo bo‘ldingiz.
          </p>
        </div>

        {/* Course Card Preview */}
        <div className="w-full glass-panel p-3.5 rounded-2xl border border-white/[0.08] flex items-center space-x-3 text-left">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
              {course.category}
            </span>
            <h4 className="text-xs font-bold text-white truncate">{course.title}</h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              1 yillik kirish faollashtirildi
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pb-safe w-full space-y-2.5">
        <button
          onClick={() => {
            haptic.impact('medium');
            onStartLearning();
          }}
          className="w-full py-3.5 bg-cyan text-black font-black rounded-2xl shadow-cyanGlow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm tracking-wide"
        >
          <Play className="w-4 h-4 fill-black ml-0.5" />
          <span>Darslarni boshlash</span>
        </button>

        <button
          onClick={() => {
            haptic.impact('light');
            onGoHome();
          }}
          className="w-full py-3 glass-panel text-slate-300 font-semibold rounded-2xl border border-white/[0.08] hover:text-white active:scale-[0.98] transition-all text-xs"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    </div>
  );
};
