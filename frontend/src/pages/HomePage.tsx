import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Trophy,
  Plus,
  GraduationCap,
  Award,
} from 'lucide-react';
import { Course, ContinueLearningData, Banner } from '../types';
import { CourseCard } from '../components/CourseCard';
import { InstructorsSection } from '../components/InstructorsSection';
import { useTelegram } from '../context/TelegramContext';
import { getToday } from '../utils/format';
import { api, toMediaUrl } from '../services/api';

interface HomePageProps {
  courses: Course[];
  banners: Banner[];
  bannersReady?: boolean;
  purchasedCourseIds?: Set<string>;
  purchasesLoading?: boolean;
  continueData?: ContinueLearningData | null;
  stats?: {
    completed_lessons_count: number;
    overall_progress_percent: number;
    enrolled_count: number;
  } | null;
  onSelectCourse: (course: Course) => void;
  onNavigateToCatalog: () => void;
  onNavigateToLearning: () => void;
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
  banners,
  bannersReady,
  purchasedCourseIds,
  purchasesLoading,
  continueData,
  stats,
  onSelectCourse,
  onNavigateToCatalog,
  onNavigateToLearning,
}) => {
  const { haptic, webApp } = useTelegram();
  const today = getToday();

  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const t = setTimeout(() => setSlideIdx((i) => (i + 1) % banners.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slideIdx, paused, banners.length]);

  const activeBanner = banners.length > 0 ? banners[slideIdx % banners.length] : null;

  // Bannerga bosilganda: biriktirilgan kursga o'tadi yoki tashqi havolani ochadi
  const handleBannerTap = (b: Banner) => {
    haptic?.impact?.('light');
    if (b.action_type === 'course' && b.action_value) {
      const course = courses.find(
        (c) => String(c.id) === b.action_value || c.slug === b.action_value
      );
      if (course) {
        onSelectCourse(course);
      } else {
        api.getCourseDetail(b.action_value).then(onSelectCourse).catch(() => {});
      }
    } else if (b.action_type === 'link' && b.action_value) {
      try {
        if (webApp?.openTelegramLink) webApp.openTelegramLink(b.action_value);
        else window.open(b.action_value, '_blank', 'noopener');
      } catch {
        window.open(b.action_value, '_blank', 'noopener');
      }
    }
  };

  // Real statistika — backend'dan, sun'iy raqamlarsiz
  const completedLessons = stats?.completed_lessons_count ?? 0;
  const enrolledCount = stats?.enrolled_count ?? 0;
  const overallProgress = stats?.overall_progress_percent ?? 0;

  // Sotuv bo'limida sotib olingan kurslar ko'rsatilmaydi
  const recommendedCourses = courses
    .filter((c) => c.id !== continueData?.course_id && !purchasedCourseIds?.has(c.id))
    .slice(0, 4);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pt-4 space-y-5"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null || banners.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 48) {
          haptic.selection();
          setSlideIdx((i) => (i + (dx < 0 ? 1 : banners.length - 1)) % banners.length);
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

      {/* ==== 2. Hero Banner — dinamik (admin boshqaruvida) ==== */}
      {activeBanner ? (
        <motion.section
          variants={item}
          className="relative w-full rounded-[24px] overflow-hidden shadow-xl"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div className="relative w-full aspect-[21/9] bg-slate-100">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activeBanner.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              >
                <img
                  src={toMediaUrl(activeBanner.image_url)}
                  alt={activeBanner.title || 'Banner'}
                  className={`w-full h-full object-cover ${activeBanner.action_type !== 'none' ? 'cursor-pointer' : ''}`}
                  onClick={() => handleBannerTap(activeBanner)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/hero_books.jpg';
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Sarlavha va pastki gradient */}
            {activeBanner.title ? (
              <>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-12 pointer-events-none">
                  <h2 className="text-[15px] font-extrabold text-white leading-snug tracking-tight clamp-2 drop-shadow-md">
                    {activeBanner.title}
                  </h2>
                </div>
              </>
            ) : null}

            {/* Nuqtalar indikatori */}
            {banners.length > 1 && (
              <div className="absolute bottom-2.5 right-3.5 flex items-center space-x-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Banner ${i + 1}`}
                    onClick={() => { haptic.selection(); setSlideIdx(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === slideIdx % banners.length
                        ? 'w-5 bg-white shadow-sm'
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.section>
      ) : !bannersReady ? (
        // Banner hali yuklanmadi (kesh ham yo'q) — hech qanday yozuv chiqmasin,
        // faqat yuklanish belgisi; admin banneri kelishi bilan darhol ko'rinadi
        <motion.section
          variants={item}
          className="w-full rounded-[24px] aspect-[21/9] bg-slate-100/80 animate-pulse"
        />
      ) : null}

      {/* ==== 3. Statistika (REAL — backend'dan) ==== */}
      <motion.div variants={item} className="glass rounded-[20px] p-3 grid grid-cols-3 divide-x divide-slate-200/80">
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
          <div className="w-9 h-9 rounded-xl bg-violet/10 text-violet flex items-center justify-center flex-shrink-0 border border-violet/15">
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

      {/* ==== 4. Yangi kurs topish ==== */}
      {!continueData && (
        <motion.button
          variants={item}
          type="button"
          onClick={() => {
            haptic?.impact?.('light');
            onNavigateToCatalog();
          }}
          className="w-full p-3.5 glass-chip rounded-[20px] border-dashed border-cyan/30 flex items-center justify-between pressable text-left group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center flex-shrink-0 group-hover:bg-cyan group-hover:text-white transition-colors">
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

      {/* ==== 5. Sizga mos kurslar (sotib olinganlar ko'rsatilmaydi) ==== */}
      {/* purchasesLoading: sotib olishlar hali aniqlanmagan — eski ro'yxat qisqacha
          ko'rinib, keyin yo'qolib qolmasligi uchun skeleton ko'rsatiladi */}
      {(purchasesLoading || recommendedCourses.length > 0) && (
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

        {purchasesLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-slate-100/80 animate-pulse" />
            ))}
          </div>
        ) : (
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
        )}
      </motion.div>
      )}

      {/* ==== 6. Ustozlar haqida ==== */}
      <motion.div variants={item}>
        <InstructorsSection />
      </motion.div>
    </motion.div>
  );
};
