import React, { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
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
    const matchesCat = activeCategory === 'Barchasi' || c.category.toLowerCase().includes(activeCategory.toLowerCase());
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
    <div className="flex-1 pb-36 px-4 pt-3 space-y-4 text-white animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="bg-[#131318] p-4 rounded-3xl border border-white/5 space-y-1">
        <span className="text-[10px] font-bold text-[#B4F523] uppercase tracking-wider">
          EKZLYUZIV KATALOG
        </span>
        <h1 className="text-base font-bold text-white">Barcha Kurslar Ro'yxati</h1>
        <p className="text-xs text-zinc-400">
          {filtered.length} ta premium kurs • 1 yillik to'liq kirish
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kurs nomi yoki mavzu bo'yicha qidiring..."
          className="w-full pl-10 pr-4 py-3 bg-[#131318] border border-white/5 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#B4F523] shadow-soft transition-all"
        />
      </div>

      {/* Category Pills & Sort */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  haptic.selection();
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#B4F523] text-black shadow-neonSm'
                    : 'bg-[#181820] text-zinc-400 border border-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center space-x-1 bg-[#181820] border border-white/5 rounded-xl px-2 py-1.5 text-zinc-400 flex-shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[11px] font-bold text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="popular" className="bg-[#181820]">Ommabop</option>
            <option value="price_asc" className="bg-[#181820]">Arzonroq</option>
            <option value="price_desc" className="bg-[#181820]">Qimmatroq</option>
          </select>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3 pt-1">
        {filtered.length > 0 ? (
          filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
              variant="vertical"
            />
          ))
        ) : (
          <div className="py-12 text-center text-zinc-500 space-y-2 bg-[#131318] rounded-3xl border border-white/5">
            <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs">Bunday kurs topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
};
