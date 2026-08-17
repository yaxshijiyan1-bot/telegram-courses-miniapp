import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Play,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Clock,
  Award
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onPurchase: (course: Course) => void;
  onPlayLesson: (course: Course, lesson: Lesson) => void;
}

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

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + " so'm";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pb-24 animate-fade-up">
      {/* Top Floating Bar */}
      <div className="sticky top-0 z-30 bg-[#f8fafc]/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onBack();
          }}
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-[#475569] hover:text-[#0f172a] active:scale-95 transition-all"
          aria-label="Orqaga"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-[#2563eb] bg-[#eff6ff] px-3 py-1 rounded-full border border-[#dbeafe]">
          {formatPrice(course.price)}
        </span>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-3 space-y-4">
        {/* Cover Image Frame */}
        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-soft">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-[#2563eb] text-white text-[10px] font-bold shadow-sm uppercase tracking-wider">
              {course.category || 'DIZAYN'}
            </span>
          </div>
        </div>

        {/* Title & Stats */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] leading-tight">
            {course.title}
          </h1>

          <div className="flex items-center space-x-2 text-xs text-[#64748b]">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>{course.duration}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>{course.lesson_count} dars</span>
            </span>
            <span>•</span>
            <span className="text-[#2563eb] font-semibold">O‘zbekcha</span>
          </div>
        </div>

        {/* Value Promise Banner */}
        <div className="p-3 bg-[#eff6ff] rounded-2xl border border-[#dbeafe] flex items-center space-x-2.5 text-xs text-[#2563eb] font-semibold">
          <Check className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
          <span>Bir marta to‘lang — darslarga 1 yil davomida istalgan vaqtda kiring.</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-[13px] leading-relaxed text-[#64748b]">
          {course.description ||
            "Aniq qadamlar, qisqa videolar va amaliy topshiriqlar orqali ko‘nikmani tizimli ravishda shakllantiring."}
        </p>

        {/* Instructor Info */}
        <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-soft flex items-center space-x-3.5">
          <img
            src={course.instructor_avatar || (course.instructor_name?.includes('Zuhra') ? '/images/zuhra_olimova.jpg' : '/images/yaxshi_bola.jpg')}
            alt={course.instructor_name}
            className="w-11 h-11 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] text-[#2563eb] font-bold uppercase tracking-wider block">
              Kurs Muallifi
            </span>
            <h4 className="text-xs font-bold text-[#0f172a] truncate">{course.instructor_name}</h4>
            <p className="text-[10px] text-[#64748b] truncate">{course.instructor_title}</p>
          </div>
        </div>

        {/* Modules & Lessons */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#0f172a]">Kurs dasturi</h2>
            <span className="text-xs font-semibold text-[#64748b]">
              {course.modules?.length || 3} modul
            </span>
          </div>

          <div className="space-y-2">
            {course.modules?.map((module, mIdx) => {
              const isOpen = openModuleId === module.id;

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft"
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#f8fafc] transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="w-6 h-6 rounded-lg bg-[#eff6ff] text-[#2563eb] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {String(mIdx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold text-[#0f172a] truncate">
                        {module.title}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#2563eb]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                    )}
                  </button>

                  {/* Lessons */}
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-1.5">
                      {module.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (lesson.is_preview || course.is_enrolled) {
                              haptic.impact('light');
                              onPlayLesson(course, lesson);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                            lesson.is_preview || course.is_enrolled
                              ? 'bg-[#eff6ff] text-[#0f172a] cursor-pointer hover:bg-[#dbeafe]'
                              : 'bg-slate-50 text-[#94a3b8] opacity-75'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <span className="text-[10px] font-mono font-bold text-[#2563eb]">
                              {String(lIdx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-semibold text-xs text-[#0f172a] truncate">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-[10px] text-[#64748b]">{lesson.duration}</span>
                            {lesson.is_preview ? (
                              <span className="text-[9px] font-bold text-white bg-[#2563eb] px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <Play className="w-2.5 h-2.5 fill-white" />
                                <span>Ochiq</span>
                              </span>
                            ) : course.is_enrolled ? (
                              <Play className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-[#94a3b8]" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-white/95 backdrop-blur-md p-3 border-t border-slate-100 z-40">
        <button
          type="button"
          onClick={() => {
            haptic.impact('medium');
            if (course.is_enrolled) {
              if (course.modules?.[0]?.lessons?.[0]) {
                onPlayLesson(course, course.modules[0].lessons[0]);
              }
            } else {
              onPurchase(course);
            }
          }}
          className="w-full py-3.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
        >
          <span>{course.is_enrolled ? 'Darslarni davom ettirish' : 'Kursni xarid qilish'}</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
