import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, Flame } from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';

interface HomePageProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onNavigateToCourses: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  courses,
  onSelectCourse,
  onNavigateToCourses
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const { haptic } = useTelegram();

  const categories = ['Barchasi', 'AI', 'Dizayn', 'Dasturlash', 'Marketing'];

  const filteredCourses = courses.filter((c) => {
    const matchesCat = selectedCategory === 'Barchasi' || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const featuredCourse = courses[0];
  const otherCourses = filteredCourses.filter(c => c.id !== featuredCourse?.id);

  return (
    <div className="flex-1 pb-safe-nav px-4 pt-3 space-y-5 animate-in fade-in duration-200">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kurs qidirish..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-input text-xs sm:text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 transition-all shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
            Yo‘nalishni tanlang
          </h2>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  haptic.selection();
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-emerald text-white shadow-soft font-semibold'
                    : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-emerald/40'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Promo Course (Featured) */}
      {!searchQuery && selectedCategory === 'Barchasi' && featuredCourse && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-dark">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Tavsiya etilgan Masterclass</span>
          </div>
          <CourseCard
            course={featuredCourse}
            onSelect={onSelectCourse}
            variant="featured"
          />
        </div>
      )}

      {/* Popular Courses Grid / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
            <h2 className="text-sm font-bold text-brand-dark">
              {searchQuery ? 'Qidiruv natijalari' : 'Mashhur kurslar'}
            </h2>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="text-xs font-semibold text-brand-emerald hover:underline"
          >
            Barchasi
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(searchQuery || selectedCategory !== 'Barchasi' ? filteredCourses : otherCourses).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
              variant="vertical"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
