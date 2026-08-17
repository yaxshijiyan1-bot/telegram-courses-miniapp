import React, { useState } from 'react';
import { Search, Check, Layers, Sparkles, Palette, Code2, TrendingUp } from 'lucide-react';
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
  isLoading = false,
}) => {
  const { haptic } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  const categories = [
    { id: 'Barchasi', label: 'Barchasi' },
    { id: 'AI', label: 'AI' },
    { id: 'Dizayn', label: 'Dizayn' },
    { id: 'Biznes', label: 'Biznes' },
    { id: 'Marketing', label: 'Marketing' },
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
    <div className="px-4 pt-3 space-y-4 animate-fade-up">
      {/* 1. Header Title */}
      <div className="space-y-0.5">
        <p className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
          KURS MARKETI
        </p>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#0f172a] leading-tight tracking-tight">
          Siz uchun<br />
          <em className="font-serif italic font-normal text-[#2563eb]">tanlangan.</em>
        </h1>
      </div>

      {/* 2. Value Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 text-xs text-[#2563eb] font-semibold">
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] whitespace-nowrap">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Bir martalik to‘lov</span>
        </span>
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] whitespace-nowrap">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Telegramdan kirish</span>
        </span>
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] whitespace-nowrap">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Rasmiy sertifikat</span>
        </span>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs nomi yoki ustoz bo‘yicha qidiring..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 shadow-soft transition-all"
        />
      </div>

      {/* 4. Filter Categories Pills */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                haptic.selection();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'bg-white border border-slate-200/80 text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 5. 2-Column Catalog Grid */}
      {filteredCourses.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-2">
          <Search className="w-8 h-8 text-[#94a3b8] mx-auto" />
          <b className="text-sm text-[#0f172a] block">Kurslar topilmadi</b>
          <p className="text-xs text-[#64748b]">
            Qidiruv so‘zini o‘zgartirib yoki boshqa yo‘nalishni tanlab ko‘ring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredCourses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => onSelectCourse(course)}
              showTopBadge={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
