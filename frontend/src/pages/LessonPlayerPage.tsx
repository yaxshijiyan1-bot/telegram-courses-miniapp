import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
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
    <div className="flex-1 pb-safe bg-brand-cream animate-in fade-in duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-brand-border/60 flex items-center justify-between">
          <button
            onClick={() => {
              haptic.impact('light');
              onBack();
            }}
            className="flex items-center space-x-1 text-xs font-semibold text-brand-dark p-1.5 -ml-1.5 rounded-xl hover:bg-brand-surface"
          >
            <ArrowLeft className="w-4 h-4 text-brand-dark" />
            <span>Kursga qaytish</span>
          </button>
          <span className="text-[11px] font-bold text-brand-emerald bg-brand-mint px-2 py-0.5 rounded-md">
            {lesson.duration}
          </span>
        </div>

        {/* Video Player Section */}
        <div className="p-3 bg-brand-dark">
          <VideoPlayer
            src={lesson.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            poster={course.cover_url}
            onEnded={() => {
              setIsCompleted(true);
            }}
          />
        </div>

        {/* Lesson Info Header */}
        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider block">
              {moduleTitle}
            </span>
            <h1 className="text-base sm:text-lg font-serif font-bold text-brand-dark mt-0.5">
              {lesson.title}
            </h1>
          </div>

          {/* Mark Complete CTA Button */}
          <button
            onClick={handleMarkComplete}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              isCompleted
                ? 'bg-brand-mint text-brand-emerald border border-brand-emerald/30'
                : 'bg-brand-emerald text-white shadow-soft hover:bg-brand-deep active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-brand-emerald' : 'text-white'}`} />
            <span>{isCompleted ? 'Dars tugallandi ✓' : 'Darsni tugallangan deb belgilash'}</span>
          </button>

          {/* Tabs: Dars haqida / Fayllar */}
          <div className="flex border-b border-brand-border pt-2">
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('about');
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'about'
                  ? 'border-brand-emerald text-brand-emerald'
                  : 'border-transparent text-brand-secondary hover:text-brand-dark'
              }`}
            >
              Dars haqida
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('files');
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'files'
                  ? 'border-brand-emerald text-brand-emerald'
                  : 'border-transparent text-brand-secondary hover:text-brand-dark'
              }`}
            >
              <span>Fayllar</span>
              {lesson.resources && lesson.resources.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-mint text-brand-emerald text-[9px] flex items-center justify-center font-bold">
                  {lesson.resources.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Contents */}
          <div className="pt-2">
            {activeTab === 'about' ? (
              <div className="space-y-3 text-xs text-brand-secondary leading-relaxed">
                <p>{lesson.description || "Ushbu darsda amaliy topshiriqlar va video material taqdim etiladi."}</p>
                <div className="p-3 bg-white rounded-xl border border-brand-border/60 text-[11px] space-y-1">
                  <span className="font-bold text-brand-dark block">Maslahat:</span>
                  <p>Darsni to'liq ko'rib bo'lgach, biriktirilgan qo'llanmalarni yuklab olib amalda qo'llab ko'ring.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {lesson.resources && lesson.resources.length > 0 ? (
                  lesson.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-brand-border flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-mint text-brand-emerald flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-brand-dark truncate">{res.name}</h4>
                          <span className="text-[10px] text-brand-muted">{res.size || '2.4 MB'} • PDF</span>
                        </div>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-brand-surface text-brand-emerald hover:bg-brand-mint transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-brand-muted bg-white rounded-xl border border-brand-border/60">
                    Ushbu dars uchun qo'shimcha fayllar biriktirilmagan.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next Navigation Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-border p-3 flex items-center justify-between space-x-3">
        <button
          onClick={() => {
            if (prevLessonId) {
              haptic.impact('light');
              onSelectLesson(course, prevLessonId);
            }
          }}
          disabled={!prevLessonId}
          className="flex-1 py-2.5 px-3 rounded-xl border border-brand-border text-brand-dark font-semibold text-xs flex items-center justify-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-surface active:scale-95 transition-all"
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
          className="flex-1 py-2.5 px-3 rounded-xl bg-brand-emerald text-white font-semibold text-xs flex items-center justify-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-deep active:scale-95 transition-all shadow-sm"
        >
          <span>Keyingi dars</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
