import React, { useState } from 'react';
import { Search, Sparkles, Palette, Code2, TrendingUp, Layers, Filter } from 'lucide-react';
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
  isLoading = false
}) => {
  const { haptic } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  const categories = [
    { id: 'Barchasi', label: 'Barchasi', icon: Layers },
    { id: 'AI', label: 'AI & Data', icon: Sparkles },
    { id: 'Dizayn', label: 'Dizayn', icon: Palette },
    { id: 'Dasturlash', label: 'Dasturlash', icon: Code2 },
    { id: 'Marketing', label: 'Marketing', icon: TrendingUp },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'Barchasi' ||
      course.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.short_description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-5 text-white animate-fade-up">
      
      {/* Search Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white tracking-tight">
          Kurslar Katalogi
        </h1>
        <p className="text-xs text-slate-400">
          Professional darajada tayyorlangan barcha amaliy dasturlar
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 stroke-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs yoki ustoz nomi bo‘yicha qidiruv..."
          className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-white/[0.08] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 transition-all"
        />
      </div>

      {/* Categories Filter */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                haptic.selection();
                setSelectedCategory(cat.id);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 card-interactive ${
                isSelected
                  ? 'glass-pill-active font-bold'
                  : 'glass-pill text-slate-300 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'stroke-cyan' : 'stroke-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Natijalar ({filteredCourses.length})
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-3xl p-6 space-y-2 border border-white/[0.06]">
            <Search className="w-8 h-8 stroke-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Kurs topilmadi</h3>
            <p className="text-xs text-slate-400">
              Qidiruv so‘zini o‘zgartirib yoki boshqa yo‘nalishni tanlab ko‘ring.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onSelectCourse(course)}
                layout="grid"
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
