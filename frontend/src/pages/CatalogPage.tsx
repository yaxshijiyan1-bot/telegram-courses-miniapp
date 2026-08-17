import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Compass, Sparkles } from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface CatalogPageProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  isLoading?: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

export const CatalogPage: React.FC<CatalogPageProps> = ({
  courses,
  onSelectCourse,
}) => {
  const { haptic } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  // Kategoriyalar kurslardan avtomatik yig'iladi — qo'lda emas
  const categories = useMemo(() => {
    const set = new Set<string>(courses.map((c) => c.category?.trim()).filter(Boolean) as string[]);
    return ['Barchasi', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'Barchasi' ||
      course.category?.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      course.title.toLowerCase().includes(q) ||
      course.instructor_name?.toLowerCase().includes(q) ||
      course.short_description?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pt-4 space-y-4"
    >
      {/* Sarlavha */}
      <motion.div variants={item} className="space-y-1">
        <p className="eyebrow flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan" />
          Kurs marketi
        </p>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight tracking-tight">
          Siz uchun<br />
          <em className="serif-accent">tanlangan.</em>
        </h1>
      </motion.div>

      {/* Qidiruv */}
      <motion.div variants={item} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-muted">
          <Search className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs yoki ustoz bo‘yicha qidiring..."
          className="field !rounded-2xl !py-3 !pl-11"
        />
      </motion.div>

      {/* Kategoriya tabletkalari — animated selection */}
      <motion.div variants={item} className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                haptic.selection();
                setSelectedCategory(cat);
              }}
              className={`relative px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors duration-200 ${
                isSelected ? 'text-[#05070A]' : 'glass-chip text-ink-secondary hover:text-ink'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="catalog-pill"
                  className="absolute inset-0 rounded-xl bg-cyan shadow-cyanGlowSm"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Qiymat strip */}
      <motion.div variants={item} className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {['Bir martalik to‘lov', 'Telegramdan kirish', 'Rasmiy sertifikat'].map((t) => (
          <span
            key={t}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full glass-chip text-[10px] font-bold text-ink-secondary whitespace-nowrap"
          >
            <Check className="w-3 h-3 stroke-[3] text-cyan" />
            <span>{t}</span>
          </span>
        ))}
      </motion.div>

      {/* Grid */}
      {filteredCourses.length === 0 ? (
        <motion.div variants={item} className="glass rounded-[24px] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl glass-chip flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-ink-muted" strokeWidth={2} />
          </div>
          <b className="text-sm text-ink block">Kurslar topilmadi</b>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Qidiruv so‘zini o‘zgartirib yoki boshqa yo‘nalishni tanlab ko‘ring.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredCourses.map((course, idx) => (
            <motion.div key={course.id} variants={item}>
              <CourseCard
                course={course}
                onClick={() => onSelectCourse(course)}
                showTopBadge={idx === 0}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
