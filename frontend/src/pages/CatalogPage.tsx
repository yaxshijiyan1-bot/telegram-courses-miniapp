import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Compass, X, Sparkles, SlidersHorizontal, BookOpen, GraduationCap } from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface CatalogPageProps {
  courses: Course[];
  purchasedCourseIds?: Set<string>;
  onSelectCourse: (course) => void;
  onNavigateToLearning?: () => void;
  isLoading?: boolean;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  courses,
  purchasedCourseIds,
  onSelectCourse,
  onNavigateToLearning,
}) => {
  const { haptic } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sotuv bo'limida sotib olingan kurslar ko'rsatilmaydi
  const availableCourses = useMemo(
    () => courses.filter((c) => !purchasedCourseIds?.has(c.id)),
    [courses, purchasedCourseIds]
  );
  const allPurchased = courses.length > 0 && availableCourses.length === 0;

  // Kategoriyalar faqat sotuvdagi kurslardan yig'iladi
  const categories = useMemo(() => {
    const set = new Set<string>(availableCourses.map((c) => c.category?.trim()).filter(Boolean) as string[]);
    return ['Barchasi', ...Array.from(set)];
  }, [availableCourses]);

  const filteredCourses = useMemo(() => {
    return availableCourses.filter((course) => {
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
  }, [availableCourses, selectedCategory, searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    haptic?.impact?.('light');
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
          Siz uchun tanlangan <em className="text-cyan font-serif not-italic">kurslar.</em>
        </h1>
      </div>

      {allPurchased ? (
        <div className="py-14 text-center glass rounded-3xl space-y-3 p-6 animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-cyan/10 flex items-center justify-center mx-auto text-cyan">
            <GraduationCap className="w-6 h-6" />
          </div>
          <b className="text-sm text-slate-900 block">Barcha kurslar sizda!</b>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Sotib olingan kurslaringiz «Darslarim» bo‘limida — barcha darslar yopiq kanalda. Yangi kurslar chiqishi bilan bu yerda ko‘rasiz.
          </p>
          {onNavigateToLearning && (
            <button
              type="button"
              onClick={() => {
                haptic?.impact?.('medium');
                onNavigateToLearning();
              }}
              className="px-5 py-2.5 bg-cyan text-white font-bold rounded-xl text-xs shadow-cyanGlowSm active:scale-95 transition-transform"
            >
              Darslarimga o‘tish
            </button>
          )}
        </div>
      ) : (
        <>
      {/* Mukammal Qidiruv Maydoni */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" strokeWidth={2.2} />
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs, mavzu yoki ustoz bo‘yicha qidiring..."
          className="w-full bg-white border border-slate-200 focus:border-cyan rounded-2xl py-3.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm focus:ring-2 focus:ring-cyan/20"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
            aria-label="Tozalash"
          >
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
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
                haptic?.selection?.();
                setSelectedCategory(cat);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-cyan text-white shadow-sm border-cyan'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Natijalar Soni */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
        <span className="font-semibold">
          {searchQuery ? `"${searchQuery}" bo‘yicha qidiruv` : `${selectedCategory} kurslar`}
        </span>
        <span className="text-[11px] font-mono text-cyan font-bold">
          {filteredCourses.length} ta kurs
        </span>
      </div>

      {/* Kurslar Ro'yxati / Grid */}
      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <b className="text-sm text-slate-900 block">Hech qanday kurs topilmadi</b>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            "{searchQuery}" so‘rovi bo‘yicha natija yo‘q. Boshqa so‘z yoki boshqa kategoriyani tanlab ko‘ring.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Barchasi');
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs"
          >
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onSelectCourse(course)}
              showTopBadge={course.rating ? course.rating >= 4.8 : false}
            />
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};
