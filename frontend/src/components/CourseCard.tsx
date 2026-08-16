import React from 'react';
import { Clock, BookOpen, Star, ArrowRight, ShieldCheck } from 'lucide-react';
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

  return (
    <div
      onClick={handleClick}
      className="group bg-[#131318] rounded-3xl p-3.5 border border-white/5 hover:border-[#B4F523]/40 shadow-soft cursor-pointer active:scale-[0.98] transition-all duration-200 space-y-3"
    >
      {/* Cover Image */}
      <div className="relative h-36 rounded-2xl overflow-hidden bg-[#1B1B22]">
        <img
          src={course.cover_url}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131318] via-transparent to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[#B4F523]">
            {course.category}
          </span>
          <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] text-amber-300 font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{course.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Bottom Details */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-zinc-300 font-medium">
          <span className="flex items-center space-x-1 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-xs">
            <BookOpen className="w-3 h-3 text-[#B4F523]" />
            <span>{course.lesson_count} dars</span>
          </span>
          <span className="flex items-center space-x-1 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-xs">
            <Clock className="w-3 h-3 text-[#B4F523]" />
            <span>1 Yillik Kirish</span>
          </span>
        </div>
      </div>

      {/* Course Title and Info */}
      <div className="space-y-1">
        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-[#B4F523] transition-colors">
          {course.title}
        </h3>
        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
          {course.short_description || course.description}
        </p>
      </div>

      {/* Pricing & Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xs sm:text-sm font-black text-[#B4F523]">
              {formatPrice(course.price)}
            </span>
            {course.old_price && (
              <span className="text-[10px] text-zinc-500 line-through">
                {formatPrice(course.old_price)}
              </span>
            )}
          </div>
          <span className="text-[9px] text-zinc-400 font-medium">
            Ustoz: {course.instructor_name || 'Yaxshi Bola'}
          </span>
        </div>

        <button className="flex items-center space-x-1 bg-[#B4F523] text-black text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-neonSm group-hover:opacity-90 active:scale-95 transition-all">
          <span>Ochish</span>
          <ArrowRight className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
