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
  Sparkles,
  Zap,
  HelpCircle,
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
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';
import { formatNumber } from '../utils/format';
import { api, toMediaUrl } from '../services/api';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onPurchase: (course: Course) => void;
  onPlayLesson: (course: Course, lesson: Lesson) => void;
  onOpenTeacher?: (course: Course) => void;
}

// Kategoriya bo'yicha hero tag rangi
const TAG_TEXT: Record<string, string> = {
  AI: 'text-violet',
  SMM: 'text-cyan',
  Dizayn: 'text-gold',
  Dasturlash: 'text-emerald-600',
};

const instructorAvatar = (course: Course): string => {
  if (course.instructor_avatar) return toMediaUrl(course.instructor_avatar);
  return course.instructor_name?.toLowerCase().includes('zuhra')
    ? '/images/ustoz_zuhra_olimova.webp'
    : '/images/ustoz_yaxshi_bola.webp';
};

// Bo'lim sarlavhasi — yangi dizayndagi inline uslub
const SectionInline: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="flex items-baseline justify-between mb-1">
    <div className="text-[15px] font-extrabold text-ink tracking-[-0.02em]">{title}</div>
    {right}
  </div>
);

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course: courseProp,
  onBack,
  onPurchase,
  onPlayLesson,
  onOpenTeacher,
}) => {
  // Ro'yxat endpointi is_enrolled/modules/descriptionni qaytarmaydi —
  // sahifa ochilganda detail so'rovi orqali to'liq ma'lumot olinadi
  const [course, setCourse] = useState<Course>(courseProp);
  // Modul avto-ochilmaydi — foydalanuvchi o'zi tanlaydi
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const { haptic } = useTelegram();
  const { t } = useSettings();

  // Bo'lim tugmalari uchun havolalar
  const aboutRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    setCourse(courseProp);
    setOpenModuleId(null);
    let cancelled = false;
    api.getCourseDetail(courseProp.id)
      .then((d) => {
        if (!cancelled && d) {
            setCourse((prev) => ({ ...prev, ...d }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseProp.id]);

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
      setChannelError(err?.message || t("Kanal havolasini olishda xatolik"));
    } finally {
      setChannelLoading(false);
    }
  };

  const totalLessons = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? course.lesson_count;
  // "Birinchi N kishi" chegirmasi faol bo'lsa, to'lanadigan narx backend hisoblagan final_price bo'ladi
  const hasLiveDiscount = !course.is_enrolled && !!course.discount_active
    && course.final_price != null && course.final_price < course.price;
  const payPrice = hasLiveDiscount ? (course.final_price as number) : course.price;

  const durationParts = (course.duration || '').split(' ');
  const durationVal = durationParts[0] || '—';
  const durationLbl = durationParts.slice(1).join(' ') || t('davom');

  const faqs = [
    {
      q: t("Darslar qayerda va qanday ko‘riladi?"),
      a: t("To‘lov tasdiqlanishi bilan Telegram botimiz orqali sizga rasmiy yopiq kanalga bir martalik maxsus havola (invite link) yuboriladi. Barcha darslar to‘liq shu yopiq kanalda joylashtirilgan va o‘sha yerda tomosha qilinadi.")
    },
    {
      q: t("Darslarni saqlab olish yoki tarqatish mumkinmi?"),
      a: t("Qat'iyan taqiqlanadi! Barcha video va materiallar mualliflik huquqi bilan himoyalangan. Darslarni saqlab olish, yozib olish yoki tarqatish qat'iy man etiladi.")
    },
    {
      q: t("Yopiq kanalga kirish muddati qancha?"),
      a: t("Bir martalik havola orqali yopiq kanalga kirib, barcha darslardan doimiy va cheksiz foydalanishingiz mumkin.")
    },
    {
      q: t("Savollar bo‘yicha kimga murojaat qilinadi?"),
      a: t("Darslar bo‘yicha barcha savollaringizga kanal admini va qo‘llab-quvvatlash mutaxassislari to‘g‘ridan-to‘g‘ri yordam beradi.")
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
        t("Noldan boshlab professional darajagacha amaliy ko‘nikma va real keyslar"),
        t("Bozorda talab yuqori bo‘lgan zamonaviy vositalar va sun’iy intellekt instrumentlari"),
        t("Portfolio uchun xalqaro standartdagi to‘liq amaliy loyihalar tayyorlash"),
        t("Yopiq Telegram jamiyatida ustoz va mutaxassislardan doimiy yordam"),
      ];

  const showOutcomes = course.show_outcomes !== false;
  const showInstructor = course.show_instructor !== false;

  const stats = [
    { icon: BookOpen, val: `${totalLessons}`, lbl: t('dars') },
    { icon: Clock, val: durationVal, lbl: durationLbl },
    { icon: Users, val: course.student_count ? `${formatNumber(course.student_count)}+` : '—', lbl: t('talaba') },
    { icon: Star, val: course.rating ? String(course.rating) : '—', lbl: t('reyting') },
  ];

  // Bo'limlar bo'ylab navigatsiya — faqat mavjud bo'limlar ko'rsatiladi
  const sections = [
    { id: 'about', label: t('Kurs haqida'), ref: aboutRef, show: Boolean(course.description || course.short_description) },
    { id: 'lavhalar', label: t('Lavhalar'), ref: galleryRef, show: galleryList.length > 0 },
    { id: 'dastur', label: t('Dastur'), ref: programRef, show: (course.modules?.length ?? 0) > 0 },
    { id: 'savollar', label: t('Savollar'), ref: faqRef, show: true },
  ].filter((s) => s.show);

  // Scroll holatiga qarab faol bo'limni belgilash
  useEffect(() => {
    const onScroll = () => {
      let current = sections[0]?.id ?? 'about';
      for (const s of sections) {
        const el = s.ref.current;
        if (el && el.getBoundingClientRect().top <= 170) current = s.id;
      }
      setActiveSection((prev) => (prev === current ? prev : current));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, course.description, course.short_description, galleryList.length, course.modules?.length]);

  const scrollToSection = (id: string) => {
    const el = sections.find((s) => s.id === id)?.ref.current;
    if (!el) return;
    haptic?.selection?.();
    setActiveSection(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 116;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-ink pb-32 animate-fade-up dark-scope">
      {/* Back header — hero ustida shaffof */}
      <div className="sticky top-0 z-30 flex items-center justify-between" style={{ padding: '12px 16px' }}>
        <button
          type="button"
          onClick={() => {
            haptic?.impact?.('light');
            onBack();
          }}
          className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-ink active:scale-90 transition-transform"
          style={{
            background: 'var(--surface-card)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--soft-border-2)',
            boxShadow: '0 4px 12px -4px rgba(15,23,42,0.10)',
          }}
          aria-label={t('Orqaga')}
        >
          <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: '0 20px', marginTop: -12 }}>
        <div
          className="relative overflow-hidden"
          style={{
            height: 200,
            borderRadius: 24,
            border: '1px solid var(--soft-border-2)',
            boxShadow: '0 12px 30px -16px rgba(15,23,42,0.20)',
          }}
        >
          <img
            src={toMediaUrl(course.cover_url)}
            alt={course.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/hero_books.jpg';
            }}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,23,42,0.25) 0%, rgba(15,23,42,0.15) 40%, rgba(15,23,42,0.75) 100%)',
            }}
          />
          <div className="absolute flex gap-1.5" style={{ top: 14, left: 14 }}>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${TAG_TEXT[course.category || ''] || 'text-cyan'}`}
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              <Sparkles className="w-[11px] h-[11px]" />
              {course.category || t('Kurs')}
            </span>
            {(course.discount_active || (course.discount_percent && !course.discount_limit)) ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-gold"
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                <Zap className="w-[11px] h-[11px] fill-gold/20" />
                −{course.discount_percent}% {t('chegirma')}
              </span>
            ) : null}
          </div>
          <div className="absolute text-white" style={{ bottom: 14, left: 16, right: 16 }}>
            <div className="text-[24px] font-extrabold tracking-[-0.02em] leading-[1.15]">
              {course.title}
            </div>
            {course.short_description ? (
              <div className="text-[12.5px] opacity-95 mt-1 font-medium clamp-1">
                {course.short_description}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Birinchi N kishi uchun chegirma banneri */}
      {hasLiveDiscount ? (
        <div className="flex items-center gap-2.5 bg-gold/10 border border-gold/30 rounded-2xl animate-fade-in" style={{ margin: '12px 20px 0', padding: '10px 14px' }}>
          <Zap className="w-4 h-4 text-gold flex-shrink-0 fill-gold/20" />
          <p className="text-[11.5px] font-bold text-ink leading-snug">
            −{course.discount_percent}% {t('chegirma')} — {t('birinchi')} {course.discount_limit} {t('kishi uchun')}.{' '}
            {course.discount_spots_left != null ? (
              <span className="text-rose-500">{course.discount_spots_left} {t('ta joy qoldi')}!</span>
            ) : null}
          </p>
        </div>
      ) : null}

      {/* Statistika qatori */}
      <div className="flex gap-2" style={{ padding: '16px 20px 8px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="flex-1 text-center bg-white"
              style={{
                padding: '10px 8px',
                border: '1px solid var(--soft-border)',
                borderRadius: 14,
              }}
            >
              <div className="text-cyan mb-1 inline-flex">
                <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
              </div>
              <div className="text-[13px] font-extrabold text-ink tracking-[-0.01em]">{s.val}</div>
              <div className="text-[9px] text-ink-muted font-semibold mt-0.5">{s.lbl}</div>
            </div>
          );
        })}
      </div>

      {/* Ustoz kartasi — bosilganda ustoz profili ochiladi */}
      {showInstructor && (
        <div style={{ padding: '12px 20px 8px' }}>
          <button
            type="button"
            onClick={() => {
              if (!onOpenTeacher) return;
              haptic?.impact?.('light');
              onOpenTeacher(course);
            }}
            className="w-full bg-white flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            style={{
              padding: 12,
              border: '1px solid var(--soft-border)',
              borderRadius: 20,
              boxShadow: '0 4px 12px -8px rgba(15,23,42,0.08)',
            }}
          >
            <img
              src={instructorAvatar(course)}
              alt={course.instructor_name || 'Ustoz'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/ustoz_yaxshi_bola.webp';
              }}
              className="w-11 h-11 object-cover object-top"
              style={{ borderRadius: 14, background: 'rgba(2,132,199,0.05)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-ink-muted tracking-[0.08em] uppercase">
                {t('Ustoz')}
              </div>
              <div className="text-sm font-extrabold text-ink tracking-[-0.01em] mt-0.5 truncate">
                {course.instructor_name || 'Kreativ AI'}
              </div>
              <div className="text-[11px] text-ink-muted font-medium mt-0.5 truncate">
                {course.instructor_title || t('Katta Ekspert')}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Bo'limlar bo'ylab yopishqoq navigatsiya tugmalari */}
      <div
        className="sticky z-20"
        style={{
          top: 62,
          background: 'var(--surface-bar)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--soft-border)',
        }}
      >
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar" style={{ padding: '8px 20px' }}>
          {sections.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className={`flex-shrink-0 text-[12px] font-bold tracking-[-0.005em] transition-all active:scale-95 ${
                  active ? '' : 'text-ink-muted'
                }`}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: active ? 'var(--chip-active-bg)' : 'var(--chip-idle-bg)',
                  color: active ? 'var(--chip-active-text)' : undefined,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kurs haqida */}
      {(course.description || course.short_description) && (
        <div ref={aboutRef} style={{ padding: '12px 20px' }}>
          <SectionInline title={t('Kurs haqida')} />
          <p className="text-[13px] text-ink-secondary leading-[1.65] font-medium tracking-[-0.005em] mt-1.5 whitespace-pre-line">
            {course.description || course.short_description}
          </p>
        </div>
      )}

      {/* Nima olasiz */}
      {showOutcomes && outcomesList.length > 0 && (
        <div style={{ padding: '12px 20px' }}>
          <SectionInline title={t('Nima olasiz')} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {outcomesList.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  padding: '10px 12px',
                  background: 'linear-gradient(135deg, rgba(2,132,199,0.04), rgba(2,132,199,0))',
                  border: '1px solid rgba(2,132,199,0.10)',
                  borderRadius: 14,
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-cyan flex-shrink-0" strokeWidth={2.2} />
                <div className="text-[11px] font-semibold text-ink leading-[1.3] tracking-[-0.005em]">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kursdan lavhalar (galereya) */}
      {galleryList.length > 0 && (
        <div ref={galleryRef} style={{ padding: '12px 20px' }}>
          <SectionInline title={t('Kursdan lavhalar')} right={<span className="text-[11px] text-ink-muted font-semibold">{galleryList.length} {t('ta')}</span>} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {galleryList.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  haptic?.selection?.();
                  setActivePreviewIdx(idx);
                }}
                className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 cursor-pointer group"
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
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Qo'shimcha ma'lumot bloklari */}
      {customInfoList.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          {customInfoList.map((info, idx) => (
            <div
              key={idx}
              className="bg-white mb-2"
              style={{ padding: 14, border: '1px solid var(--soft-border)', borderRadius: 20 }}
            >
              <h4 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan" />
                {info.title}
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-line mt-1.5">
                {info.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* O'quvchilar fikrlari */}
      {testimonialList.length > 0 && (
        <div style={{ padding: '12px 20px' }}>
          <SectionInline
            title={t('O‘quvchilar fikrlari')}
            right={<span className="text-[11px] text-gold font-bold inline-flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> 5.0</span>}
          />
          <div className="mt-2 space-y-2">
            {testimonialList.map((tst, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/20 text-cyan font-bold text-xs flex items-center justify-center">
                      {tst.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-ink block leading-tight">{tst.name}</strong>
                      <span className="text-[10px] text-ink-muted">{tst.role || t('Talaba')}</span>
                    </div>
                  </div>
                  <div className="flex text-gold">
                    {Array.from({ length: tst.rating || 5 }).map((_, s) => (
                      <Star key={s} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed italic">
                  &ldquo;{tst.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dastur (modullar) */}
      {(course.modules?.length ?? 0) > 0 && (
        <div ref={programRef} style={{ padding: '12px 20px' }}>
          <SectionInline
            title={t('Dastur')}
            right={<span className="text-[11px] text-ink-muted font-semibold">{course.modules?.length || 0} {t('modul')} · {totalLessons} {t('dars')}</span>}
          />

          {/* Yopiq kanal haqida eslatma */}
          <div
            className="flex items-start gap-2.5 text-xs text-cyan leading-relaxed mt-2"
            style={{
              padding: '10px 12px',
              background: 'rgba(2,132,199,0.05)',
              border: '1px solid rgba(2,132,199,0.12)',
              borderRadius: 14,
            }}
          >
            <ShieldAlert className="w-4 h-4 text-cyan flex-shrink-0 mt-0.5" />
            <div>
              <b className="font-extrabold block text-ink mb-0.5">{t('Yopiq kanal orqali o‘rganish:')}</b>
              <span className="text-ink-secondary">
                {t("Barcha to‘liq video darslar xavfsiz Telegram yopiq kanalida joylashgan. To‘lov tasdiqlangach, bot sizga bir martalik kirish havolasini yuboradi.")}
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-2.5">
            {course.modules?.map((module, mIdx) => {
              const isOpen = openModuleId === module.id;
              const doneCount = module.lessons.filter((l) => l.completed).length;

              return (
                <div key={module.id} className="bg-white overflow-hidden" style={{ border: '1px solid var(--soft-border)', borderRadius: 20 }}>
                  <button
                    type="button"
                    onClick={() => {
                      haptic?.selection?.();
                      setOpenModuleId(isOpen ? null : module.id);
                    }}
                    className="w-full flex items-center justify-between text-left"
                    style={{ padding: '12px 14px' }}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span
                        className="w-7 h-7 inline-flex items-center justify-center text-[11px] font-extrabold text-cyan flex-shrink-0"
                        style={{ borderRadius: 10, background: 'rgba(2,132,199,0.08)' }}
                      >
                        {String(mIdx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-ink block truncate tracking-[-0.005em]">{module.title}</span>
                        <span className="text-[10.5px] text-ink-muted font-medium">
                          {module.lessons.length} {t('dars')}
                          {course.is_enrolled && doneCount > 0 ? ` · ${doneCount} ${t('yakunlandi')}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 space-y-1.5" style={{ borderTop: '1px solid var(--soft-border)' }}>
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
                                ? 'bg-white border border-slate-200 hover:border-cyan cursor-pointer active:scale-[0.99] shadow-sm'
                                : 'bg-slate-100/60 border border-transparent text-slate-400'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${unlocked ? 'text-cyan' : 'text-slate-400'}`}>
                                {String(lIdx + 1).padStart(2, '0')}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-semibold text-xs block truncate ${unlocked ? 'text-ink' : 'text-slate-500'}`}>
                                  {lesson.title}
                                </span>
                                {lesson.completed && (
                                  <span className="text-[9px] text-emerald-600 font-bold">{t('Yakunlangan ✓')}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-[10px] text-slate-400">{lesson.duration}</span>
                              {lesson.is_preview ? (
                                <span className="text-[9px] font-bold bg-cyan/10 border border-cyan/20 text-cyan px-2 py-0.5 rounded-md flex items-center space-x-1">
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>{t('Ochiq')}</span>
                                </span>
                              ) : course.is_enrolled ? (
                                <Play className="w-3.5 h-3.5 text-cyan fill-current" />
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
      )}

      {/* Ko'p beriladigan savollar */}
      <div ref={faqRef} style={{ padding: '12px 20px 16px' }}>
        <SectionInline title={t('Ko‘p beriladigan savollar')} />
        <div className="space-y-1.5 mt-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={idx} className="bg-white overflow-hidden" style={{ border: '1px solid var(--soft-border)', borderRadius: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    haptic?.selection?.();
                    setOpenFaqIdx(isOpen ? null : idx);
                  }}
                  className="w-full flex items-center justify-between text-left"
                  style={{ padding: '12px 14px' }}
                >
                  <span className="text-[13px] font-bold text-ink pr-2">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="text-xs text-ink-secondary leading-relaxed" style={{ padding: '0 14px 14px', borderTop: '1px solid var(--soft-border)', paddingTop: 10 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky pastki CTA panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'var(--surface-bar)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid var(--soft-border-2)',
        }}
      >
        <div className="max-w-[440px] mx-auto pb-safe" style={{ padding: '10px 12px' }}>
          {channelError && (
            <p className="text-[10px] font-semibold text-red-500 text-center leading-snug animate-fade-in mb-1.5 px-2">
              {channelError}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            <div style={{ paddingLeft: 8 }}>
              {!course.is_enrolled && (hasLiveDiscount || (course.old_price && course.old_price > course.price)) ? (
                <div className="text-[9.5px] text-slate-400 font-bold tracking-[0.06em] uppercase line-through">
                  {formatNumber(hasLiveDiscount ? course.price : (course.old_price as number))} {t("so'm")}
                </div>
              ) : null}
              <div className="text-[17px] font-extrabold text-ink tracking-[-0.02em] leading-none">
                {course.is_enrolled ? (
                  <span className="text-emerald-600">{t('Sizda')}</span>
                ) : (
                  <>
                    {formatNumber(payPrice)}{' '}
                    <span className="text-[10.5px] font-bold text-ink-muted">{t("so'm")}</span>
                  </>
                )}
              </div>
            </div>
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
              className="btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ padding: '13px 16px', fontSize: 13.5, borderRadius: 16 }}
            >
              {course.is_enrolled ? (
                channelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2.4} />
              ) : (
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              )}
              <span>{course.is_enrolled ? t("Kanalga o'tish") : t('Sotib olish')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox — to'liq ekran, sahifa scrolli qulflangan */}
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
            aria-label={t('Yopish')}
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
              aria-label={t('Oldingi surat')}
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
              aria-label={t('Keyingi surat')}
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
