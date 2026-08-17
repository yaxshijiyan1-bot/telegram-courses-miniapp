import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Trophy,
  Plus,
  PlayCircle,
  GraduationCap,
  Award,
} from 'lucide-react';
import { Course, ContinueLearningData } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';
import { getToday } from '../utils/format';

interface HomePageProps {
  courses: Course[];
  continueData?: ContinueLearningData | null;
  stats?: {
    completed_lessons_count: number;
    overall_progress_percent: number;
    enrolled_count: number;
  } | null;
  onSelectCourse: (course: Course) => void;
  onNavigateToCatalog: () => void;
  onNavigateToLearning: () => void;
  onContinueLesson?: (courseId: string, lessonId: string) => void;
}

const SLIDE_MS = 5200;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

export const HomePage: React.FC<HomePageProps> = ({
  courses,
  continueData,
  stats,
  onSelectCourse,
  onNavigateToCatalog,
  onNavigateToLearning,
  onContinueLesson,
}) => {
  const { haptic } = useTelegram();
  const today = getToday();

  // ==== Hero banner slaydlari (foydalanuvchi yuklagan 3D artwork'lar) ====
  const slides = React.useMemo(() => [
    {
      id: 'grow',
      artwork: '/images/hero_grad.webp',
      eyebrow: 'COURSE ACADEMY · 2026',
      title: 'Bilimingizni',
      accent: 'oshiring.',
      text: 'Amaliy kurslar, tizimli o‘quv yo‘li va rasmiy sertifikat.',
      cta: 'Kurslarni ko‘rish',
      action: onNavigateToCatalog,
    },
    {
      id: 'cert',
      artwork: '/images/hero_seal.webp',
      eyebrow: 'SERTIFIKATLI TA’LIM',
      title: 'Har bir kurs —',
      accent: 'natija.',
      text: 'Darslarni yakunlang, raqamli sertifikat egasi bo‘ling.',
      cta: 'Darslarimga',
      action: onNavigateToLearning,
    },
  ], [onNavigateToCatalog, onNavigateToLearning]);

  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(() => setSlideIdx((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slideIdx, paused, slides.length]);

  const slide = slides[slideIdx];

  // Real statistika — backend'dan, sun'iy raqamlarsiz
  const completedLessons = stats?.completed_lessons_count ?? 0;
  const enrolledCount = stats?.enrolled_count ?? 0;
  const overallProgress = stats?.overall_progress_percent ?? 0;

  // Continue-learning kursini courses ro'yxatidan topamiz
  const continueCourse = continueData ? courses.find((c) => c.id === continueData.course_id) : undefined;

  const recommendedCourses = courses
    .filter((c) => c.id !== continueData?.course_id)
    .slice(0, 4);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pt-4 space-y-5"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 48) {
          haptic.selection();
          setSlideIdx((i) => (i + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
        }
        touchX.current = null;
      }}
    >
      {/* ==== 1. Sarlavha + REAL sana ==== */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="eyebrow">Sizning o‘quv hududingiz</p>
          <h1 className="text-[30px] sm:text-[34px] font-extrabold text-ink leading-tight tracking-tight">
            Bilimingizni<br />
            <em className="serif-accent">oshiring.</em>
          </h1>
        </div>

        <div className="glass-chip rounded-2xl px-3 py-2 text-center min-w-[68px]">
          <span className="text-[20px] font-extrabold text-cyan block leading-none tabular-nums">
            {today.day}
          </span>
          <span className="text-[11px] font-bold text-ink block mt-0.5">
            {today.month}
          </span>
          <span className="text-[9px] text-ink-muted font-medium block">
            {today.weekday}
          </span>
        </div>
      </motion.div>

      {/* ==== 2. Hero banner (avto-slayd, swipe) ==== */}
      <motion.section
        variants={item}
        className="glass rounded-[26px] relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="min-h-[196px] flex items-stretch">
          {/* Matn qismi */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-center space-y-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-2"
              >
                <p className="text-[9px] font-extrabold tracking-[0.18em] text-cyan/90 uppercase">
                  {slide.eyebrow}
                </p>
                <h2 className="text-[22px] sm:text-2xl font-extrabold text-ink leading-[1.15] tracking-tight">
                  {slide.title}
                  <br />
                  <em className="serif-accent">{slide.accent}</em>
                </h2>
                <p className="text-[11px] text-ink-secondary leading-relaxed max-w-[190px]">
                  {slide.text}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    haptic.impact('medium');
                    slide.action();
                  }}
                  className="mt-1 inline-flex items-center space-x-1.5 px-4 py-2 bg-cyan text-[#05070A] rounded-xl text-[11px] font-extrabold shadow-cyanGlowSm active:scale-95 transition-transform"
                >
                  <span>{slide.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3D artwork — foyydalanuvchi yuklagan rasmlar */}
          <div className="w-[44%] relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(34,211,238,0.14),transparent_65%)]" />
            <AnimatePresence mode="popLayout">
              <motion.img
                key={slide.id}
                src={slide.artwork}
                alt=""
                draggable={false}
                initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                className="relative z-10 w-[115%] max-w-none object-contain animate-floaty pointer-events-none select-none"
                style={{ maskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 62%, transparent 98%)', WebkitMaskImage: 'radial-gradient(ellipse 92% 92% at 50% 50%, black 62%, transparent 98%)' }}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Progress indikatorlar */}
        <div className="absolute bottom-3 left-4 flex items-center space-x-1.5 z-20">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { haptic.selection(); setSlideIdx(i); }}
              className="h-1 rounded-full overflow-hidden bg-white/10 transition-all duration-500"
              style={{ width: i === slideIdx ? 28 : 10 }}
              aria-label={`Banner ${i + 1}`}
            >
              {i === slideIdx && (
                <motion.div
                  key={`${slideIdx}-${paused}`}
                  className="h-full bg-cyan rounded-full"
                  initial={{ width: paused ? '100%' : '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* ==== 3. Davom ettirish (faqat REAL ma'lumot bor bo'lsa) ==== */}
      {continueData && (
        <motion.section variants={item} className="glass rounded-[24px] p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-14 w-40 h-40 rounded-full bg-cyan/[0.07] blur-3xl pointer-events-none" />
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-cyan/15 border border-cyan/25 text-cyan flex items-center justify-center">
              <PlayCircle className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <span className="eyebrow !text-cyan/90">Davom ettirish</span>
          </div>

          <h2 className="text-[15px] font-bold text-ink leading-snug clamp-1">
            {continueData.course_title}
          </h2>
          <p className="text-[11px] text-ink-secondary mt-0.5 clamp-1">
            Keyingi dars: {continueData.lesson_title}
          </p>

          <div className="flex items-center space-x-2.5 py-2.5">
            <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan to-violet-light"
                initial={{ width: 0 }}
                animate={{ width: `${continueData.progress_percent}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-[11px] font-extrabold text-cyan tabular-nums">
              {continueData.progress_percent}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.impact('medium');
              if (onContinueLesson && continueData.lesson_id) {
                onContinueLesson(continueData.course_id, continueData.lesson_id);
              } else if (continueCourse) {
                onSelectCourse(continueCourse);
              } else {
                onNavigateToLearning();
              }
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-cyan text-[#05070A] rounded-xl text-[11px] font-extrabold shadow-cyanGlowSm active:scale-95 transition-transform"
          >
            <span>Darsni davom ettirish</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </motion.section>
      )}

      {/* ==== 4. Statistika (REAL — backend'dan) ==== */}
      <motion.div variants={item} className="glass rounded-[20px] p-3 grid grid-cols-3 divide-x divide-white/[0.06]">
        <div className="flex items-center space-x-2.5 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center flex-shrink-0 border border-cyan/15">
            <BookOpen className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
              {completedLessons}
            </b>
            <span className="text-[9px] text-ink-muted block truncate leading-tight">
              yakunlangan dars
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-violet/10 text-violet-light flex items-center justify-center flex-shrink-0 border border-violet/15">
            <GraduationCap className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
              {enrolledCount}
            </b>
            <span className="text-[9px] text-ink-muted block truncate leading-tight">
              aktiv kurs
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center flex-shrink-0 border border-gold/15">
            <Trophy className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
              {overallProgress}%
            </b>
            <span className="text-[9px] text-ink-muted block truncate leading-tight">
              umumiy progress
            </span>
          </div>
        </div>
      </motion.div>

      {/* ==== 5. Yangi kurs topish ==== */}
      {!continueData && (
        <motion.button
          variants={item}
          type="button"
          onClick={() => {
            haptic.impact('light');
            onNavigateToCatalog();
          }}
          className="w-full p-3.5 glass-chip rounded-[20px] border-dashed border-cyan/30 flex items-center justify-between pressable text-left group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center flex-shrink-0 group-hover:bg-cyan group-hover:text-[#05070A] transition-colors">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <b className="text-[13px] font-bold text-ink block">
                Birinchi kursingizni tanlang
              </b>
              <small className="text-[11px] text-ink-muted block truncate">
                Katalogdagi amaliy kurslarni ko‘ring
              </small>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan flex-shrink-0" />
        </motion.button>
      )}

      {/* ==== 6. Sizga mos kurslar ==== */}
      <motion.div variants={item} className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan" strokeWidth={2.2} />
            Sizga mos kurslar
          </h2>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onNavigateToCatalog();
            }}
            className="text-[11px] font-bold text-cyan hover:underline flex items-center space-x-0.5"
          >
            <span>Hammasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {recommendedCourses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onSelectCourse(course)}
              showTopBadge={idx === 0}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
