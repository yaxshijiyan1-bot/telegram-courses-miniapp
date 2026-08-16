import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Palette,
  Code2,
  TrendingUp,
  Layers,
  ChevronRight,
  Play,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Course, ContinueLearningData } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  courses: Course[];
  continueData: ContinueLearningData | null;
  onSelectCourse: (course: Course) => void;
  onNavigateToCatalog: () => void;
  onNavigateToLearning: () => void;
  isLoading?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  courses,
  continueData,
  onSelectCourse,
  onNavigateToCatalog,
  onNavigateToLearning,
  isLoading = false
}) => {
  const { haptic } = useTelegram();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  const categories = [
    { id: 'Barchasi', label: 'Barchasi', icon: Layers },
    { id: 'AI', label: 'AI & Data', icon: Sparkles },
    { id: 'Dizayn', label: 'Dizayn', icon: Palette },
    { id: 'Dasturlash', label: 'Dasturlash', icon: Code2 },
    { id: 'Marketing', label: 'Marketing', icon: TrendingUp },
  ];

  // Active enrolled course for "Davom ettirish"
  const activeEnrolledCourse = courses.find(c => c.is_enrolled) || courses[0];

  const filteredCourses = selectedCategory === 'Barchasi'
    ? courses
    : courses.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());

  if (isLoading) {
    return (
      <div className="flex-1 px-4 py-4 space-y-5 animate-pulse">
        <div className="h-44 rounded-3xl shimmer-skeleton" />
        <div className="h-28 rounded-3xl shimmer-skeleton" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-48 rounded-2xl shimmer-skeleton" />
          <div className="h-48 rounded-2xl shimmer-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-6 text-white animate-fade-up">
      
      {/* 1. HERO SECTION: VisionOS Portal Background + Clean Typography */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/[0.08] p-5 sm:p-6">
        {/* Subtle Ambient Artwork Behind Glass */}
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="/images/hero_portal.jpg"
            alt="Hero Portal"
            className="w-full h-full object-cover filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/80 to-transparent" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-cyan/30 text-cyan text-[10px] font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3 stroke-cyan" />
            <span>2026 EDTECH PLATFORM</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Bugun nimani o‘rganamiz?
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs font-normal">
              Yangi bilimlar sari har bir qadam — kelajak sari yangi imkoniyat.
            </p>
          </div>
        </div>
      </div>

      {/* 2. DAVOM ETTIRISH HERO CARD (Primary Interactive Progress Module) */}
      {activeEnrolledCourse && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Davom ettirish
            </span>
            <button
              onClick={() => {
                haptic.impact('light');
                onNavigateToLearning();
              }}
              className="text-[11px] font-semibold text-cyan hover:underline flex items-center space-x-0.5"
            >
              <span>Mening darslarim</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div
            onClick={() => {
              haptic.impact('medium');
              onSelectCourse(activeEnrolledCourse);
            }}
            className="glass-panel-elevated p-4 rounded-3xl border border-white/[0.1] hover:border-cyan/40 card-interactive cursor-pointer relative overflow-hidden group shadow-soft"
          >
            {/* Subtle Cyan Glow on Card Corner */}
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex space-x-3.5 items-center">
              {/* Course Artwork Thumbnail */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-[#05070A] border border-white/10">
                <img
                  src={activeEnrolledCourse.cover_url}
                  alt={activeEnrolledCourse.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-cyan text-black flex items-center justify-center shadow-cyanGlowSm">
                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Course Details & Progress */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
                    {activeEnrolledCourse.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug truncate group-hover:text-cyan transition-colors">
                    {activeEnrolledCourse.title}
                  </h3>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                    <span>{activeEnrolledCourse.progress_percent || 68}% tugallandi</span>
                    <span className="text-slate-400">9 ta dars qoldi</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-deep to-cyan rounded-full animate-progress shadow-cyanGlowSm"
                      style={{ width: `${activeEnrolledCourse.progress_percent || 68}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA Row */}
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                02-modul • Master Prompt Arxitekturasi
              </span>
              <div className="inline-flex items-center space-x-1 text-xs font-bold text-cyan group-hover:translate-x-0.5 transition-transform">
                <span>Davom ettirish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CATEGORIES FILTER (Minimalist Glass Pills with SVG Icons) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Yo‘nalishlar
          </span>
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  haptic.selection();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 card-interactive ${
                  isSelected
                    ? 'glass-pill-active font-bold'
                    : 'glass-pill text-slate-300 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'stroke-cyan' : 'stroke-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FEATURED / ALL COURSES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Barcha Kurslar ({filteredCourses.length})
          </span>
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCatalog();
            }}
            className="text-[11px] font-semibold text-cyan hover:underline flex items-center space-x-0.5"
          >
            <span>Katalog</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onSelectCourse(course)}
              layout="grid"
            />
          ))}
        </div>
      </div>

      {/* 5. USTOZLAR (Lead Instructors in VisionOS Style) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Platforma Ustozlari
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Ustoz 1: Yaxshi Bola */}
          <div className="glass-panel p-3.5 rounded-2xl border border-white/[0.06] flex flex-col space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-cyan/40 flex-shrink-0">
                <img src="/images/yaxshi_bola.jpg" alt="Yaxshi Bola" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">Yaxshi Bola</h4>
                <span className="text-[10px] text-cyan block truncate">AI & Fullstack</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
              LLM arxitekturasi va Telegram ekotizimi bo‘yicha yetakchi mutaxassis.
            </p>
          </div>

          {/* Ustoz 2: Zuhra Olimova */}
          <div className="glass-panel p-3.5 rounded-2xl border border-white/[0.06] flex flex-col space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-cyan/40 flex-shrink-0">
                <img src="/images/zuhra_olimova.jpg" alt="Zuhra Olimova" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">Zuhra Olimova</h4>
                <span className="text-[10px] text-cyan block truncate">Product Design</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
              Fintech va EdTech interfeyslari bo‘yicha tajribali Art Director.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
