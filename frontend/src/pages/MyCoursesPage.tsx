import React, { useState } from 'react';
import { BookOpen, Play, CheckCircle2, Award, ChevronRight } from 'lucide-react';
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
  onExploreCourses
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const { haptic } = useTelegram();

  const filtered = enrolledCourses.filter((c) => {
    if (activeTab === 'in_progress') return c.status === 'in_progress';
    if (activeTab === 'completed') return c.status === 'completed';
    return true;
  });

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-5 text-white animate-fade-up">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white tracking-tight">Mening O‘qishim</h1>
        <p className="text-xs text-slate-400">
          Siz xarid qilgan va o‘rganayotgan barcha amaliy kurslaringiz
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#0D1117] p-1 rounded-2xl border border-white/[0.06]">
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('all');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-cyan text-black font-bold shadow-cyanGlowSm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Barchasi ({enrolledCourses.length})
        </button>
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('in_progress');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'in_progress'
              ? 'bg-cyan text-black font-bold shadow-cyanGlowSm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Davom etayotgan
        </button>
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('completed');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-cyan text-black font-bold shadow-cyanGlowSm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tugallangan
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl p-6 space-y-3 border border-white/[0.06]">
            <BookOpen className="w-8 h-8 stroke-cyan mx-auto opacity-70" />
            <h4 className="text-sm font-bold text-white">Kurslar mavjud emas</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              O‘rganishni boshlash uchun katalogimizdagi premium kurslardan birini tanlang.
            </p>
            <button
              onClick={() => {
                haptic.impact('light');
                onExploreCourses();
              }}
              className="mt-2 px-5 py-2.5 bg-cyan text-black text-xs font-bold rounded-xl shadow-cyanGlowSm hover:opacity-90 active:scale-95 transition-all"
            >
              Katalogga o‘tish
            </button>
          </div>
        ) : (
          filtered.map((c) => {
            const fullCourse = courses.find((item) => item.id === c.id) || courses[0];
            return (
              <div
                key={c.id}
                onClick={() => {
                  haptic.impact('light');
                  onSelectCourse(fullCourse);
                }}
                className="glass-panel p-4 rounded-3xl border border-white/[0.08] hover:border-cyan/40 card-interactive cursor-pointer flex flex-col space-y-3 group"
              >
                <div className="flex space-x-3.5 items-center">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-[#05070A] border border-white/10">
                    <img
                      src={fullCourse.cover_url}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-cyan text-black flex items-center justify-center shadow-cyanGlowSm">
                        <Play className="w-3 h-3 fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
                      {fullCourse.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug truncate group-hover:text-cyan transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Oxirgi dars: {c.last_lesson_title || 'Kirish'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                    <span>Progress: {c.progress_percent}%</span>
                    <span className="text-cyan font-bold">Davom ettirish →</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan rounded-full animate-progress shadow-cyanGlowSm"
                      style={{ width: `${c.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
