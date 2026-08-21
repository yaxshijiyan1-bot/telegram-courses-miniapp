import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Plus, BookOpen, GraduationCap, Trophy, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Course, EnrolledCourse } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface MyCoursesPageProps {
  enrolledCourses: EnrolledCourse[];
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onExploreCourses: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

export const MyCoursesPage: React.FC<MyCoursesPageProps> = ({
  enrolledCourses,
  courses,
  onSelectCourse,
  onExploreCourses,
}) => {
  const { haptic } = useTelegram();

  // REAL statistika — enrolled_courses massividagi haqiqiy raqamlardan
  const totalCompleted = enrolledCourses.reduce((acc, c) => acc + (c.completed_lessons || 0), 0);
  const totalLessons = enrolledCourses.reduce((acc, c) => acc + (c.total_lessons || 0), 0);
  const completedCourses = enrolledCourses.filter((c) => c.status === 'completed').length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pt-4 space-y-5"
    >
      {/* Sarlavha */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="eyebrow">O‘quv hududingiz</p>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight tracking-tight">
            Darslarim
          </h1>
        </div>
        <span className="w-11 h-11 rounded-2xl glass-chip text-cyan font-extrabold text-sm flex items-center justify-center tabular-nums">
          {String(enrolledCourses.length).padStart(2, '0')}
        </span>
      </motion.div>

      {/* Kurslar ro'yxati */}
      {enrolledCourses.length === 0 ? (
        <motion.div variants={item} className="glass rounded-[24px] p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-cyan flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" strokeWidth={2} />
          </div>
          <b className="text-sm text-ink block">Hozircha aktiv kurs yo‘q</b>
          <p className="text-[11px] text-ink-muted leading-relaxed max-w-[240px] mx-auto">
            Kurs sotib olgach yoki admin granti ochgach, barcha darslar shu yerda ko‘rinadi.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {enrolledCourses.map((enrolled) => {
            const full = courses.find((c) => c.id === enrolled.id);
            const isDone = enrolled.status === 'completed';
            return (
              <motion.button
                key={enrolled.id}
                variants={item}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  haptic?.impact?.('medium');
                  if (full) onSelectCourse(full);
                }}
                className="w-full glass rounded-[24px] p-4 text-left flex items-center space-x-3.5 relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-14 w-40 h-40 rounded-full bg-cyan/[0.06] blur-3xl pointer-events-none" />

                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={enrolled.cover_url || full?.cover_url || '/images/hero_seal.webp'}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDone ? 'text-emerald-600' : 'text-cyan'}`}>
                      {isDone ? <CheckCircle2 className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                      {isDone ? 'Yakunlangan' : 'Davom etmoqda'}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-bold text-ink leading-snug clamp-1">
                    {enrolled.title}
                  </h3>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan to-violet-light'}`}
                        style={{ width: `${enrolled.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-cyan tabular-nums w-8 text-right">
                      {enrolled.progress_percent}%
                    </span>
                  </div>

                  <p className="text-[10px] text-ink-muted clamp-1">
                    {enrolled.completed_lessons}/{enrolled.total_lessons} dars
                    {enrolled.last_lesson_title ? ` · ${enrolled.last_lesson_title}` : ''}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-ink-muted flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Statistika — REAL raqamlar */}
      <motion.div variants={item} className="glass rounded-[20px] p-3 grid grid-cols-3 divide-x divide-slate-200/80">
        <div className="flex items-center space-x-2.5 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center flex-shrink-0 border border-cyan/15">
            <BookOpen className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
              {totalCompleted}
              {totalLessons > 0 && (
                <span className="text-[10px] font-bold text-ink-muted">/{totalLessons}</span>
              )}
            </b>
            <span className="text-[9px] text-ink-muted block truncate leading-tight">darslar</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-violet/10 text-violet flex items-center justify-center flex-shrink-0 border border-violet/15">
            <GraduationCap className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
              {enrolledCourses.length}
            </b>
            <span className="text-[9px] text-ink-muted block truncate leading-tight">aktiv kurs</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center flex-shrink-0 border border-gold/15">
            <Trophy className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-[15px] font-extrabold text-ink block leading-tight tabular-nums">
              {completedCourses}
            </b>
            <span className="text-[9px] text-ink-muted block truncate leading-tight">yakunlangan</span>
          </div>
        </div>
      </motion.div>

      {/* Yangi kurs */}
      <motion.button
        variants={item}
        type="button"
        onClick={() => {
          haptic?.impact?.('light');
          onExploreCourses();
        }}
        className="w-full p-3.5 glass-chip rounded-[20px] border-dashed border-cyan/30 flex items-center justify-between pressable text-left group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center flex-shrink-0 group-hover:bg-cyan group-hover:text-white transition-colors">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <b className="text-[13px] font-bold text-ink block">Yangi kursni toping</b>
            <small className="text-[11px] text-ink-muted block truncate">Katalogdagi kurslarni ko‘ring</small>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-cyan flex-shrink-0" />
      </motion.button>
    </motion.div>
  );
};
