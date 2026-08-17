import React from 'react';
import { Bookmark, Play, Check } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  showTopBadge?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onClick,
  showTopBadge = false,
}) => {
  const { haptic } = useTelegram();

  const handleClick = () => {
    haptic.impact('light');
    onClick();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + " so'm";
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-soft active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between"
    >
      {/* 3D Image Cover Container */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        <img
          src={course.cover_url}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* TOP Badge */}
        {showTopBadge && (
          <div className="absolute top-0 left-0 bg-[#2563eb] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-br-xl shadow-sm tracking-wider uppercase">
            TOP
          </div>
        )}

        {/* Bookmark Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            haptic.impact('light');
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#0f172a] hover:text-[#2563eb] transition-colors"
          aria-label="Saqlash"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* Enrolled Play Overlay */}
        {course.is_enrolled && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-lg">
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-1">
        <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider block">
          {course.category || 'DIZAYN'}
        </span>

        <h3 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-snug line-clamp-1 group-hover:text-[#2563eb] transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#64748b] font-medium">
            {course.lesson_count || 12} dars · {course.level || "Boshlang'ich"}
          </span>

          <span className="text-xs font-bold text-[#2563eb]">
            {course.is_enrolled ? (
              <span className="text-[#10b981] flex items-center space-x-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span className="text-[10px] font-bold">Faol</span>
              </span>
            ) : (
              formatPrice(course.price)
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
