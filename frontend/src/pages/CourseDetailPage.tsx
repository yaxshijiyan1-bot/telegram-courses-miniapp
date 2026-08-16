import React, { useState, useEffect } from 'react';
import {
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [course.id]);

  const benefits = [
    { num: '01', title: 'Fundamental Asoslar', desc: "Nazariy poydevor, to‘g‘ri tushunchalar va tizimli fikrlash." },
    { num: '02', title: 'Amaliy Ko‘nikmalar', desc: "Real keyslar ustida bosqichma-bosqich ishlash va dasturlar bilan ishlash." },
    { num: '03', title: 'Professional Workflow', desc: "Ish jarayonini 10x tezlashtiruvchi tayyor shablonlar va master uslublar." },
    { num: '04', title: 'Real Portfobio Loyihalar', desc: "Xalqaro mijozlar va ish beruvchilarga taqdim etish uchun tayyor keys." },
    { num: '05', title: 'Bonus Materiallar va Cheatsheet', desc: "Barcha kerakli PDF qo‘llanmalar, skriptlar va doimiy yangilanishlar." },
  ];

  const faqs = [
    {
      q: 'Kursni qanday sotib olaman?',
      a: "Pastdagi 'Kursni olish' tugmasini bosing, qulay to‘lov tizimini (Payme, Click, Uzum yoki Telegram Stars) tanlang. To‘lovdan so‘ng kurs darhol shaxsiy kabinetingizda ochiladi."
    },
    {
      q: 'Xariddan keyin darslarga qanday kiraman?',
      a: "Xarid amalga oshirilishi bilan ilovaning 'O‘qish' bo‘limida kursingiz to‘liq aktiv holatga o‘tadi va barcha video darslarni istalgan vaqtda ko‘rishingiz mumkin."
    },
    {
      q: 'Darslarga telefondan kirish qulaymi?',
      a: "Ha, bu platforma maxsus Telegram Mini App va smartfonlar uchun moslashtirilgan. Video player, materiallar va progress nazorati to‘liq mobil formatda ishlaydi."
    },
    {
      q: 'Kursga kirish muddati qancha?',
      a: "Kursga kirish huquqi 1 yil (365 kun) davomida to‘liq beriladi. Ushbu davr mobaynida darslar, amaliy topshiriqlar va yangilanishlardan bemalol foydalanishingiz mumkin."
    },
    {
      q: "Darslarni ko'chirib olish yoki tarqatish mumkinmi?",
      a: "Yo‘q, darslar mualliflik huquqi bilan qat'iy himoyalangan. Darslarni ko'chirib olish, ekrandan yozib olish yoki tarqatish qat'iyan taqiqlanadi."
    },
    {
      q: 'Kurs yakunida sertifikat beriladimi?',
      a: "Ha, barcha darslarni to‘liq tugatganingizdan so‘ng, tizim tomonidan rasmiy QR-kodli, raqamli tekshiriladigan professional sertifikat beriladi."
    }
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + " so'm";
  };

  return (
    <div className="flex-1 pb-32 bg-[#05070A] text-white animate-fade-up">
      {/* Top Header Bar with Back Button */}
      <div className="sticky top-0 z-30 bg-[#05070A]/85 backdrop-blur-2xl px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <button
          onClick={() => {
            haptic.impact('light');
            onBack();
          }}
          className="flex items-center space-x-1.5 text-xs font-semibold text-white p-1.5 -ml-1.5 rounded-xl hover:bg-white/[0.04] active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span>Orqaga</span>
        </button>
        <span className="text-xs font-bold text-cyan uppercase tracking-wider">
          {course.category}
        </span>
      </div>

      {/* Hero Media Preview (3D Cinematic Artwork) */}
      <div className="relative aspect-video w-full bg-[#05070A] overflow-hidden">
        <img
          src={course.cover_url}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />
        
        {/* Play Preview Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-cyan text-black flex items-center justify-center shadow-cyanGlow border border-cyan/40">
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          </div>
        </div>

        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90 font-medium">
          <span className="bg-[#05070A]/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-slate-300">
            {course.duration} to‘liq kurs
          </span>
          <span className="flex items-center space-x-1 bg-[#05070A]/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-cyan">
            <span>{course.student_count}+ o‘quvchi</span>
          </span>
        </div>
      </div>

      {/* Course Title & Key Meta */}
      <div className="p-4 space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-cyan">
            <span className="bg-cyan/15 border border-cyan/30 px-2 py-0.5 rounded-md uppercase text-[10px]">
              {course.level}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {course.description}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="glass-panel-elevated rounded-3xl p-4 border border-white/[0.08] flex items-center justify-between shadow-soft">
          <div>
            <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
              1 Yillik Kafolatlangan Kirish
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-black text-white">
                {formatPrice(course.price)}
              </span>
              {course.old_price && (
                <span className="text-xs text-slate-500 line-through">
                  {formatPrice(course.old_price)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              haptic.impact('medium');
              if (course.is_enrolled) {
                if (course.modules?.[0]?.lessons?.[0]) {
                  onPlayLesson(course, course.modules[0].lessons[0]);
                }
              } else {
                onPurchase(course);
              }
            }}
            className="px-5 py-2.5 bg-cyan text-black font-black text-xs rounded-xl shadow-cyanGlowSm hover:opacity-90 active:scale-95 transition-all"
          >
            {course.is_enrolled ? 'Darsni boshlash' : 'Kursni olish'}
          </button>
        </div>

        {/* What You'll Learn (01-05 Cards) */}
        <div className="space-y-3 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Bu kursda nimalarni o‘rganasiz?
          </h2>
          <div className="space-y-2">
            {benefits.map((b) => (
              <div
                key={b.num}
                className="flex items-start space-x-3.5 p-3.5 glass-panel rounded-2xl border border-white/[0.06]"
              >
                <span className="font-bold text-xs text-cyan bg-cyan/10 border border-cyan/30 px-2 py-0.5 rounded-lg flex-shrink-0">
                  {b.num}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">{b.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum / Modules Accordion */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Darslar Dasturi
            </h2>
            <span className="text-[11px] text-cyan font-semibold">
              {course.modules?.length || 0} ta modul
            </span>
          </div>

          <div className="space-y-2.5">
            {course.modules?.map((module, mIdx) => {
              const isOpen = openModuleId === module.id;
              return (
                <div
                  key={module.id}
                  className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => {
                      haptic.selection();
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-md bg-cyan/15 border border-cyan/30 text-cyan text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {mIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-white truncate">{module.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-cyan" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Lessons List */}
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.06] space-y-2">
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
                              ? 'bg-[#11161D] hover:bg-cyan/10 text-white cursor-pointer border border-cyan/20'
                              : 'bg-[#0D1117] text-slate-500 opacity-60'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                            <span className="text-[10px] font-mono font-bold text-cyan flex-shrink-0">
                              {String(lIdx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-semibold text-white line-clamp-1">{lesson.title}</span>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-[10px] text-slate-400">{lesson.duration}</span>
                            {lesson.is_preview ? (
                              <span className="text-[10px] font-bold text-black bg-cyan px-2 py-0.5 rounded-md shadow-cyanGlowSm flex items-center space-x-1">
                                <Play className="w-2.5 h-2.5 fill-black" />
                                <span>Ochiq</span>
                              </span>
                            ) : course.is_enrolled ? (
                              <Play className="w-3.5 h-3.5 text-cyan fill-cyan" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
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
        <div className="space-y-3 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kurs Muallifi
          </h2>
          <div className="glass-panel rounded-3xl p-4 border border-white/[0.06] shadow-soft flex items-start space-x-3.5">
            <img
              src={course.instructor_avatar || (course.instructor_name?.includes('Zuhra') ? '/images/zuhra_olimova.jpg' : '/images/yaxshi_bola.jpg')}
              alt={course.instructor_name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan/40 flex-shrink-0 shadow-cyanGlowSm"
            />
            <div>
              <h4 className="text-sm font-bold text-white">{course.instructor_name}</h4>
              <span className="text-[11px] font-semibold text-cyan block mt-0.5">
                {course.instructor_title}
              </span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {course.instructor_bio || "Amaliy tajribaga ega yetakchi mutaxassis va platforma asoschisi."}
              </p>
            </div>
          </div>
        </div>

        {/* What You Get Features */}
        <div className="glass-panel text-white rounded-3xl p-4 border border-white/[0.06] shadow-soft space-y-3 mt-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kursda nimalar mavjud?</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
            <div className="flex items-center space-x-2 bg-[#11161D] p-2.5 rounded-xl border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-cyan" />
              <span className="font-medium">Full HD Video darslar</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#11161D] p-2.5 rounded-xl border border-white/[0.06]">
              <FileText className="w-4 h-4 text-cyan" />
              <span className="font-medium">PDF Materiallar</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#11161D] p-2.5 rounded-xl border border-white/[0.06]">
              <Award className="w-4 h-4 text-cyan" />
              <span className="font-medium">Rasmiy Sertifikat</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#11161D] p-2.5 rounded-xl border border-white/[0.06]">
              <ShieldCheck className="w-4 h-4 text-cyan" />
              <span className="font-medium">1 Yillik Kirish</span>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ko‘p beriladigan savollar
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden shadow-soft transition-all"
                >
                  <button
                    onClick={() => {
                      haptic.impact('light');
                      setOpenFaqIndex(isOpen ? null : idx);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-xs font-bold text-white pr-2 leading-snug">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-cyan flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-2 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06]">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#05070A]/90 backdrop-blur-2xl border-t border-white/[0.08] p-3.5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto flex items-center justify-between space-x-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Jami to‘lov:
            </span>
            <span className="text-base font-black text-cyan">
              {formatPrice(course.price)}
            </span>
          </div>

          <button
            onClick={() => {
              haptic.impact('medium');
              if (course.is_enrolled) {
                if (course.modules?.[0]?.lessons?.[0]) {
                  onPlayLesson(course, course.modules[0].lessons[0]);
                }
              } else {
                onPurchase(course);
              }
            }}
            className="flex-1 py-3.5 bg-cyan text-black font-black rounded-2xl shadow-cyanGlow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm tracking-wide"
          >
            <span>{course.is_enrolled ? 'Darslarni davom ettirish' : 'Kursni olish'}</span>
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
