import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Compass, X, Sparkles, SlidersHorizontal, BookOpen } from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface CatalogPageProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  isLoading?: boolean;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  courses,
  onSelectCourse,
}) => {
  const { haptic } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Kategoriyalar kurslardan avtomatik yig'iladi
  const categories = useMemo(() => {
    const set = new Set<string>(courses.map((c) => c.category?.trim()).filter(Boolean) as string[]);
    return ['Barchasi', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesCategory =
        selectedCategory === 'Barchasi' ||
        course.category?.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        course.title.toLowerCase().includes(q) ||
        course.instructor_name?.toLowerCase().includes(q) ||
        course.short_description?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    haptic.impact('light');
    searchInputRef.current?.focus();
  };

  return (
    <div className="px-4 pt-3 pb-36 space-y-4 animate-fade-up">
      {/* Sarlavha */}
      <div className="space-y-1">
        <div className="flex items-center space-x-1.5">
          <span className="badge-cyan text-[9px] py-0.5 px-2 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            Kurs Marketi
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
          Siz uchun tanlangan <em className="text-[#22D3EE] font-serif not-italic">kurslar.</em>
        </h1>
      </div>

      {/* Mukammal Qidiruv Maydoni */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
          <Search className="w-4 h-4" strokeWidth={2.2} />
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs, mavzu yoki ustoz bo‘yicha qidiring..."
          className="w-full bg-[#0B0E14] border border-white/10 focus:border-[#22D3EE] rounded-2xl py-3.5 pl-10 pr-10 text-xs text-white placeholder-[#64748B] outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#22D3EE]/20"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-white"
            aria-label="Tozalash"
          >
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-3 h-3" />
            </div>
          </button>
        )}
      </div>

      {/* Kategoriya Tanlovchi Pills */}
      <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#22D3EE] text-[#05070A] shadow-md shadow-[#22D3EE]/20'
                  : 'bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Natijalar Soni */}
      <div className="flex items-center justify-between text-xs text-[#94A3B8] px-0.5">
        <span className="font-semibold">
          {searchQuery ? `"${searchQuery}" bo‘yicha qidiruv` : `${selectedCategory} kurslar`}
        </span>
        <span className="text-[11px] font-mono text-[#22D3EE] font-bold">
          {filteredCourses.length} ta kurs
        </span>
      </div>

      {/* Kurslar Ro'yxati / Grid */}
      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-[#64748B]">
            <Search className="w-6 h-6" />
          </div>
          <b className="text-sm text-white block">Hech qanday kurs topilmadi</b>
          <p className="text-xs text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
            "{searchQuery}" so‘rovi bo‘yicha natija yo‘q. Boshqa so‘z yoki boshqa kategoriyani tanlab ko‘ring.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Barchasi');
            }}
            className="btn-secondary px-4 py-2 text-xs font-bold inline-block mt-2"
          >
            Barcha kurslarni ko‘rsatish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onSelectCourse(course)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
