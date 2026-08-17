import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Play,
  Lock,
  ChevronDown,
  BookOpen,
  Clock,
  Award,
  Star,
  Users,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
  Zap,
  Target,
  FileCheck2,
  HelpCircle,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { formatPrice } from '../utils/format';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onPurchase: (course: Course) => void;
  onPlayLesson: (course: Course, lesson: Lesson) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  onPurchase,
  onPlayLesson,
}) => {
  const [openModuleId, setOpenModuleId] = useState<string | null>(course.modules?.[0]?.id || null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const { haptic } = useTelegram();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [course.id]);

  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? course.lesson_count;

  const defaultOutcomes = [
    "Noldan boshlab professional darajagacha amaliy ko‘nikma va real keyslar",
    "Bozorda talab yuqori bo‘lgan zamonaviy vositalar va sun'iy intellekt instrumentlari",
    "Portfolio uchun xalqaro standartdagi 3+ ta to‘liq loyiha tayyorlash",
    "Frilans va ish topishda ustunlik beruvchi rasmiy QR-kodli sertifikat",
    "Yopiq Telegram jamiyatida ustoz va mutaxassislardan doimiy yordam",
    "Dars materiallari, shablonlar va amaliy cheklislar to‘plami"
  ];

  const targetAudiences = [
    { title: "Boshlang‘ichlar", desc: "Sohaga yangi kirib kelayotgan va tizimli ta'lim olmoqchi bo‘lganlar" },
    { title: "Amaliyotchilar", desc: "Mavjud bilimlarini yangilab, daromadini 2-3 barobar oshirmoqchi bo‘lganlar" },
    { title: "Frilanserlar", desc: "Xalqaro va mahalliy mijozlarga qimmat xizmat ko‘rsatishni istaganlar" }
  ];

  const faqs = [
    {
      q: "Kursni qachon va qayerda ko‘rsam bo‘ladi?",
      a: "To‘lov tasdiqlanishi bilan barcha darslar ushbu Telegram Mini App ichida ochiladi. Darslarni istalgan vaqtda va istalgan qurilmada ko‘rishingiz mumkin."
    },
    {
      q: "Savollarim bo‘lsa kimdan yordam olaman?",
      a: "Har bir talaba uchun maxsus yopiq Telegram guruh mavjud bo‘lib, u yerda ustozlar va mentorlar barcha savollaringizga javob berishadi."
    },
    {
      q: "Sertifikat qanday beriladi?",
      a: "Barcha video darslar va amaliy topshiriqlarni 100% yakunlaganingizdan so‘ng profilingizda raqamli tekshiriladigan QR sertifikat paydo bo‘ladi."
    },
    {
      q: "Darslar qancha muddatga beriladi?",
      a: "Darslarga 1 yil davomida cheksiz kirish imkoniyati beriladi — istalgan paytda takrorlash uchun qaytishingiz mumkin."
    }
  ];

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F4F7FB] pb-28 animate-fade-up">
      {/* Top Floating Bar */}
      <div className="sticky top-0 z-30 bg-[#05070A]/85 backdrop-blur-md px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onBack();
          }}
          className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-[#94A3B8] hover:text-white active:scale-90 transition-all"
          aria-label="Orqaga"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.4} />
        </button>

        <div className="flex items-center gap-1.5">
          {course.is_enrolled ? (
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-3 py-1.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              Sizga Ochiq
            </span>
          ) : (
            <span className="text-[11px] font-extrabold text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-3 py-1.5 rounded-full">
              {course.old_price && (
                <s className="text-[#64748B] mr-1.5 font-bold">{formatPrice(course.old_price)}</s>
              )}
              {formatPrice(course.price)}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4">
        {/* Course Hero & Cover */}
        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-[#0B0E14] border border-white/10 shadow-lg">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent" />
          
          <div className="absolute top-3 left-3">
            <span className="badge-cyan">
              {course.category || 'KURS'}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-[#94A3B8] font-bold">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-[#22D3EE]" /> {course.duration}
            </span>
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <BookOpen className="w-3.5 h-3.5 text-[#22D3EE]" /> {totalLessons} dars
            </span>
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> {course.rating?.toFixed(1) || '5.0'}
            </span>
          </div>
        </div>

        {/* Title & Short Details */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">
            {course.title}
          </h1>
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#94A3B8]">
            {course.description || course.short_description}
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="glass p-3 rounded-2xl flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <b className="text-xs text-white block">Amaliy Ta'lim</b>
              <span className="text-[10px] text-[#64748B] block truncate">Noldan real loyiha</span>
            </div>
          </div>

          <div className="glass p-3 rounded-2xl flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <b className="text-xs text-white block">Real Keyslar</b>
              <span className="text-[10px] text-[#64748B] block truncate">Portfolio uchun</span>
            </div>
          </div>

          <div className="glass p-3 rounded-2xl flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <b className="text-xs text-white block">QR Sertifikat</b>
              <span className="text-[10px] text-[#64748B] block truncate">Rasmiy tasdiqlangan</span>
            </div>
          </div>

          <div className="glass p-3 rounded-2xl flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <InfinityIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <b className="text-xs text-white block">1 Yil Kirish</b>
              <span className="text-[10px] text-[#64748B] block truncate">Cheksiz takrorlash</span>
            </div>
          </div>
        </div>

        {/* Nimalarni o'rganasiz? */}
        <div className="glass p-4 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            <span>Kursda nimalarni o‘rganasiz?</span>
          </h3>

          <div className="space-y-2">
            {defaultOutcomes.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs text-[#94A3B8] leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bu kurs kimlar uchun? */}
        <div className="space-y-2 pt-1">
          <h3 className="text-sm font-bold text-white px-1">Bu kurs kimlar uchun?</h3>
          <div className="grid grid-cols-1 gap-2">
            {targetAudiences.map((aud, idx) => (
              <div key={idx} className="glass p-3 rounded-2xl flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-white/5 text-[#22D3EE] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{aud.title}</h4>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">{aud.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Muallif */}
        <div className="glass rounded-3xl p-4 flex items-center space-x-3.5">
          <img
            src={course.instructor_avatar || (course.instructor_name?.includes('Zuhra') ? '/images/zuhra_olimova.jpg' : '/images/yaxshi_bola.jpg')}
            alt={course.instructor_name}
            className="w-12 h-12 rounded-2xl object-cover border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-[#22D3EE] font-extrabold uppercase tracking-wider block">
              Kurs muallifi
            </span>
            <h4 className="text-xs sm:text-[13px] font-bold text-white truncate">{course.instructor_name}</h4>
            <p className="text-[10px] text-[#64748B] truncate">{course.instructor_title}</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#22D3EE]/80 flex-shrink-0" />
        </div>

        {/* Darslar Dasturi (Akkordeon) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#22D3EE]" />
              <span>Kurs dasturi</span>
            </h3>
            <span className="text-xs font-bold text-[#64748B]">
              {course.modules?.length || 0} modul · {totalLessons} dars
            </span>
          </div>

          <div className="space-y-2">
            {course.modules?.map((module, mIdx) => {
              const isOpen = openModuleId === module.id;
              const doneCount = module.lessons.filter((l) => l.completed).length;

              return (
                <div key={module.id} className="glass overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="w-7 h-7 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                        {String(mIdx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{module.title}</span>
                        <span className="text-[10px] text-[#64748B]">
                          {module.lessons.length} ta dars
                          {course.is_enrolled && doneCount > 0 ? ` · ${doneCount} yakunlandi` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#22D3EE] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.06] space-y-1.5">
                      {module.lessons.map((lesson, lIdx) => {
                        const unlocked = lesson.is_preview || course.is_enrolled;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              if (unlocked) {
                                haptic.impact('light');
                                onPlayLesson(course, lesson);
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                              unlocked
                                ? 'bg-white/[0.04] border border-white/[0.06] hover:border-[#22D3EE]/40 cursor-pointer active:scale-[0.99]'
                                : 'bg-white/[0.01] border border-transparent text-[#64748B]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${unlocked ? 'text-[#22D3EE]' : 'text-[#64748B]'}`}>
                                {String(lIdx + 1).padStart(2, '0')}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-semibold text-xs block truncate ${unlocked ? 'text-white' : 'text-[#94A3B8]'}`}>
                                  {lesson.title}
                                </span>
                                {lesson.completed && (
                                  <span className="text-[9px] text-emerald-400 font-bold">Yakunlangan ✓</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-[10px] text-[#64748B]">{lesson.duration}</span>
                              {lesson.is_preview ? (
                                <span className="text-[9px] font-bold text-white bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] px-2 py-0.5 rounded-md flex items-center space-x-1">
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Ochiq</span>
                                </span>
                              ) : course.is_enrolled ? (
                                <Play className="w-3.5 h-3.5 text-[#22D3EE] fill-current" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#64748B]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Bo'limi */}
        <div className="space-y-2 pt-1">
          <h3 className="text-sm font-bold text-white px-1 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#22D3EE]" />
            <span>Ko‘p beriladigan savollar</span>
          </h3>

          <div className="space-y-1.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="glass overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setOpenFaqIdx(isOpen ? null : idx);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/[0.02]"
                  >
                    <span className="text-xs font-bold text-white pr-2">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#22D3EE] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#94A3B8] leading-relaxed border-t border-white/[0.06]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#05070A]/95 backdrop-blur-xl p-3 border-t border-white/[0.08] z-40">
        <button
          type="button"
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
          className="btn-primary w-full py-3.5 px-4 text-xs sm:text-sm font-extrabold flex items-center justify-center space-x-2"
        >
          <span>{course.is_enrolled ? 'Darslarni davom ettirish' : 'Kursni xarid qilish'}</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
