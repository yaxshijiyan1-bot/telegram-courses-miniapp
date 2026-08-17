import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Course, Lesson } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
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
}

const ease = [0.22, 1, 0.36, 1] as const;

export const LessonPlayerPage: React.FC<LessonPlayerPageProps> = ({
  course,
  lesson,
  moduleTitle,
  prevLessonId,
  nextLessonId,
  onBack,
  onSelectLesson
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'files'>('about');
  const [isCompleted, setIsCompleted] = useState(lesson.completed || false);
  const { haptic } = useTelegram();

  const handleMarkComplete = async () => {
    haptic.impact('medium');
    haptic.notification('success');
    setIsCompleted(true);
    await api.markLessonComplete(course.id, lesson.id);
  };

  return (
    <div className="flex-1 pb-safe bg-darkBg text-ink animate-fade-up flex flex-col justify-between">
      <div>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-darkBg/85 backdrop-blur-2xl px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => {
              haptic.impact('light');
              onBack();
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-ink p-1.5 -ml-1.5 rounded-xl hover:bg-white/[0.04] active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kursga qaytish</span>
          </button>
          <span className="text-[10px] font-extrabold text-cyan bg-cyan/10 border border-cyan/25 px-2.5 py-1 rounded-lg tabular-nums">
            {lesson.duration}
          </span>
        </div>

        {/* Video */}
        <div className="p-3">
          <VideoPlayer
            src={lesson.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            poster={course.cover_url}
            onEnded={() => {
              setIsCompleted(true);
            }}
          />
        </div>

        {/* Lesson info */}
        <div className="p-4 space-y-3.5">
          <div>
            <span className="text-[10px] font-extrabold text-cyan uppercase tracking-[0.14em] block">
              {moduleTitle}
            </span>
            <h1 className="text-base sm:text-lg font-extrabold text-ink mt-1 leading-snug">
              {lesson.title}
            </h1>
          </div>

          {/* Complete CTA */}
          <motion.button
            onClick={handleMarkComplete}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              isCompleted
                ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                : 'bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold shadow-cyanGlow'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? '' : 'text-[#05070A]'}`} strokeWidth={2.4} />
            <span>{isCompleted ? 'Dars tugallandi' : 'Darsni tugallangan deb belgilash'}</span>
          </motion.button>

          {/* Tabs */}
          <div className="segmented mt-4">
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('about');
              }}
              className={`segmented-pill ${activeTab === 'about' ? 'active' : ''}`}
            >
              Dars haqida
            </button>
            <button
              onClick={() => {
                haptic.selection();
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
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {lesson.description ||
                    'Ushbu darsda siz kurs mavzusiga doir eng muhim tushunchalar, real amaliy misollar va professional ko‘nikmalarni o‘rganasiz.'}
                </p>

                <div className="glass !rounded-[20px] p-3.5 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-ink">
                    <Sparkles className="w-4 h-4 text-cyan" strokeWidth={2.2} />
                    <span>Amaliy topshiriq</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Darsdagi ko‘rsatmalarni o‘z loyihangizda sinab ko‘ring va natijalarni konspekt qilib boring.
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
                {!lesson.resources || lesson.resources.length === 0 ? (
                  <div className="text-center py-8 glass !rounded-[20px] space-y-2">
                    <FileText className="w-6 h-6 text-ink-muted mx-auto" strokeWidth={1.8} />
                    <p className="text-xs text-ink-muted">Bu dars uchun qo‘shimcha fayllar biriktirilmagan.</p>
                  </div>
                ) : (
                  lesson.resources.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 glass !rounded-[20px]">
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/20 text-cyan flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-ink block truncate">{file.name}</span>
                          <span className="text-[10px] text-ink-muted">{file.size}</span>
                        </div>
                      </div>

                      <a
                        href={file.url}
                        onClick={() => haptic.impact('light')}
                        className="px-3 py-1.5 bg-cyan text-[#05070A] rounded-xl text-[10px] font-extrabold flex items-center space-x-1 shadow-cyanGlowSm flex-shrink-0 active:scale-95 transition-transform"
                      >
                        <Download className="w-3 h-3" />
                        <span>Yuklash</span>
                      </a>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="p-4 bg-darkBg/90 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-between space-x-3">
        <button
          onClick={() => {
            if (prevLessonId) {
              haptic.impact('light');
              onSelectLesson(course, prevLessonId);
            }
          }}
          disabled={!prevLessonId}
          className="flex-1 py-3 px-3 rounded-2xl glass-chip text-xs font-bold flex items-center justify-center space-x-1 disabled:opacity-30 disabled:pointer-events-none hover:border-cyan/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Oldingi dars</span>
        </button>

        <button
          onClick={() => {
            if (nextLessonId) {
              haptic.impact('light');
              onSelectLesson(course, nextLessonId);
            }
          }}
          disabled={!nextLessonId}
          className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold text-xs flex items-center justify-center space-x-1 disabled:opacity-30 disabled:pointer-events-none shadow-cyanGlowSm active:scale-[0.98] transition-transform"
        >
          <span>Keyingi dars</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
