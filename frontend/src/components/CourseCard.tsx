import React from 'react';
import { Clock, BookOpen, Star, ArrowRight } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  variant?: 'vertical' | 'horizontal' | 'featured';
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onSelect,
  variant = 'vertical'
}) => {
  const { haptic } = useTelegram();

  const handleClick = () => {
    haptic.impact('light');
    onSelect(course);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + " so'm";
  };

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className="group relative overflow-hidden rounded-hero bg-gradient-to-br from-brand-forest via-brand-dark to-black text-white p-5 shadow-elevated cursor-pointer active:scale-[0.98] transition-all duration-200"
      >
        {/* Subtle background glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-brand-emerald/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Category and Rating */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-brand-gold/30">
            {course.category}
          </span>
          <div className="flex items-center space-x-1 text-xs text-amber-300 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{course.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Course Cover / Visual */}
        <div className="relative h-40 rounded-xl overflow-hidden mb-4">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-medium">
            <span className="flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-brand-emerald" />
              <span>{course.lesson_count} dars</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-brand-gold" />
              <span>{course.duration}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-lg font-serif font-bold text-brand-cream line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-white/70 line-clamp-2 mt-1 leading-relaxed">
            {course.short_description || course.description}
          </p>

          {/* Pricing and Action */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-bold text-brand-cream">
                  {formatPrice(course.price)}
                </span>
                {course.old_price && (
                  <span className="text-xs text-white/40 line-through">
                    {formatPrice(course.old_price)}
                  </span>
                )}
              </div>
            </div>
            <button className="flex items-center space-x-1.5 bg-brand-emerald text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-soft group-hover:bg-brand-deep active:scale-95 transition-all">
              <span>Ko'rish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Vertical Card
  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-card overflow-hidden border border-brand-border/80 shadow-soft hover:shadow-elevated transition-all duration-200 cursor-pointer active:scale-[0.98]"
    >
      {/* Image and Badges */}
      <div className="relative h-36 overflow-hidden bg-brand-surface">
        <img
          src={course.cover_url}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm">
            {course.category}
          </span>
        </div>
        {course.discount_percent && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-md shadow-sm">
              -{course.discount_percent}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        <div className="flex items-center space-x-3 text-[11px] text-brand-secondary font-medium mb-1.5">
          <span className="flex items-center space-x-1">
            <BookOpen className="w-3 h-3 text-brand-emerald" />
            <span>{course.lesson_count} dars</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-brand-gold" />
            <span>{course.duration}</span>
          </span>
          <span className="flex items-center space-x-1 ml-auto text-amber-500">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{course.rating.toFixed(1)}</span>
          </span>
        </div>

        <h3 className="text-sm font-semibold text-brand-dark line-clamp-2 leading-snug group-hover:text-brand-emerald transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-brand-border/60">
          <div>
            <span className="text-sm font-bold text-brand-dark">
              {formatPrice(course.price)}
            </span>
            {course.old_price && (
              <span className="block text-[10px] text-brand-muted line-through">
                {formatPrice(course.old_price)}
              </span>
            )}
          </div>
          <button className="p-1.5 rounded-lg bg-brand-mint text-brand-emerald group-hover:bg-brand-emerald group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
