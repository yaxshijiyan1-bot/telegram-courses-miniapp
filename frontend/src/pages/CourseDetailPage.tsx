import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  Play,
  Lock,
  ChevronDown,
  BookOpen,
  Clock,
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
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Maximize2,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { formatPrice } from '../utils/format';
import { api, toMediaUrl } from '../services/api';

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
  onPlayLesson,
}) => {
  const [openModuleId, setOpenModuleId] = useState<string | null>(course.modules?.[0]?.id || null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const { haptic } = useTelegram();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [course.id]);

  // Lightbox ochiq bo'lganda orqa sahifa scroll bo'lmasligi uchun tanani qulflash
  useEffect(() => {
    if (activePreviewIdx === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = '';
    };
  }, [activePreviewIdx]);

  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Xarid qilingan kurs kanali: a'zo bo'lsa kanal ochiladi, aks holda yangi bir martalik link
  const openChannel = async () => {
    if (channelLoading) return;
    haptic?.impact?.('light');
    setChannelLoading(true);
    setChannelError(null);
    try {
      const data = await api.getChannelLink(course.id);
      haptic?.notification?.('success');
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(data.url);
      } else {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      haptic?.notification?.('error');
      setChannelError(err?.message || "Kanal havolasini olishda xatolik");
    } finally {
      setChannelLoading(false);
    }
  };

  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? course.lesson_count;

  // Faqs — Yopiq kanal, bir martalik link va mualliflik huquqi qoidalari
  const faqs = [
    {
      q: "Darslar qayerda va qanday ko‘riladi?",
      a: "To‘lov tasdiqlanishi bilan Telegram botimiz orqali sizga rasmiy yopiq kanalga bir martalik maxsus havola (invite link) yuboriladi. Barcha darslar to‘liq shu yopiq kanalda joylashtirilgan va o‘sha yerda tomosha qilinadi."
    },
    {
      q: "Darslarni saqlab olish yoki tarqatish mumkinmi?",
      a: "Qat'iyan taqiqlanadi! Barcha video va materiallar mualliflik huquqi bilan himoyalangan. Darslarni saqlab olish, yozib olish yoki tarqatish qat'iy man etiladi."
    },
    {
      q: "Yopiq kanalga kirish muddati qancha?",
      a: "Bir martalik havola orqali yopiq kanalga kirib, barcha darslardan doimiy va cheksiz foydalanishingiz mumkin."
    },
    {
      q: "Savollar bo‘yicha kimga murojaat qilinadi?",
      a: "Darslar bo‘yicha barcha savollaringizga kanal admini va qo‘llab-quvvatlash mutaxassislari to‘g‘ridan-to‘g‘ri yordam beradi."
    }
  ];

  const rawGallery = Array.isArray(course.gallery_urls) ? course.gallery_urls : [];
  const galleryList = rawGallery.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  const testimonialList = Array.isArray(course.testimonials) ? course.testimonials : [];
  const customInfoList = Array.isArray(course.custom_info) ? course.custom_info : [];

  
  // Nimalarni o'rganasiz bandlari (admin kiritgan bo'lsa)
  const outcomesList = Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0
    ? course.learning_outcomes
    : [
        "Noldan boshlab professional darajagacha amaliy ko‘nikma va real keyslar",
        "Bozorda talab yuqori bo‘lgan zamonaviy vositalar va sun'iy intellekt instrumentlari",
        "Portfolio uchun xalqaro standartdagi to‘liq amaliy loyihalar tayyorlash",
        "Yopiq Telegram jamiyatida ustoz va mutaxassislardan doimiy yordam",
        "Dars materiallari, shablonlar va amaliy qo'llanmalar to‘plami"
      ];

  const showOutcomes = course.show_outcomes !== false;
  const showInstructor = course.show_instructor !== false;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-36 animate-fade-up">
      {/* Top Floating Bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 flex items-center justify-between shadow-sm">
        <button
          type="button"
          onClick={() => {
            haptic?.impact?.('light');
            onBack();
          }}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 transition-all"
          aria-label="Orqaga"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.4} />
        </button>

        <span className="text-xs font-extrabold text-slate-900 truncate max-w-[200px]">
          {course.title}
        </span>

        <span className="badge-cyan text-[9px] py-0.5 px-2">
          {course.category}
        </span>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Main Cover & Hero Image */}
        <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-900 shadow-md border border-slate-200/80">
          <img
            src={toMediaUrl(course.cover_url)}
            alt={course.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/hero_books.jpg';
            }}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
            <span className="badge-cyan text-[9px] py-0.5 px-2 w-max mb-1.5 font-bold">
              {course.category} · {course.level || "Boshlang'ichdan Yuqori"}
            </span>
            <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Price & Primary CTA Banner */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Kurs Narxi</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-extrabold text-sky-600">
                  {formatPrice(course.price)}
                </span>
                {course.old_price && course.old_price > course.price && (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatPrice(course.old_price)}
                  </span>
                )}
              </div>
            </div>

            {course.discount_percent ? (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-extrabold">
                -{course.discount_percent}% Chegirma
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 bg-slate-50 rounded-2xl">
              <Clock className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
              <span className="text-[10px] text-slate-500 block">Davomiyligi</span>
              <b className="text-xs text-slate-800 font-bold">{course.duration || '20 soat'}</b>
            </div>
            <div className="p-2 bg-slate-50 rounded-2xl">
              <BookOpen className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
              <span className="text-[10px] text-slate-500 block">Darslar</span>
              <b className="text-xs text-slate-800 font-bold">{totalLessons} ta dars</b>

            </div>
            <div className="p-2 bg-slate-50 rounded-2xl">
              <InfinityIcon className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
              <span className="text-[10px] text-slate-500 block">Kirish</span>
              <b className="text-xs text-slate-800 font-bold">Cheksiz</b>
            </div>
          </div>
        </div>

        {/* 1. Kursdan Lavhalar & Skrinshotlar (Galereya) */}
        {galleryList.length > 0 && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <span>Kursdan Lavhalar & Amaliy Natijalar</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {galleryList.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    haptic?.selection?.();
                    setActivePreviewIdx(idx);
                  }}
                  className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shadow-sm"
                >
                  <img
                    src={toMediaUrl(imgUrl)}
                    alt={`Kurs lavhasi ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      const fixed = toMediaUrl(target.src);
                      target.src = fixed !== target.src ? fixed : '/images/hero_books.jpg';
                    }}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kurs Tavsifi */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Kurs Haqida</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line">
            {course.description || course.short_description}
          </p>
        </div>

        {/* 2. Nimalarni o'rganasiz? (Agar admin yoqqan bo'lsa) */}
        {showOutcomes && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Kursda nimalarni o‘rganasiz?</span>
            </h3>

            <div className="space-y-2">
              {outcomesList.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-600 leading-relaxed">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Kurs muallifi (Agar admin yoqqan bo'lsa) */}
        {showInstructor && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm flex items-center space-x-3.5">
            <img
              src={course.instructor_avatar || (course.instructor_name?.includes('Zuhra') ? '/images/zuhra_olimova.jpg' : '/images/yaxshi_bola.jpg')}
              alt={course.instructor_name || 'Muallif'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/yaxshi_bola.jpg';
              }}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
            />

            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-sky-600 font-extrabold uppercase tracking-wider block">
                Kurs muallifi
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{course.instructor_name || 'Kreativ AI'}</h4>
              <p className="text-[10px] text-slate-500 truncate">{course.instructor_title || 'Katta Ekspert'}</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0" />
          </div>
        )}

        {/* 4. Qo'shimcha Ma'lumot Bloklari (Custom Info) */}
        {customInfoList.length > 0 && (
          <div className="space-y-2">
            {customInfoList.map((info, idx) => (
              <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>{info.title}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {info.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 5. Talabalar va Ekspertlar Fikrlari (Testimonials) */}
        {testimonialList.length > 0 && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>O‘quvchilar Fikrlari ({testimonialList.length})</span>
              </h3>
              <div className="flex items-center space-x-1 text-amber-500 font-bold text-xs">
                <span>★ 5.0</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {testimonialList.map((t, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-sky-600/10 border border-sky-600/20 text-sky-600 font-bold text-xs flex items-center justify-center">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block leading-tight">{t.name}</strong>
                        <span className="text-[10px] text-slate-500">{t.role || 'Talaba'}</span>
                      </div>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: t.rating || 5 }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Darslar Dasturi (Akkordeon) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Kurs dasturi</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {course.modules?.length || 0} modul · {totalLessons} dars
            </span>
          </div>

          {/* Yopiq kanal haqida ma'lumot */}
          <div className="bg-sky-50/80 border border-sky-200/90 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-sky-900 leading-relaxed shadow-sm">
            <ShieldAlert className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <b className="font-extrabold block text-sky-950 mb-0.5">Yopiq kanal orqali o‘rganish:</b>
              Barcha to‘liq video darslar xavfsiz Telegram yopiq kanalida joylashgan. To‘lov tasdiqlangach, bot sizga bir martalik kirish havolasini yuboradi. Darslarni saqlab olish yoki tarqatish qat'iyan taqiqlanadi.
            </div>
          </div>

          <div className="space-y-2">
            {course.modules?.map((module, mIdx) => {
              const isOpen = openModuleId === module.id;
              const doneCount = module.lessons.filter((l) => l.completed).length;

              return (
                <div key={module.id} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      haptic?.selection?.();
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                        {String(mIdx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{module.title}</span>
                        <span className="text-[10px] text-slate-500">
                          {module.lessons.length} ta dars
                          {course.is_enrolled && doneCount > 0 ? ` · ${doneCount} yakunlandi` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-1.5 bg-slate-50/50">
                      {module.lessons.map((lesson, lIdx) => {
                        const unlocked = lesson.is_preview || course.is_enrolled;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              if (unlocked) {
                                haptic?.impact?.('light');
                                onPlayLesson(course, lesson);
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                              unlocked
                                ? 'bg-white border border-slate-200 hover:border-sky-500 cursor-pointer active:scale-[0.99] shadow-sm'
                                : 'bg-slate-100/60 border border-transparent text-slate-400'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${unlocked ? 'text-sky-600' : 'text-slate-400'}`}>
                                {String(lIdx + 1).padStart(2, '0')}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-semibold text-xs block truncate ${unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {lesson.title}
                                </span>
                                {lesson.completed && (
                                  <span className="text-[9px] text-emerald-600 font-bold">Yakunlangan ✓</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-[10px] text-slate-400">{lesson.duration}</span>
                              {lesson.is_preview ? (
                                <span className="text-[9px] font-bold bg-sky-50 border border-sky-200 text-sky-600 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Ochiq</span>
                                </span>
                              ) : course.is_enrolled ? (
                                <Play className="w-3.5 h-3.5 text-sky-600 fill-current" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
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
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider px-1 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Ko‘p beriladigan savollar</span>
          </h3>

          <div className="space-y-1.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      haptic?.selection?.();
                      setOpenFaqIdx(isOpen ? null : idx);
                    }}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-900 pr-2">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
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
      <div className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-white/95 backdrop-blur-xl p-3 border-t border-slate-200/80 z-40 shadow-lg space-y-1.5">
        {channelError && (
          <p className="text-[10px] font-semibold text-red-500 text-center leading-snug animate-fade-in">
            {channelError}
          </p>
        )}
        <button
          type="button"
          disabled={channelLoading}
          onClick={() => {
            if (course.is_enrolled) {
              openChannel();
            } else {
              haptic?.impact?.('medium');
              onPurchase(course);
            }
          }}
          className="btn-primary w-full py-3.5 px-4 text-xs sm:text-sm font-extrabold flex items-center justify-center space-x-2 shadow-skyGlow disabled:opacity-60"
        >
          {course.is_enrolled ? (
            channelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2.4} />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{course.is_enrolled ? "Kanalga o'tish — darslar shu yerda" : 'Kursni xarid qilish'}</span>
        </button>
      </div>

      {/* Lightbox — to'liq ekran, sahifa scrolli qulflangan, surat qimirlamaydi */}
      {activePreviewIdx !== null && galleryList[activePreviewIdx] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in touch-none select-none"
          onClick={() => setActivePreviewIdx(null)}
          onTouchStart={(e) => {
            swipeStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const startX = swipeStartX.current;
            swipeStartX.current = null;
            if (startX === null || galleryList.length < 2) return;
            const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
            if (Math.abs(dx) < 48) return;
            const nextIdx = dx < 0 ? activePreviewIdx + 1 : activePreviewIdx - 1;
            if (nextIdx >= 0 && nextIdx < galleryList.length) {
              haptic?.selection?.();
              setActivePreviewIdx(nextIdx);
            }
          }}
        >
          <img
            key={activePreviewIdx}
            src={toMediaUrl(galleryList[activePreviewIdx])}
            alt={`Kurs lavhasi ${activePreviewIdx + 1}`}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full object-contain animate-zoom-in"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePreviewIdx(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" strokeWidth={2.4} />
          </button>

          {galleryList.length > 1 && activePreviewIdx > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                haptic?.selection?.();
                setActivePreviewIdx(activePreviewIdx - 1);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all"
              aria-label="Oldingi surat"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
            </button>
          )}

          {galleryList.length > 1 && activePreviewIdx < galleryList.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                haptic?.selection?.();
                setActivePreviewIdx(activePreviewIdx + 1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 active:scale-90 transition-all"
              aria-label="Keyingi surat"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
            </button>
          )}

          {galleryList.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-bold pointer-events-none">
              {activePreviewIdx + 1} / {galleryList.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
