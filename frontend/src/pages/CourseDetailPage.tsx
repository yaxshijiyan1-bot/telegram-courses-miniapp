import React, { useState, useEffect } from 'react';
import {
  Star,
  Clock,
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowLeft,
  FileText,
  Users
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onPurchase: (course: Course) => void;
  onPlayLesson: (course: Course, lesson: Lesson) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  onPurchase,
  onPlayLesson
}) => {
  const [openModuleId, setOpenModuleId] = useState<string | null>(course.modules?.[0]?.id || null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { haptic } = useTelegram();

  // Sahifa ochilganda har doim eng yuqoridan boshlanishi
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [course.id]);

  const benefits = [
    { num: '01', title: 'Fundamental Asoslar', desc: "Nazariy poydevor, to'g'ri tushunchalar va tizimli fikrlash." },
    { num: '02', title: 'Amaliy Ko‘nikmalar', desc: "Real keyslar ustida bosqichma-bosqich ishlash va dasturlar bilan ishlash." },
    { num: '03', title: 'Professional Workflow', desc: "Ish jarayonini 10x tezlashtiruvchi tayyor shablonlar va master uslublar." },
    { num: '04', title: 'Real Portfobio Loyihalar', desc: "Xalqaro mijozlar va ish beruvchilarga taqdim etish uchun tayyor keys." },
    { num: '05', title: 'Bonus Materiallar va Cheatsheet', desc: "Barcha kerakli PDF qo'llanmalar, skriptlar va doimiy yangilanishlar." },
  ];

  const faqs = [
    {
      q: 'Kursni qanday sotib olaman?',
      a: "Pastdagi 'Kursni sotib olish' tugmasini bosing, qulay to'lov tizimini (Payme, Click, Uzum yoki Telegram Stars) tanlang. To'lovdan so'ng kurs darhol shaxsiy kabinetingizda ochiladi."
    },
    {
      q: 'Xariddan keyin darslarga qanday kiraman?',
      a: "Xarid amalga oshirilishi bilan ilovaning 'O'qishim' (Mening kurslarim) bo'limida kursingiz to'liq aktiv holatga o'tadi va barcha video darslarni istalgan vaqtda ko'rishingiz mumkin."
    },
    {
      q: 'Darslarga telefondan kirish qulaymi?',
      a: "Ha, bu platforma maxsus Telegram Mini App va smartfonlar uchun moslashtirilgan. Video player, materiallar va progress nazorati to'liq mobil formatda ishlaydi."
    },
    {
      q: 'Kursga kirish muddati qancha?',
      a: "Kursga kirish huquqi 1 yil (365 kun) davomida to'liq beriladi. Ushbu davr mobaynida darslar, amaliy topshiriqlar va yangilanishlardan bemalol foydalanishingiz mumkin."
    },
    {
      q: "Darslarni ko'chirib olish yoki tarqatish mumkinmi?",
      a: "Yo'q, darslar mualliflik huquqi bilan qat'iy himoyalangan. Darslarni ko'chirib olish, ekrandan yozib olish yoki uchinchi shaxslarga tarqatish qat'iyan taqiqlanadi va qonuniy javobgarlikka sabab bo'ladi."
    },
    {
      q: 'Kurs yakunida sertifikat beriladimi?',
      a: "Ha, barcha darslarni to'liq tugatganingizdan so'ng, tizim tomonidan rasmiy QR-kodli, raqamli tekshiriladigan professional sertifikat beriladi."
    }
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + " so'm";
  };

  return (
    <div className="flex-1 pb-32 bg-brand-cream animate-in fade-in duration-200">
      {/* Top Header Bar with Back Button */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-brand-border/60 flex items-center justify-between">
        <button
          onClick={() => {
            haptic.impact('light');
            onBack();
          }}
          className="flex items-center space-x-1.5 text-xs font-semibold text-brand-dark p-1.5 -ml-1.5 rounded-xl hover:bg-brand-surface active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-brand-dark" />
          <span>Orqaga</span>
        </button>
        <span className="text-xs font-bold text-brand-emerald uppercase tracking-wider">
          {course.category}
        </span>
      </div>

      {/* Hero Media Preview */}
      <div className="relative aspect-video w-full bg-brand-dark overflow-hidden">
        <img
          src={course.cover_url}
          alt={course.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Play Preview Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-brand-emerald/90 text-white flex items-center justify-center shadow-elevated backdrop-blur-sm border border-white/20">
            <Play className="w-6 h-6 fill-white translate-x-0.5" />
          </div>
        </div>

        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90 font-medium">
          <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            {course.duration} to'liq kurs
          </span>
          <span className="flex items-center space-x-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-amber-300">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{course.rating.toFixed(1)} reyting</span>
          </span>
        </div>
      </div>

      {/* Course Title & Key Meta */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-brand-emerald mb-1.5">
            <span className="bg-brand-mint px-2 py-0.5 rounded-md uppercase">
              {course.level}
            </span>
            <span className="flex items-center space-x-1 text-brand-secondary">
              <Users className="w-3.5 h-3.5" />
              <span>{course.student_count}+ o'quvchi</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-brand-dark leading-snug">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-brand-secondary mt-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-brand-secondary uppercase tracking-wider block">
              Xarid narxi:
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold font-serif text-brand-dark">
                {formatPrice(course.price)}
              </span>
              {course.old_price && (
                <span className="text-xs text-brand-muted line-through">
                  {formatPrice(course.old_price)}
                </span>
              )}
            </div>
          </div>

          {course.discount_percent && (
            <span className="text-xs font-bold text-white bg-rose-500 px-2.5 py-1 rounded-xl shadow-sm">
              -{course.discount_percent}% chegirma
            </span>
          )}
        </div>

        {/* What You'll Learn (01-05 Cards) */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
            Bu kursda nimalarni o‘rganasiz?
          </h2>
          <div className="space-y-2">
            {benefits.map((b) => (
              <div
                key={b.num}
                className="flex items-start space-x-3.5 p-3.5 bg-white rounded-2xl border border-brand-border/80 shadow-sm"
              >
                <span className="font-serif font-bold text-base text-brand-emerald bg-brand-mint px-2 py-0.5 rounded-lg flex-shrink-0">
                  {b.num}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">{b.title}</h4>
                  <p className="text-[11px] text-brand-secondary mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum Accordion */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
              Darslar dasturi
            </h2>
            <span className="text-xs text-brand-emerald font-semibold">
              {course.lesson_count} ta dars
            </span>
          </div>

          <div className="space-y-2.5">
            {course.modules?.map((module, idx) => {
              const isOpen = openModuleId === module.id;
              return (
                <div
                  key={module.id}
                  className="bg-white rounded-2xl border border-brand-border/80 overflow-hidden shadow-sm transition-all"
                >
                  {/* Module Header */}
                  <button
                    onClick={() => {
                      haptic.impact('light');
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-brand-surface transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark leading-snug">
                        {module.title}
                      </h4>
                      <span className="text-[10px] text-brand-secondary font-medium">
                        {module.lessons.length} ta amaliy dars
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-secondary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-brand-secondary" />
                    )}
                  </button>

                  {/* Lessons List */}
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-brand-border/40 space-y-2">
                      {module.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (lesson.is_preview || course.is_enrolled) {
                              haptic.impact('light');
                              onPlayLesson(course, lesson);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                            lesson.is_preview || course.is_enrolled
                              ? 'bg-brand-mint/40 hover:bg-brand-mint text-brand-dark cursor-pointer'
                              : 'bg-brand-surface text-brand-secondary opacity-75'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                            <span className="text-[10px] font-mono font-bold text-brand-muted flex-shrink-0">
                              {String(lIdx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-medium line-clamp-1">{lesson.title}</span>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-[10px] text-brand-muted">{lesson.duration}</span>
                            {lesson.is_preview ? (
                              <span className="text-[10px] font-bold text-brand-emerald bg-white px-2 py-0.5 rounded-md border border-brand-emerald/30 shadow-sm flex items-center space-x-1">
                                <Play className="w-2.5 h-2.5 fill-brand-emerald" />
                                <span>Preview</span>
                              </span>
                            ) : course.is_enrolled ? (
                              <Play className="w-3.5 h-3.5 text-brand-emerald fill-brand-emerald" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-brand-muted" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructor Card */}
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
            Kurs Muallifi
          </h2>
          <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-soft flex items-start space-x-3.5">
            <img
              src={course.instructor_avatar}
              alt={course.instructor_name}
              className="w-14 h-14 rounded-2xl object-cover border border-brand-border flex-shrink-0"
            />
            <div>
              <h4 className="text-sm font-bold text-brand-dark">{course.instructor_name}</h4>
              <span className="text-[11px] font-semibold text-brand-emerald block mt-0.5">
                {course.instructor_title}
              </span>
              <p className="text-xs text-brand-secondary mt-1 leading-relaxed">
                {course.instructor_bio}
              </p>
            </div>
          </div>
        </div>

        {/* What You Get Features */}
        <div className="bg-gradient-to-br from-brand-forest to-brand-dark text-white rounded-2xl p-4 shadow-elevated space-y-3 mt-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <h3 className="text-sm font-bold text-brand-cream">Kursda nimalar mavjud?</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/90">
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
              <span>Full HD Video darslar</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-xl">
              <FileText className="w-4 h-4 text-brand-gold" />
              <span>PDF Materiallar</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-xl">
              <Award className="w-4 h-4 text-brand-emerald" />
              <span>Rasmiy Sertifikat</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>Umrbod kirish</span>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
            Ko'p beriladigan savollar
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-brand-border/80 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => {
                      haptic.impact('light');
                      setOpenFaqIndex(isOpen ? null : idx);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-brand-surface"
                  >
                    <span className="text-xs font-bold text-brand-dark pr-2">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-0 text-xs text-brand-secondary leading-relaxed border-t border-brand-border/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Purchase Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border p-3.5 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-between space-x-4">
          <div>
            <span className="text-[10px] font-semibold text-brand-secondary uppercase block">
              Jami to'lov:
            </span>
            <span className="text-base font-bold font-serif text-brand-dark">
              {formatPrice(course.price)}
            </span>
          </div>

          <button
            onClick={() => {
              haptic.impact('medium');
              if (course.is_enrolled) {
                // To'g'ridan-to'g'ri darsga o'tish
                if (course.modules?.[0]?.lessons?.[0]) {
                  onPlayLesson(course, course.modules[0].lessons[0]);
                }
              } else {
                onPurchase(course);
              }
            }}
            className="flex-1 py-3.5 bg-brand-emerald text-white font-bold rounded-2xl shadow-elevated hover:bg-brand-deep active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm tracking-wide"
          >
            <span>{course.is_enrolled ? 'Darslarni davom ettirish' : 'Kursni sotib olish'}</span>
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </button>
        </div>
      </div>
    </div>
  );
};
