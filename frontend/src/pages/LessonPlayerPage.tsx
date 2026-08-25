import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  X,
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';

interface LessonPlayerPageProps {
  course: Course;
  lesson: Lesson;
  moduleTitle: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  onBack: () => void;
  onSelectLesson: (course: Course, lessonId: string) => void;
  onOpenAIMentor?: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export const LessonPlayerPage: React.FC<LessonPlayerPageProps> = ({
  course,
  lesson,
  moduleTitle,
  prevLessonId,
  nextLessonId,
  onBack,
  onSelectLesson,
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'files'>('about');
  const [isCompleted, setIsCompleted] = useState(lesson.completed || false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const { haptic } = useTelegram();

  const handleMarkComplete = async () => {
    haptic.impact('medium');
    haptic.notification('success');
    setIsCompleted(true);
    await api.markLessonComplete(course.id, lesson.id);
  };

  const lessonImage = (lesson as any).cover_url || course.cover_url || '/images/hero_books.jpg';

  return (
    <div className="flex-1 pb-safe bg-white text-slate-900 animate-fade-up flex flex-col justify-between">
      <div className="flex-1">
        {/* Top bar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-2xl">
          <button
            onClick={() => {
              haptic.selection();
              onBack();
            }}
            className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center px-2 min-w-0">
            <span className="text-[10px] font-extrabold text-cyan tracking-wider uppercase block truncate">
              {moduleTitle}
            </span>
            <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
              {lesson.title}
            </span>
          </div>

          <div className="w-9 h-9" />
        </div>

        {/* Dars Muqovasi / Infografika Rasmi (Videoplayer o'rnida) */}
        <div 
          onClick={() => {
            haptic.selection();
            setIsImageZoomed(true);
          }}
          className="w-full bg-slate-950 aspect-video relative overflow-hidden group cursor-pointer border-b border-slate-200"
        >
          <img
            src={lessonImage}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-between p-3.5">
            <div className="flex justify-end">
              <span className="p-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] flex items-center space-x-1">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Kattalashtirish</span>
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="badge-cyan text-[8px] py-0 px-1.5 font-bold">Amaliy Dars Materiali</span>
              <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">{lesson.title}</h3>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400">Dars tartibi: {lesson.duration || '15 daqiqa'}</span>
            <h1 className="text-base font-extrabold text-slate-900 mt-0.5">{lesson.title}</h1>
          </div>

          {/* Complete CTA */}
          <motion.button
            onClick={handleMarkComplete}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'btn-primary'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? '' : 'text-white'}`} strokeWidth={2.4} />
            <span>{isCompleted ? 'Dars tugallandi ✓' : 'Darsni tugallangan deb belgilash'}</span>
          </motion.button>

          {/* Tabs */}
          <div className="segmented mt-4">
            <button
              onClick={() => {
                haptic?.selection?.();
                setActiveTab('about');
              }}
              className={`segmented-pill ${activeTab === 'about' ? 'active' : ''}`}
            >
              Dars haqida
            </button>
            <button
              onClick={() => {
                haptic?.selection?.();
                setActiveTab('files');
              }}
              className={`segmented-pill ${activeTab === 'files' ? 'active' : ''}`}
            >
              Fayllar ({lesson.resources?.length || 0})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'about' ? (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
                className="space-y-3 pt-1"
              >
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Qisqacha mazmun
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                    {lesson.description || "Ushbu amaliy darsda siz kursning asosiy mavzularini o'rganasiz va real amaliy topshiriqlarni bajarasiz."}
                  </p>
                </div>

                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-sky-900 leading-relaxed font-medium">
                    Darsdagi tushunarsiz joylar bo'lsa, pastdagi <b>AI Mentor</b> tugmasi orqali istalgan savolingizni berishingiz mumkin.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
                className="space-y-2 pt-1"
              >
                {lesson.resources && lesson.resources.length > 0 ? (
                  lesson.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {res.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{res.size || 'PDF'}</span>
                        </div>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-cyan"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Ushbu dars uchun qo'shimcha fayl yo'q.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 sticky bottom-0 z-10">
        <button
          onClick={() => prevLessonId && onSelectLesson(course, prevLessonId)}
          disabled={!prevLessonId}
          className="py-3 px-4 rounded-2xl border border-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Oldingi dars</span>
        </button>

        <button
          onClick={() => nextLessonId && onSelectLesson(course, nextLessonId)}
          disabled={!nextLessonId}
          className="py-3 px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
        >
          <span>Keyingi dars</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lightbox Modal for Zoomed Image */}
      {isImageZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/10 p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lessonImage}
              alt={lesson.title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
