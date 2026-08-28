import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, Zap, Check } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/format';
import { toMediaUrl } from '../services/api';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  compact?: boolean;
}

// Kategoriya bo'yicha chip ranglari
const CAT_STYLES: Record<string, string> = {
  AI: 'bg-violet/10 text-violet border-violet/25',
  SMM: 'bg-cyan/10 text-cyan border-cyan/25',
  Dizayn: 'bg-gold/10 text-gold border-gold/25',
  Dasturlash: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/25',
};

const catStyle = (category?: string) =>
  CAT_STYLES[category || ''] || 'bg-cyan/10 text-cyan border-cyan/25';

// Ustoz avatarini aniqlash: kurs meta'dan keladi, aksa ism bo'yicha fallback
const instructorAvatar = (course: Course): string => {
  if (course.instructor_avatar) return toMediaUrl(course.instructor_avatar);
  return course.instructor_name?.toLowerCase().includes('zuhra')
    ? '/images/ustoz_zuhra_olimova.webp'
    : '/images/ustoz_yaxshi_bola.webp';
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onClick,
  compact = false,
}) => {
  const { haptic } = useTelegram();
  const { t } = useSettings();

  const handleClick = () => {
    haptic?.impact?.('light');
    onClick();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="bg-white border border-slate-900/[0.06] rounded-[24px] overflow-hidden pressable cursor-pointer"
      style={{ boxShadow: '0 8px 24px -12px rgba(15,23,42,0.10)', borderColor: 'var(--soft-border-2)' }}
    >
      {/* Cover */}
      <div className={`relative bg-slate-100 overflow-hidden ${compact ? 'h-[120px]' : 'h-[150px]'}`}>
        <img
          src={toMediaUrl(course.cover_url)}
          alt={course.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/hero_books.jpg';
          }}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.65) 100%)' }}
        />

        {/* Kategoriya + chegirma pillari */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-white/95 ${catStyle(course.category)}`}>
            {course.category || t('Kurs')}
          </span>
          {(course.discount_active || (course.discount_percent && !course.discount_limit)) ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-gold/25 bg-white/95 text-gold">
              <Zap className="w-[11px] h-[11px] fill-gold/20" />
              −{course.discount_percent}% {t('chegirma')}
            </span>
          ) : null}
          {course.discount_active && course.discount_spots_left != null ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-500/25 bg-white/95 text-rose-500">
              🔥 {course.discount_spots_left} {t('ta joy')}
            </span>
          ) : null}
        </div>

        {/* Sotib olingan kurs belgisi */}
        {course.is_enrolled && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2.5 py-1 rounded-full bg-white/95 text-emerald-600 border border-emerald-600/20">
            <Check className="w-3 h-3 stroke-[3]" />
            {course.progress_percent ? `${course.progress_percent}%` : t('Sizda')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3.5 pb-4">
        <h3 className="text-[15px] font-bold text-ink tracking-[-0.01em] leading-[1.3] clamp-2">
          {course.title}
        </h3>

        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-ink-muted font-medium">
          <BookOpen className="w-[13px] h-[13px]" />
          <span>{course.lesson_count || 0} {t('dars')}</span>
          {course.duration ? (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-slate-300" />
              <Clock className="w-[13px] h-[13px]" />
              <span>{course.duration}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={instructorAvatar(course)}
              alt={course.instructor_name || ''}
              className="w-[22px] h-[22px] rounded-full object-cover object-top border-[1.5px] border-white shadow-sm flex-shrink-0 bg-slate-100"
              loading="lazy"
            />
            <span className="text-[11px] font-semibold text-ink-secondary truncate">
              {course.instructor_name}
            </span>
          </div>

          {course.is_enrolled ? (
            <span className="text-[12px] font-extrabold text-emerald-600">{t('Faol')}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {course.discount_active && course.final_price != null && course.final_price < course.price ? (
                <>
                  <s className="text-[9.5px] text-slate-400 font-semibold">{formatPrice(course.price)}</s>
                  <b className="text-[14px] font-extrabold text-rose-500 tracking-[-0.01em]">
                    {formatPrice(course.final_price)}
                  </b>
                </>
              ) : (
                <>
                  {course.old_price ? (
                    <s className="text-[9.5px] text-slate-400 font-semibold">{formatPrice(course.old_price)}</s>
                  ) : null}
                  <b className="text-[14px] font-extrabold text-ink tracking-[-0.01em]">
                    {formatPrice(course.price)}
                  </b>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
