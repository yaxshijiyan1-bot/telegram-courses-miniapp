import React from 'react';
import { ArrowRight, Plus, ChevronRight, BookOpen, Clock, Trophy } from 'lucide-react';
import { Course, EnrolledCourse } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface MyCoursesPageProps {
  enrolledCourses: EnrolledCourse[];
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onExploreCourses: () => void;
}

export const MyCoursesPage: React.FC<MyCoursesPageProps> = ({
  enrolledCourses,
  courses,
  onSelectCourse,
  onExploreCourses,
}) => {
  const { haptic } = useTelegram();

  const activeEnrolled = enrolledCourses[0] || null;
  const fullActiveCourse = courses.find((c) => c.id === activeEnrolled?.id) || courses[0];

  return (
    <div className="px-4 pt-3 space-y-5 animate-fade-up">
      {/* 1. Header Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
            O‘QUV HUDUDINGIZ
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#0f172a] leading-tight tracking-tight">
            O‘quvlarim
          </h1>
        </div>
        <span className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#2563eb] font-extrabold text-sm flex items-center justify-center border border-[#dbeafe] shadow-sm">
          {String(enrolledCourses.length || 1).padStart(2, '0')}
        </span>
      </div>

      {/* 2. SOTIB OLINGAN KURS (Hero Enrolled Card) */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-soft relative overflow-hidden flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-3 space-y-1.5">
          <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider block">
            SOTIB OLINGAN KURS
          </span>

          <h2 className="text-base sm:text-lg font-bold text-[#0f172a] leading-snug truncate">
            {fullActiveCourse?.title || "Dizayn fikrlash asoslari"}
          </h2>

          <p className="text-xs text-[#64748b] font-medium">
            {activeEnrolled?.progress_percent || 42}% yakunlandi
          </p>

          <div className="flex items-center space-x-2 py-1">
            <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                style={{ width: `${activeEnrolled?.progress_percent || 42}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#2563eb]">
              {activeEnrolled?.progress_percent || 42}%
            </span>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                if (fullActiveCourse) onSelectCourse(fullActiveCourse);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span>Davom ettirish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <small className="text-[10px] text-[#64748b] font-medium block pt-0.5">
            3-modul · 2-dars
          </small>
        </div>

        <div className="w-28 sm:w-36 h-28 sm:h-36 flex-shrink-0 flex items-center justify-center">
          <img
            src={fullActiveCourse?.cover_url || '/images/hero_books.jpg'}
            alt="Course Cover"
            className="w-full h-full object-contain filter drop-shadow-md rounded-2xl"
          />
        </div>
      </section>

      {/* 3. Stats Strip */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-soft grid grid-cols-3 divide-x divide-slate-100">
        <div className="flex items-center space-x-2 px-1.5">
          <div className="w-8 h-8 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-sm font-bold text-[#0f172a] block leading-tight">11</b>
            <span className="text-[9px] text-[#64748b] block truncate leading-tight">yakunlangan dars</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1.5">
          <div className="w-8 h-8 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-sm font-bold text-[#0f172a] block leading-tight">2.4s</b>
            <span className="text-[9px] text-[#64748b] block truncate leading-tight">o‘qish vaqti</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-1.5">
          <div className="w-8 h-8 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-sm font-bold text-[#0f172a] block leading-tight">
              {String(enrolledCourses.length || 1).padStart(2, '0')}
            </b>
            <span className="text-[9px] text-[#64748b] block truncate leading-tight">faol kurs</span>
          </div>
        </div>
      </div>

      {/* 4. "Keyingi imkoniyat" */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">Keyingi imkoniyat</h2>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onExploreCourses();
            }}
            className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center space-x-0.5"
          >
            <span>Hammasi</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onExploreCourses();
          }}
          className="w-full p-3.5 bg-white border border-dashed border-[#93c5fd] rounded-2xl flex items-center justify-between hover:bg-[#f8fafc] active:scale-[0.99] transition-all text-left shadow-soft group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-[13px] font-bold text-[#0f172a] block">Yangi kursni toping</b>
              <small className="text-[11px] text-[#64748b] block truncate">Katalogdagi kurslarni ko‘ring</small>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#2563eb] flex-shrink-0" />
        </button>
      </div>
    </div>
  );
};
