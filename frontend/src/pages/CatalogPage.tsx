import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface CatalogPageProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  courses,
  onSelectCourse
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Barchasi');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc'>('popular');
  const { haptic } = useTelegram();

  const categories = ['Barchasi', 'AI', 'Dizayn', 'Dasturlash', 'Marketing'];

  let filtered = courses.filter((c) => {
    const matchesCat = activeCategory === 'Barchasi' || c.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (sortBy === 'price_asc') {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="flex-1 pb-36 px-4 pt-3 space-y-4 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-serif font-bold text-brand-dark">Barcha Kurslar Katalogi</h1>
        <p className="text-xs text-brand-secondary mt-0.5">
          {filtered.length} ta eksklyuziv kurs • 1 yillik kafolatlangan to'liq kirish
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kurs nomi yoki mavzu bo'yicha qidiring..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-input text-xs sm:text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 shadow-sm transition-all"
        />
      </div>

      {/* Category Pills & Sort */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  haptic.selection();
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-emerald text-white font-semibold shadow-soft'
                    : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-emerald/40'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort select */}
        <select
          value={sortBy}
          onChange={(e) => {
            haptic.selection();
            setSortBy(e.target.value as any);
          }}
          className="bg-white border border-brand-border text-[11px] font-semibold text-brand-dark px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-brand-emerald shadow-sm"
        >
          <option value="popular">Mashhur</option>
          <option value="price_asc">Arzonroq</option>
          <option value="price_desc">Qimmatroq</option>
        </select>
      </div>

      {/* Courses List */}
      <div className="space-y-3 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-card border border-brand-border p-6">
            <Filter className="w-8 h-8 text-brand-muted mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-brand-dark">Kurslar topilmadi</h4>
            <p className="text-xs text-brand-secondary mt-1">
              Qidiruv so'zini yoki tanlangan kategoriyani o'zgartirib ko'ring.
            </p>
          </div>
        ) : (
          filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
              variant="vertical"
            />
          ))
        )}
      </div>
    </div>
  );
};
