import React, { useState } from 'react';
import { BookOpen, Play, CheckCircle2, Award } from 'lucide-react';
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
    <div className="flex-1 pb-safe-nav px-4 pt-3 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-serif font-bold text-brand-dark">Mening O‘qishim</h1>
        <p className="text-xs text-brand-secondary mt-0.5">
          Siz xarid qilgan va o'rganayotgan barcha kurslaringiz.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-brand-border/80 shadow-sm">
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('all');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'all' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary hover:text-brand-dark'
          }`}
        >
          Barchasi ({enrolledCourses.length})
        </button>
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('in_progress');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'in_progress' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary hover:text-brand-dark'
          }`}
        >
          Davom etayotgan
        </button>
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('completed');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'completed' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary hover:text-brand-dark'
          }`}
        >
          Tugallangan
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-3 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-card border border-brand-border p-6 space-y-3">
            <BookOpen className="w-10 h-10 text-brand-emerald mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-brand-dark">Kurslar mavjud emas</h4>
            <p className="text-xs text-brand-secondary max-w-xs mx-auto">
              O‘rganishni boshlash uchun katalogimizdagi premium kurslardan birini tanlang.
            </p>
            <button
              onClick={() => {
                haptic.impact('light');
                onExploreCourses();
              }}
              className="mt-2 px-4 py-2 bg-brand-emerald text-white text-xs font-bold rounded-xl shadow-soft"
            >
              Kurslarni ko‘rish
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
                className="group bg-white rounded-card p-4 border border-brand-border/80 shadow-soft hover:shadow-elevated transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start space-x-3.5">
                  <img
                    src={c.cover_url}
                    alt={c.title}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-brand-emerald uppercase">
                      {fullCourse.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-brand-dark line-clamp-1 mt-0.5 group-hover:text-brand-emerald transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-brand-secondary line-clamp-1 mt-0.5">
                      Oxirgi dars: {c.last_lesson_title}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & CTA */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-brand-secondary">
                    <span>
                      {c.completed_lessons} / {c.total_lessons} dars tugatildi
                    </span>
                    <span className="font-bold text-brand-emerald">{c.progress_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-surface rounded-full overflow-hidden border border-brand-border/60">
                    <div
                      className="h-full bg-brand-emerald rounded-full transition-all duration-500"
                      style={{ width: `${c.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-brand-secondary">
                    Muallif: <span className="font-semibold text-brand-dark">{fullCourse.instructor_name}</span>
                  </span>
                  <button className="flex items-center space-x-1 text-xs font-bold text-brand-emerald group-hover:translate-x-0.5 transition-transform">
                    <span>Darsga o'tish</span>
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
