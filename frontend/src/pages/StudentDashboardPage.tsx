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
    <div className="flex-1 pb-24 px-4 pt-3 space-y-5 text-white animate-fade-up">
      {/* Personalized Greeting */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white tracking-tight">
          Assalomu alaykum, {user?.name ? user.name.split(' ')[0] : 'Talaba'}
        </h1>
        <p className="text-xs text-slate-400">
          Bugun bilimingizni rivojlantirish uchun ajoyib kun
        </p>
      </div>

      {/* Continue Learning Featured Card */}
      {continueItem && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Darsni davom ettirish
            </span>
          </div>

          <div
            onClick={() => {
              haptic.impact('medium');
              onContinueLesson(continueItem.course_id, continueItem.lesson_id);
            }}
            className="glass-panel-elevated rounded-3xl p-4 sm:p-5 border border-white/[0.08] hover:border-cyan/40 card-interactive cursor-pointer shadow-soft group relative overflow-hidden"
          >
            <div className="flex items-start space-x-3.5 relative z-10">
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-[#05070A] border border-white/10">
                <img
                  src={continueItem.course_cover || '/images/ai_course.jpg'}
                  alt={continueItem.course_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-cyan text-black flex items-center justify-center shadow-cyanGlowSm">
                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
                  Faol Dars
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-cyan transition-colors">
                  {continueItem.course_title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {continueItem.lesson_title}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{continueItem.progress_percent}% tugallandi</span>
                  <div className="flex items-center space-x-1 text-xs font-bold text-cyan">
                    <span>Davom ettirish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Mening Kurslarim ({dashboardData.enrolled_courses.length})
          </span>
          <button
            onClick={() => {
              haptic.impact('light');
              onExploreMore();
            }}
            className="text-[11px] text-cyan font-bold hover:underline"
          >
            Katalogga o‘tish →
          </button>
        </div>

        <div className="space-y-2.5">
          {dashboardData.enrolled_courses.map((course) => {
            const fullCourse = courses.find((c) => c.id === course.id) || courses[0];
            return (
              <div
                key={course.id}
                onClick={() => {
                  haptic.impact('light');
                  onSelectCourse(fullCourse);
                }}
                className="glass-panel p-3.5 rounded-2xl border border-white/[0.06] hover:border-cyan/40 card-interactive cursor-pointer flex items-center space-x-3.5 group"
              >
                <img
                  src={fullCourse.cover_url}
                  alt={course.title}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan transition-colors">
                    {course.title}
                  </h4>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan rounded-full animate-progress shadow-cyanGlowSm"
                      style={{ width: `${course.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">{course.progress_percent}% yakunlandi</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
