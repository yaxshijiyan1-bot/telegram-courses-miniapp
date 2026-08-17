import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Trophy,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Course, ContinueLearningData } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface HomePageProps {
  courses: Course[];
  continueData?: ContinueLearningData | null;
  onSelectCourse: (course: Course) => void;
  onNavigateToCatalog: () => void;
  onNavigateToLearning: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  courses,
  continueData,
  onSelectCourse,
  onNavigateToCatalog,
  onNavigateToLearning,
}) => {
  const { haptic } = useTelegram();

  const activeEnrolledCourse = courses.find((c) => c.is_enrolled) || courses[0];
  const recommendedCourses = courses.filter((c) => c.id !== activeEnrolledCourse?.id);

  return (
    <div className="px-4 pt-3 space-y-5 animate-fade-up">
      {/* 1. Hero Title & Date Widget */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
            SIZNING O‘QUV HUDUDINGIZ
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-extrabold text-[#0f172a] leading-tight tracking-tight">
            Bilimingizni<br />
            <em className="font-serif italic font-normal text-[#2563eb]">o‘stiring.</em>
          </h1>
        </div>

        {/* Date Widget Pill */}
        <div className="bg-[#eef4ff] rounded-2xl p-2.5 text-center min-w-[76px] border border-[#dbeafe] shadow-sm">
          <span className="text-[20px] font-extrabold text-[#2563eb] block leading-none">
            01
          </span>
          <span className="text-[11px] font-bold text-[#1e293b] block mt-0.5">
            May
          </span>
          <span className="text-[9px] text-[#64748b] font-medium block">
            Payshanba
          </span>
        </div>
      </div>

      {/* 2. SOTIB OLINGAN KURS (Featured Hero Card) */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-soft relative overflow-hidden flex items-center justify-between">
        {/* Left Copy & Actions */}
        <div className="flex-1 min-w-0 pr-3 space-y-1.5">
          <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider block">
            SOTIB OLINGAN KURS
          </span>

          <h2 className="text-base sm:text-lg font-bold text-[#0f172a] leading-snug truncate">
            {activeEnrolledCourse ? activeEnrolledCourse.title : "Dizayn fikrlash asoslari"}
          </h2>

          <p className="text-xs text-[#64748b] font-medium">
            {activeEnrolledCourse?.progress_percent || 42}% yakunlandi
          </p>

          {/* Clean Progress Bar */}
          <div className="flex items-center space-x-2 py-1">
            <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                style={{ width: `${activeEnrolledCourse?.progress_percent || 42}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#2563eb]">
              {activeEnrolledCourse?.progress_percent || 42}%
            </span>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                if (activeEnrolledCourse) onSelectCourse(activeEnrolledCourse);
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

        {/* Right 3D Books Artwork */}
        <div className="w-28 sm:w-36 h-28 sm:h-36 flex-shrink-0 flex items-center justify-center">
          <img
            src="/images/hero_books.jpg"
            alt="Dizayn fikrlash asoslari"
            className="w-full h-full object-contain filter drop-shadow-md rounded-2xl"
          />
        </div>
      </section>

      {/* 3. Stats Strip (3 Columns) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-soft grid grid-cols-3 divide-x divide-slate-100">
        {/* Stat 1 */}
        <div className="flex items-center space-x-2.5 px-1.5 sm:px-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-sm sm:text-base font-bold text-[#0f172a] block leading-tight">
              11
            </b>
            <span className="text-[9px] sm:text-[10px] text-[#64748b] block truncate leading-tight">
              yakunlangan dars
            </span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="flex items-center space-x-2.5 px-1.5 sm:px-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-sm sm:text-base font-bold text-[#0f172a] block leading-tight">
              2.4s
            </b>
            <span className="text-[9px] sm:text-[10px] text-[#64748b] block truncate leading-tight">
              o‘qish vaqti
            </span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="flex items-center space-x-2.5 px-1.5 sm:px-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <b className="text-sm sm:text-base font-bold text-[#0f172a] block leading-tight">
              01
            </b>
            <span className="text-[9px] sm:text-[10px] text-[#64748b] block truncate leading-tight">
              faol kurs
            </span>
          </div>
        </div>
      </div>

      {/* 4. "Keyingi imkoniyat" Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">
            Keyingi imkoniyat
          </h2>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onNavigateToCatalog();
            }}
            className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center space-x-0.5"
          >
            <span>Hammasi</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Dashed Find Course Card */}
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onNavigateToCatalog();
          }}
          className="w-full p-3.5 bg-white border border-dashed border-[#93c5fd] rounded-2xl flex items-center justify-between hover:bg-[#f8fafc] active:scale-[0.99] transition-all text-left shadow-soft group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <b className="text-xs sm:text-[13px] font-bold text-[#0f172a] block">
                Yangi kursni toping
              </b>
              <small className="text-[11px] text-[#64748b] block truncate">
                Katalogdagi kurslarni ko‘ring
              </small>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#2563eb] flex-shrink-0" />
        </button>
      </div>

      {/* 5. "Sizga mos kurslar" Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">
            Sizga mos kurslar
          </h2>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onNavigateToCatalog();
            }}
            className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center space-x-0.5"
          >
            <span>Hammasi</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* 3 Horizontal Course Cards / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {recommendedCourses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onSelectCourse(course)}
              showTopBadge={idx === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
