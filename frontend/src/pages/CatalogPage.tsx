import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, X, GraduationCap, ChevronDown } from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';

interface CatalogPageProps {
  courses: Course[];
  purchasedCourseIds?: Set<string>;
  purchasesLoading?: boolean;
  onSelectCourse: (course: Course) => void;
  onNavigateToLearning?: () => void;
  isLoading?: boolean;
  searchFocusSignal?: number;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  courses,
  purchasedCourseIds,
  purchasesLoading,
  onSelectCourse,
  onNavigateToLearning,
  searchFocusSignal = 0,
}) => {
  const { haptic } = useTelegram();
  const { t } = useSettings();
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

  const hasQuery = searchQuery.trim().length > 0;

  const filteredCourses = useMemo(() => {
    // Qidiruv yozilganda barcha kurslar (shu jumladan sotib olinganlar)
    // ichidan izlanadi — qidiruv tizimi har doim ishlashi kerak
    const source = hasQuery ? courses : availableCourses;
    const q = searchQuery.trim().toLowerCase();
    return source.filter((course) => {
      const matchesCategory =
        selectedCategory === 'Barchasi' ||
        course.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        q === '' ||
        course.title.toLowerCase().includes(q) ||
        course.instructor_name?.toLowerCase().includes(q) ||
        course.short_description?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [courses, availableCourses, selectedCategory, searchQuery, hasQuery]);

  // Header'dagi qidiruv tugmasi bosilganda: maydon ko'rinib, fokuslanadi.
  // Tab endigina ko'rsatilganda fokus ishlamasligi mumkin — biroz kutamiz
  useEffect(() => {
    if (!searchFocusSignal) return;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInputRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [searchFocusSignal]);

  const clearSearch = () => {
    setSearchQuery('');
    haptic?.impact?.('light');
    searchInputRef.current?.focus();
  };

  return (
    <div className="pt-4 pb-36 animate-fade-up">
      {/* Sarlavha + qidiruv */}
      <div className="px-5 pb-4">
        <p className="text-[10.5px] font-extrabold text-cyan tracking-[0.14em] uppercase mb-1.5">
          {t('Kurs marketi')}
        </p>
        <h1 className="text-[28px] font-extrabold text-ink tracking-[-0.03em] leading-[1.1] mb-3.5">
          {t('Siz uchun tanlangan')}
          <br />
          <em className="serif-accent text-[30px]">{t('kurslar.')}</em>
        </h1>

        {/* Qidiruv maydoni — barcha kurslar sotib olingan bo'lsa ham doim ishlaydi */}
        <div
          className="flex items-center gap-2.5 bg-white rounded-2xl"
          style={{
            padding: '12px 14px',
            border: '1px solid var(--soft-border-2)',
            boxShadow: '0 2px 8px -4px rgba(15,23,42,0.05)',
          }}
        >
          <Search className="w-[17px] h-[17px] text-ink-muted flex-shrink-0" strokeWidth={2.2} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Kurs, ustoz yoki mavzu qidiring...')}
            className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px] text-ink font-medium placeholder-ink-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-ink-muted flex-shrink-0"
              aria-label={t('Tozalash')}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {allPurchased && !hasQuery ? (
        <div className="px-5">
          <div
            className="py-14 text-center rounded-[22px] space-y-3 p-6 animate-fade-up"
            style={{ background: 'var(--surface-elevated)', border: '1px dashed var(--soft-border-2)' }}
          >
            <div className="w-14 h-14 rounded-[18px] bg-cyan/10 flex items-center justify-center mx-auto text-cyan">
              <GraduationCap className="w-7 h-7" />
            </div>
            <b className="text-sm text-ink block">{t('Barcha kurslar sizda!')}</b>
            <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
              {t('Sotib olingan kurslaringiz «Darslarim» bo‘limida — barcha darslar yopiq kanalda. Yangi kurslar chiqishi bilan bu yerda ko‘rasiz.')}
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
                {t('Darslarimga o‘tish')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Kategoriya chiplari */}
          <div className="px-5 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    haptic?.selection?.();
                    setSelectedCategory(cat);
                  }}
                  className="flex-shrink-0 whitespace-nowrap text-xs font-bold transition-all duration-200"
                  style={{
                    padding: '8px 14px',
                    background: active ? 'linear-gradient(135deg, #0284C7, #38BDF8)' : 'var(--bg-base)',
                    color: active ? '#FFFFFF' : 'var(--ink-secondary)',
                    border: active ? 'none' : '1px solid var(--soft-border-2)',
                    borderRadius: 999,
                    boxShadow: active
                      ? '0 4px 12px -4px rgba(2,132,199,0.4)'
                      : '0 1px 3px rgba(15,23,42,0.03)',
                  }}
                >
                  {cat === 'Barchasi' ? t('Barchasi') : cat}
                </button>
              );
            })}
          </div>

          {/* Natijalar soni */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <span className="text-[11px] text-ink-muted font-semibold">
              {hasQuery ? (
                <>
                  &ldquo;{searchQuery}&rdquo; {t("bo'yicha")} —{' '}
                  <b className="text-ink font-extrabold">{filteredCourses.length}</b> {t('ta')}
                </>
              ) : (
                <>
                  <b className="text-ink font-extrabold">{filteredCourses.length}</b> {t('kurs topildi')}
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan">
              {t('Ommabop')}
              <ChevronDown className="w-3 h-3" />
            </span>
          </div>

          {/* Kurslar ro'yxati — sotib olishlar aniqlanmaguncha skeleton */}
          <div className="px-5">
            {purchasesLoading ? (
              <div className="flex flex-col gap-3.5">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[260px] rounded-[24px] bg-slate-100/80 animate-pulse" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div
                className="py-12 text-center rounded-[22px] space-y-1"
                style={{ background: 'var(--surface-elevated)', border: '1px dashed var(--soft-border-2)', padding: '48px 20px' }}
              >
                <div className="w-14 h-14 rounded-[18px] bg-cyan/10 flex items-center justify-center mx-auto text-cyan mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-ink">
                  {hasQuery ? t('Hech qanday kurs topilmadi') : t('Bu kategoriyada kurs yo‘q')}
                </div>
                <div className="text-[11.5px] text-ink-muted mt-1">
                  {hasQuery ? t('Boshqa so‘z yoki kategoriyani tanlab ko‘ring') : t('Yaqin orada yangilari qo‘shiladi')}
                </div>
                {hasQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Barchasi');
                    }}
                    className="mt-3 px-4 py-2 bg-slate-100 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs"
                  >
                    {t('Filtrlarni tozalash')}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
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
        </>
      )}
    </div>
  );
};
