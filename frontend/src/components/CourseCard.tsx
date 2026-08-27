import React from 'react';
import { motion } from 'motion/react';
import { Play, Check, Star } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { formatPrice } from '../utils/format';
import { toMediaUrl } from '../services/api';

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
    haptic?.impact?.('light');
    onClick();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className="glass !rounded-[22px] overflow-hidden pressable group flex flex-col justify-between"
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={toMediaUrl(course.cover_url)}
          alt={course.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/hero_books.jpg';
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

        {showTopBadge && (
          <div className="absolute top-0 left-0 bg-cyan text-white text-[9px] font-extrabold px-2.5 py-1 rounded-br-xl tracking-wider uppercase flex items-center gap-1 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-white" />
            TOP
          </div>
        )}

        {course.discount_percent ? (
          <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg tracking-wide shadow-sm">
            −{course.discount_percent}%
          </div>
        ) : null}

        {course.is_enrolled && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="w-9 h-9 rounded-full bg-cyan text-white flex items-center justify-center shadow-cyanGlowSm">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </span>
          </div>
        )}

        {/* Bottom info overlay on image */}
        <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="text-[9px] font-bold text-white/85 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
            {course.lesson_count || 0} dars
          </span>
          {course.rating ? (
            <span className="text-[9px] font-bold text-gold bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-gold" />
              {course.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1">
        <span className="text-[9px] font-extrabold text-cyan uppercase tracking-[0.14em] block">
          {course.category || 'Kurs'}
        </span>

        <h3 className="text-xs sm:text-[13px] font-bold text-ink leading-snug clamp-2 group-hover:text-cyan transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-ink-muted font-medium truncate">
            {course.instructor_name}
          </span>

          {course.is_enrolled ? (
            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px] font-extrabold">
              <Check className="w-3 h-3 stroke-[3]" />
              Faol
            </span>
          ) : course.old_price ? (
            <span className="text-right leading-none">
              <s className="text-[9px] text-ink-muted block">{formatPrice(course.old_price)}</s>
              <b className="text-[11px] font-extrabold text-cyan">{formatPrice(course.price)}</b>
            </span>
          ) : (
            <b className="text-[11px] font-extrabold text-cyan">{formatPrice(course.price)}</b>
          )}
        </div>
      </div>
    </motion.div>
  );
};
