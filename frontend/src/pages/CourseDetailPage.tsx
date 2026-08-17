import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Play,
  Lock,
  ChevronDown,
  BookOpen,
  Clock,
  Award,
  Star,
  Users,
  Infinity as InfinityIcon,
  ShieldCheck,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { formatPrice } from '../utils/format';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onPurchase: (course: Course) => void;
  onPlayLesson: (course: Course, lesson: Lesson) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  onPurchase,
  onPlayLesson,
}) => {
  const [openModuleId, setOpenModuleId] = useState<string | null>(course.modules?.[0]?.id || null);
  const { haptic } = useTelegram();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [course.id]);

  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? course.lesson_count;

  return (
    <div className="min-h-screen bg-darkBg text-ink pb-28 animate-fade-up">
      {/* Yuklab olingan 3D artwork fon */}
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(34,211,238,0.1),transparent_60%)] pointer-events-none" />

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-darkBg/80 backdrop-blur-2xl px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              onBack();
            }}
            className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink active:scale-90 transition-all"
            aria-label="Orqaga"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.4} />
          </button>

          <div className="flex items-center gap-1.5">
            {course.rating ? (
              <span className="text-[10px] font-extrabold text-gold glass-chip px-2.5 py-1.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-gold" />
                {course.rating.toFixed(1)}
              </span>
            ) : null}
            {course.is_enrolled ? (
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-3 py-1.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                Sizniki
              </span>
            ) : (
              <span className="text-[11px] font-extrabold text-cyan bg-cyan/10 border border-cyan/25 px-3 py-1.5 rounded-full">
                {course.old_price ? (
                  <s className="text-ink-muted mr-1.5 font-bold">{formatPrice(course.old_price)}</s>
                ) : null}
                {formatPrice(course.price)}
              </span>
            )}
          </div>
        </div>

        {/* Kurs muqovasi + identity */}
        <div className="px-4 pt-5 pb-5 flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="w-[108px] h-[108px] rounded-[22px] overflow-hidden border border-white/10 shadow-elevated flex-shrink-0 relative"
          >
            <img src={course.cover_url} alt={course.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>

          <div className="min-w-0 space-y-2">
            <span className="inline-block text-[9px] font-extrabold text-cyan uppercase tracking-[0.16em] bg-cyan/10 border border-cyan/20 px-2 py-0.5 rounded-md">
              {course.category || 'Kurs'}
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-ink leading-tight tracking-tight clamp-2">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-ink-muted font-semibold">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan" /> {course.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-cyan" /> {totalLessons} dars
              </span>
              {course.student_count ? (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan" /> {course.student_count.toLocaleString('ru-RU')} o‘quvchi
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Promise */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease }}
          className="glass rounded-[20px] p-3.5 flex items-center space-x-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan/10 border border-cyan/20 text-cyan flex items-center justify-center flex-shrink-0">
            <InfinityIcon className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <p className="text-[11px] text-ink-secondary font-semibold leading-snug">
            Bir marta to‘lang — darslarga <b className="text-ink">1 yil</b> davomida istalgan vaqtda kiring.
          </p>
        </motion.div>

        {/* Tavsif */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.45, ease }}
          className="text-xs leading-relaxed text-ink-secondary px-1"
        >
          {course.description || course.short_description ||
            'Aniq qadamlar, qisqa videolar va amaliy topshiriqlar orqali ko‘nikmani tizimli shakllantiring.'}
        </motion.p>

        {/* Muallif */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease }}
          className="glass rounded-[22px] p-4 flex items-center space-x-3.5"
        >
          <img
            src={course.instructor_avatar || (course.instructor_name?.includes('Zuhra') ? '/images/zuhra_olimova.jpg' : '/images/yaxshi_bola.jpg')}
            alt={course.instructor_name}
            className="w-12 h-12 rounded-2xl object-cover border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-cyan font-extrabold uppercase tracking-[0.14em] block">
              Kurs muallifi
            </span>
            <h4 className="text-[13px] font-bold text-ink truncate">{course.instructor_name}</h4>
            <p className="text-[10px] text-ink-muted truncate">{course.instructor_title}</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-cyan/60 flex-shrink-0" strokeWidth={2.2} />
        </motion.div>

        {/* O'quv dasturi — akkordeon */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.45, ease }}
          className="space-y-2.5 pt-1"
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan" strokeWidth={2.2} />
              Kurs dasturi
            </h2>
            <span className="text-[11px] font-bold text-ink-muted">
              {course.modules?.length || 0} modul · {totalLessons} dars
            </span>
          </div>

          <div className="space-y-2.5">
            {course.modules?.map((module, mIdx) => {
              const isOpen = openModuleId === module.id;
              const doneCount = module.lessons.filter((l) => l.completed).length;

              return (
                <div key={module.id} className="glass !rounded-[20px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="w-7 h-7 rounded-xl bg-cyan/10 border border-cyan/20 text-cyan font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                        {String(mIdx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-ink block truncate">{module.title}</span>
                        <span className="text-[9px] text-ink-muted">
                          {module.lessons.length} dars
                          {course.is_enrolled && doneCount > 0 ? ` · ${doneCount} yakunlandi` : ''}
                        </span>
                      </div>
                    </div>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
                      <ChevronDown className="w-4 h-4 text-cyan" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-white/[0.06] space-y-1.5">
                          {module.lessons.map((lesson, lIdx) => {
                            const unlocked = lesson.is_preview || course.is_enrolled;
                            return (
                              <div
                                key={lesson.id}
                                onClick={() => {
                                  if (unlocked) {
                                    haptic.impact('light');
                                    onPlayLesson(course, lesson);
                                  }
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-2xl text-xs transition-all ${
                                  unlocked
                                    ? 'bg-white/[0.04] border border-white/[0.06] hover:border-cyan/30 cursor-pointer'
                                    : 'bg-white/[0.015] border border-transparent text-ink-muted'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                  <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${unlocked ? 'text-cyan' : 'text-ink-muted/50'}`}>
                                    {String(lIdx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="min-w-0">
                                    <span className={`font-semibold text-[11px] block truncate ${unlocked ? 'text-ink' : ''}`}>
                                      {lesson.title}
                                    </span>
                                    {lesson.completed && (
                                      <span className="text-[9px] text-emerald-400 font-bold">Yakunlangan</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <span className="text-[10px] text-ink-muted tabular-nums">{lesson.duration}</span>
                                  {lesson.is_preview ? (
                                    <span className="text-[9px] font-extrabold text-[#05070A] bg-cyan px-2 py-0.5 rounded-md flex items-center space-x-1">
                                      <Play className="w-2.5 h-2.5 fill-[#05070A]" />
                                      <span>Ochiq</span>
                                    </span>
                                  ) : course.is_enrolled ? (
                                    lesson.completed ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-cyan fill-cyan" />
                                    )
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-ink-muted/60" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-darkBg/85 backdrop-blur-2xl p-3 border-t border-white/[0.07] z-40">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptic.impact('medium');
            if (course.is_enrolled) {
              const first = course.modules?.[0]?.lessons?.[0];
              if (first) onPlayLesson(course, first);
            } else {
              onPurchase(course);
            }
          }}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-cyanGlow"
        >
          <span>{course.is_enrolled ? 'Darslarni davom ettirish' : 'Kursni xarid qilish'}</span>
          {course.is_enrolled ? (
            <Play className="w-4 h-4 fill-[#05070A]" />
          ) : (
            <ArrowLeft className="w-4 h-4 rotate-180 stroke-[2.5]" />
          )}
        </motion.button>
      </div>
    </div>
  );
};
