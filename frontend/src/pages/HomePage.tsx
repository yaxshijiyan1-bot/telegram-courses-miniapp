import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Trophy,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Target,
} from 'lucide-react';
import { Course, ContinueLearningData, Banner } from '../types';
import { CourseCard } from '../components/CourseCard';
import { SectionTitle } from '../components/SectionTitle';
import { INSTRUCTORS, TEAM_GOAL, ACCENT } from '../components/InstructorsSection';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';
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
  onOpenTeacher: (teacherId: string) => void;
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

// Banner tag rangi — admin paneldan keladi
const TAG_TEXT: Record<string, string> = {
  cyan: 'text-cyan',
  violet: 'text-violet',
  gold: 'text-gold',
  emerald: 'text-emerald-600',
};

// Ustoz avatarini kurs ma'lumotidan aniqlash
const courseInstructorAvatar = (c: Course): string => {
  if (c.instructor_avatar) return toMediaUrl(c.instructor_avatar);
  return c.instructor_name?.toLowerCase().includes('zuhra')
    ? '/images/ustoz_zuhra_olimova.webp'
    : '/images/ustoz_yaxshi_bola.webp';
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
  onOpenTeacher,
}) => {
  const { haptic, webApp } = useTelegram();
  const { t } = useSettings();

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

  // Banner ostidagi ustoz qatori — biriktirilgan kursdan olinadi
  const bannerTeacher = (b: Banner): { name: string; avatar: string } | null => {
    if (b.action_type === 'course' && b.action_value) {
      const c = courses.find(
        (x) => String(x.id) === b.action_value || x.slug === b.action_value
      );
      if (c?.instructor_name) {
        return { name: c.instructor_name, avatar: courseInstructorAvatar(c) };
      }
    }
    return null;
  };

  // Real statistika — backend'dan, sun'iy raqamlarsiz
  const completedLessons = stats?.completed_lessons_count ?? 0;
  const enrolledCount = stats?.enrolled_count ?? 0;
  const overallProgress = stats?.overall_progress_percent ?? 0;

  // Sotuv bo'limida sotib olingan kurslar ko'rsatilmaydi
  const recommendedCourses = courses
    .filter((c) => c.id !== continueData?.course_id && !purchasedCourseIds?.has(c.id))
    .slice(0, 4);

  // Maqsad matnidagi "natijaga" so'zi serif accent bilan ajratiladi
  const goalParts = t(TEAM_GOAL).split(t('natijaga'));

  const statTiles = [
    { icon: BookOpen, val: String(completedLessons), lbl: t('yakunlangan dars'), cls: 'bg-cyan/10 text-cyan' },
    { icon: GraduationCap, val: String(enrolledCount), lbl: t('aktiv kurs'), cls: 'bg-violet/10 text-violet' },
    { icon: Trophy, val: `${overallProgress}%`, lbl: t('umumiy progress'), cls: 'bg-gold/10 text-gold' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pt-4 pb-2"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null || banners.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 48) {
          haptic?.selection?.();
          setSlideIdx((i) => (i + (dx < 0 ? 1 : banners.length - 1)) % banners.length);
        }
        touchX.current = null;
      }}
    >
      {/* ==== 1. Salomlashuv ==== */}
      <motion.div variants={item} className="px-5 mb-4">
        <p className="text-[10.5px] font-extrabold text-cyan tracking-[0.14em] uppercase mb-1.5">
          {t('Xush kelibsiz')}
        </p>
        <h1 className="text-[28px] font-extrabold text-ink tracking-[-0.03em] leading-[1.12]">
          {t('Bugun nima')}
          <br />
          <em className="serif-accent text-[30px]">{t("o'rganamiz?")}</em>
        </h1>
      </motion.div>

      {/* ==== 2. Banner — dinamik (admin boshqaruvida) ==== */}
      {activeBanner ? (
        <motion.section
          variants={item}
          className="px-5 mb-1"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            className="relative w-full h-[190px] rounded-[24px] overflow-hidden bg-slate-100"
            style={{
              border: '1px solid var(--soft-border-2)',
              boxShadow: '0 12px 30px -14px rgba(15,23,42,0.18)',
            }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activeBanner.id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <img
                  src={toMediaUrl(activeBanner.image_url)}
                  alt={activeBanner.title || 'Banner'}
                  className={`w-full h-full object-cover ${activeBanner.action_type !== 'none' ? 'cursor-pointer' : ''}`}
                  style={{
                    objectPosition:
                      activeBanner.image_position === 'top'
                        ? '50% 0%'
                        : activeBanner.image_position === 'bottom'
                          ? '50% 100%'
                          : '50% 50%',
                  }}
                  onClick={() => handleBannerTap(activeBanner)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/hero_books.jpg';
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Overlay gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.25) 55%, rgba(15,23,42,0.05) 100%)',
              }}
            />

            {/* Tag pill — admin paneldan */}
            {activeBanner.tag ? (
              <span
                className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${TAG_TEXT[activeBanner.tag_color || 'cyan'] || 'text-cyan'}`}
                style={{ background: 'rgba(255,255,255,0.92)' }}
              >
                <Sparkles className="w-[11px] h-[11px]" />
                {activeBanner.tag}
              </span>
            ) : null}

            {/* Sarlavha + subtitle + ustoz qatori */}
            <div
              className={`absolute bottom-3.5 left-4 right-4 text-white pointer-events-none ${activeBanner.action_type !== 'none' ? '' : ''}`}
            >
              {activeBanner.title ? (
                <h2 className="text-[20px] font-extrabold tracking-[-0.02em] leading-[1.15] clamp-2 drop-shadow-sm">
                  {activeBanner.title}
                </h2>
              ) : null}
              {activeBanner.subtitle ? (
                <p className="text-xs opacity-90 mt-1 font-medium clamp-1">{activeBanner.subtitle}</p>
              ) : null}

              {(() => {
                const t = bannerTeacher(activeBanner);
                return (
                  <div className="flex items-center gap-1.5 mt-3">
                    {t ? (
                      <>
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-[22px] h-[22px] rounded-full object-cover object-top border-[1.5px] border-white/80 bg-white/20"
                        />
                        <span className="text-[11px] font-semibold text-white/95">{t.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-cyan to-violet text-white text-[9px] font-extrabold flex items-center justify-center border-[1.5px] border-white/80">
                          K
                        </span>
                        <span className="text-[11px] font-semibold text-white/95">Kreativ AI</span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Nuqtalar indikatori */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 right-3.5 flex items-center gap-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Banner ${i + 1}`}
                    onClick={() => { haptic?.selection?.(); setSlideIdx(i); }}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === slideIdx % banners.length ? 18 : 6,
                      background: i === slideIdx % banners.length ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.section>
      ) : !bannersReady ? (
        // Banner hali yuklanmadi — faqat yuklanish belgisi
        <motion.section variants={item} className="px-5 mb-1">
          <div className="w-full h-[190px] rounded-[24px] bg-slate-100/80 animate-pulse" />
        </motion.section>
      ) : null}

      {/* ==== 3. Statistika (REAL — backend'dan) ==== */}
      <motion.div variants={item} className="px-5 pt-[18px] pb-2 grid grid-cols-3 gap-2.5">
        {statTiles.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.lbl}
              className="bg-white rounded-[18px]"
              style={{ border: '1px solid var(--soft-border)', padding: '12px 12px 12px 14px' }}
            >
              <div className={`w-[30px] h-[30px] rounded-[10px] flex items-center justify-center ${s.cls}`}>
                <Icon className="w-[15px] h-[15px]" strokeWidth={2.2} />
              </div>
              <b className="block text-lg font-extrabold text-ink tracking-[-0.02em] leading-none mt-2 tabular-nums">
                {s.val}
              </b>
              <span className="block text-[10px] font-semibold text-ink-muted mt-1 truncate">
                {s.lbl}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* ==== 4. Ustozlar ==== */}
      <motion.div variants={item} className="pt-2">
        <SectionTitle
          eyebrow={t('JAMOA')}
          title={t('Ustozlar')}
          sub={t('Amaliyotdan, real loyihalardan')}
        />
        <div className="px-5 space-y-2.5">
          {INSTRUCTORS.map((ins) => (
            <motion.button
              key={ins.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => { haptic?.impact?.('light'); onOpenTeacher(ins.id); }}
              className="w-full bg-white rounded-[22px] flex items-center gap-3 text-left pressable"
              style={{ border: '1px solid var(--soft-border)', padding: '12px 14px' }}
            >
              <div
                className="w-[54px] h-[54px] rounded-[18px] overflow-hidden flex-shrink-0"
                style={{ background: ins.accent === 'violet' ? 'rgba(124,58,237,0.08)' : 'rgba(2,132,199,0.08)' }}
              >
                <img
                  src={ins.photo}
                  alt={ins.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-extrabold text-ink tracking-[-0.01em] leading-tight">
                  {ins.name}
                </h3>
                <span
                  className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border mt-1 ${ACCENT[ins.accent].chipBg}`}
                >
                  {t(ins.role)}
                </span>
                <p className="text-[11px] text-ink-muted mt-1.5 clamp-1">{t(ins.tagline)}</p>
              </div>
              <ChevronRight className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ==== 5. Siz uchun tavsiyalar (sotib olinganlar ko'rsatilmaydi) ==== */}
      {(purchasesLoading || recommendedCourses.length > 0) && (
        <motion.div variants={item} className="pt-4">
          <SectionTitle
            eyebrow={t('TAVSIYA')}
            title={t('Siz uchun')}
            accent={t('tanlangan.')}
            right={
              <button
                type="button"
                onClick={() => { haptic?.selection?.(); onNavigateToCatalog(); }}
                className="flex items-center gap-1 text-xs font-bold text-cyan pb-1"
              >
                <span>{t('Barchasi')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className="px-5">
            {purchasesLoading ? (
              <div className="space-y-3.5">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[260px] rounded-[24px] bg-slate-100/80 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {recommendedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => onSelectCourse(course)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ==== 6. Bizning maqsad ==== */}
      <motion.div variants={item} className="px-5 pt-5 pb-3">
        <div
          className="rounded-[22px] flex items-start gap-3"
          style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(2,132,199,0.06), rgba(124,58,237,0.05))',
            border: '1px solid rgba(2,132,199,0.10)',
          }}
        >
          <div className="w-11 h-11 rounded-[14px] bg-white/90 text-cyan flex items-center justify-center flex-shrink-0 shadow-sm">
            <Target className="w-[22px] h-[22px]" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-cyan tracking-[0.12em] uppercase mb-1">
              {t('Bizning maqsad')}
            </p>
            <p className="text-[12.5px] text-ink-secondary leading-[1.6] font-medium">
              {goalParts[0]}
              <em className="serif-accent">{t('natijaga')}</em>
              {goalParts[1]}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
