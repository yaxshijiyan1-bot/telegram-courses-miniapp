import React from 'react';
import { Clock, Star, ArrowUpRight, Play, Check } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  layout?: 'grid' | 'horizontal' | 'compact';
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, layout = 'grid' }) => {
  const { haptic } = useTelegram();

  const handleClick = () => {
    haptic.impact('light');
    onClick();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  if (layout === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className="glass-panel p-3 rounded-2xl flex space-x-3.5 card-interactive cursor-pointer group hover:border-cyan/30"
      >
        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#05070A]">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {course.is_enrolled && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-cyan text-black flex items-center justify-center shadow-cyanGlowSm">
                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-cyan tracking-wider uppercase">
              {course.category}
            </span>
            <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan transition-colors">
              {course.title}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-white">
              {course.is_enrolled ? (
                <span className="text-cyan font-medium flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Ochilgan</span>
                </span>
              ) : (
                formatPrice(course.price)
              )}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {course.duration}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="glass-panel rounded-2xl overflow-hidden card-interactive cursor-pointer group flex flex-col justify-between hover:border-cyan/30"
    >
      {/* 3D Cinematic Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#05070A]">
        <img
          src={course.cover_url}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Top Floating Category Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#05070A]/80 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-cyan">
            {course.category}
          </span>
        </div>

        {course.is_enrolled && (
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-lg bg-cyan text-black text-[10px] font-bold shadow-cyanGlowSm">
              Faol
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan transition-colors">
            {course.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {course.short_description}
          </p>
        </div>

        {/* Metadata & Price Row */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              {course.instructor_name}
            </span>
            <span className="text-sm font-black text-white">
              {course.is_enrolled ? (
                <span className="text-cyan text-xs font-bold">Davom ettirish</span>
              ) : (
                formatPrice(course.price)
              )}
            </span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:bg-cyan group-hover:text-black group-hover:border-cyan flex items-center justify-center transition-all">
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-black transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};
