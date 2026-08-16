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
    <div className="flex-1 pb-safe bg-[#05070A] text-white animate-fade-up flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-[#05070A]/85 backdrop-blur-2xl px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => {
              haptic.impact('light');
              onBack();
            }}
            className="flex items-center space-x-1.5 text-xs font-semibold text-white p-1.5 -ml-1.5 rounded-xl hover:bg-white/[0.04] active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Kursga qaytish</span>
          </button>
          <span className="text-[10px] font-bold text-cyan bg-cyan/15 border border-cyan/30 px-2.5 py-0.5 rounded-md">
            {lesson.duration}
          </span>
        </div>

        {/* Video Player Section */}
        <div className="p-3 bg-[#05070A]">
          <VideoPlayer
            src={lesson.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            poster={course.cover_url}
            onEnded={() => {
              setIsCompleted(true);
            }}
          />
        </div>

        {/* Lesson Info Header */}
        <div className="p-4 space-y-3.5">
          <div>
            <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
              {moduleTitle}
            </span>
            <h1 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
              {lesson.title}
            </h1>
          </div>

          {/* Mark Complete CTA Button */}
          <button
            onClick={handleMarkComplete}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all card-interactive ${
              isCompleted
                ? 'bg-cyan/15 text-cyan border border-cyan/40 shadow-cyanGlowSm'
                : 'bg-cyan text-black font-black shadow-cyanGlow hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-cyan' : 'text-black stroke-[2.5]'}`} />
            <span>{isCompleted ? 'Dars tugallandi ✓' : 'Darsni tugallangan deb belgilash'}</span>
          </button>

          {/* Tabs: Dars haqida / Fayllar */}
          <div className="flex bg-[#0D1117] p-1 rounded-2xl border border-white/[0.06] mt-4">
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('about');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'about'
                  ? 'bg-cyan text-black font-bold shadow-cyanGlowSm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dars haqida
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setActiveTab('files');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'files'
                  ? 'bg-cyan text-black font-bold shadow-cyanGlowSm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fayllar ({lesson.resources?.length || 0})
            </button>
          </div>

          {/* Tab 1: About Lesson */}
          {activeTab === 'about' && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {lesson.description ||
                  "Ushbu darsda siz kurs mavzusiga doir eng muhim tushunchalar, real amaliy misollar va professional ko‘nikmalarni o‘rganasiz."}
              </p>

              <div className="glass-panel p-3.5 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-cyan" />
                  <span>Amaliy topshiriq</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Darsdagi ko‘rsatmalarni o‘z loyihangizda sinab ko‘ring va natijalarni konspekt qilib boring.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Lesson Resources */}
          {activeTab === 'files' && (
            <div className="space-y-2 pt-2">
              {!lesson.resources || lesson.resources.length === 0 ? (
                <div className="text-center py-8 glass-panel rounded-2xl p-4 space-y-1 border border-white/[0.06]">
                  <FileText className="w-6 h-6 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Bu dars uchun qo‘shimcha fayllar biriktirilmagan.</p>
                </div>
              ) : (
                lesson.resources.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 glass-panel rounded-2xl border border-white/[0.06]"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan/15 text-cyan flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400">{file.size}</span>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      onClick={() => haptic.impact('light')}
                      className="px-3 py-1.5 bg-cyan text-black rounded-xl text-[10px] font-black flex items-center space-x-1 hover:opacity-90 shadow-cyanGlowSm flex-shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Yuklash</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Prev / Next Navigation Bar */}
      <div className="p-4 bg-[#05070A]/90 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-between space-x-3">
        <button
          onClick={() => {
            if (prevLessonId) {
              haptic.impact('light');
              onSelectLesson(course, prevLessonId);
            }
          }}
          disabled={!prevLessonId}
          className="flex-1 py-3 px-3 rounded-2xl glass-panel border border-white/[0.08] text-xs font-bold flex items-center justify-center space-x-1 disabled:opacity-30 disabled:pointer-events-none hover:border-cyan/40"
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
          className="flex-1 py-3 px-3 rounded-2xl bg-cyan text-black font-black text-xs flex items-center justify-center space-x-1 disabled:opacity-30 disabled:pointer-events-none shadow-cyanGlow hover:opacity-90"
        >
          <span>Keyingi dars</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
