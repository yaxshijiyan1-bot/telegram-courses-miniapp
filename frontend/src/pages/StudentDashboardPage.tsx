import React from 'react';
import { Play, BookOpen, Clock, ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { Course, EnrolledCourse, ContinueLearningData, Lesson } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';

interface StudentDashboardPageProps {
  dashboardData: {
    continue_learning: ContinueLearningData;
    enrolled_courses: EnrolledCourse[];
    overall_progress_percent: number;
    completed_lessons_count: number;
    total_lessons_count: number;
  };
  courses: Course[];
  onContinueLesson: (courseId: string, lessonId: string) => void;
  onSelectCourse: (course: Course) => void;
  onExploreMore: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  dashboardData,
  courses,
  onContinueLesson,
  onSelectCourse,
  onExploreMore
}) => {
  const { user } = useAuth();
  const { haptic } = useTelegram();

  const continueItem = dashboardData.continue_learning;

  return (
    <div className="flex-1 pb-safe-nav px-4 pt-3 space-y-5 animate-in fade-in duration-200">
      {/* Personalized Greeting */}
      <div className="space-y-1">
        <h1 className="text-xl font-serif font-bold text-brand-dark">
          Assalomu alaykum, {user?.name ? user.name.split(' ')[0] : 'Talaba'} 👋
        </h1>
        <p className="text-xs text-brand-secondary">
          Bugun bilimingizni rivojlantirish uchun ajoyib kun!
        </p>
      </div>

      {/* Continue Learning Featured Card */}
      {continueItem && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Darsni davom ettirish
            </span>
          </div>

          <div
            onClick={() => {
              haptic.impact('medium');
              onContinueLesson(continueItem.course_id, continueItem.lesson_id);
            }}
            className="group relative overflow-hidden rounded-hero bg-gradient-to-br from-brand-forest to-brand-dark text-white p-4 sm:p-5 shadow-elevated cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-start space-x-3.5 relative z-10">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-white/20">
                <img
                  src={continueItem.course_cover}
                  alt={continueItem.course_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-brand-emerald text-white flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                  Faol Dars
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-brand-cream line-clamp-1 mt-0.5">
                  {continueItem.course_title}
                </h3>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                  {continueItem.lesson_title}
                </p>

                {/* Progress Bar inside card */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-white/70 font-medium">
                    <span>{continueItem.progress_text}</span>
                    <span className="text-brand-gold font-bold">{continueItem.progress_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-emerald to-brand-gold rounded-full transition-all duration-500"
                      style={{ width: `${continueItem.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/60 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-brand-gold" />
                <span>{continueItem.lesson_duration} qoldi</span>
              </span>
              <span className="text-xs font-bold text-brand-emerald group-hover:text-white transition-colors flex items-center space-x-1">
                <span>Davom ettirish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Overall Circular Progress */}
      <ProgressRing
        percentage={dashboardData.overall_progress_percent}
        completedText={`${dashboardData.completed_lessons_count} / ${dashboardData.total_lessons_count} dars tugatildi`}
      />

      {/* My Courses Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-brand-emerald" />
            <h2 className="text-sm font-bold text-brand-dark">Mening kurslarim</h2>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onExploreMore();
            }}
            className="text-xs font-semibold text-brand-emerald hover:underline"
          >
            Yangi kurs qo'shish
          </button>
        </div>

        <div className="space-y-3">
          {dashboardData.enrolled_courses.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                const fullCourse = courses.find((item) => item.id === c.id) || courses[0];
                haptic.impact('light');
                onSelectCourse(fullCourse);
              }}
              className="group bg-white rounded-card p-3.5 border border-brand-border/80 shadow-soft hover:shadow-elevated transition-all cursor-pointer active:scale-[0.98] flex items-center space-x-3.5"
            >
              <img
                src={c.cover_url}
                alt={c.title}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-brand-dark line-clamp-1 group-hover:text-brand-emerald transition-colors">
                  {c.title}
                </h4>
                <p className="text-[10px] text-brand-secondary line-clamp-1 mt-0.5">
                  Oxirgi: {c.last_lesson_title}
                </p>

                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-brand-surface rounded-full overflow-hidden border border-brand-border/60">
                    <div
                      className="h-full bg-brand-emerald rounded-full"
                      style={{ width: `${c.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-brand-emerald">
                    {c.progress_percent}%
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-brand-mint text-brand-emerald group-hover:bg-brand-emerald group-hover:text-white transition-colors">
                <Play className="w-4 h-4 fill-current" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
