import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  Flame,
  ChevronRight,
  ShieldCheck,
  Award,
  Clock,
  Zap,
  ArrowRight,
  Star,
  Play,
  CheckCircle2,
  Users,
  MessageSquare,
  Cpu,
  Palette,
  Bot,
  BarChart3
} from 'lucide-react';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { haptic } = useTelegram();
  const { user } = useAuth();

  // 3 ta Premium Glassmorphism Bannerlar
  const heroBanners = [
    {
      id: 1,
      tag: "🔥 CHEGIRMA — 50% GACHA",
      title: "Sun'iy Intellekt va Prompt Engineering Pro",
      subtitle: "Gemini 3.7, Claude & AI Agentlar orqali daromadingizni oshiring",
      gradient: "from-emerald-950/95 via-brand-forest/90 to-emerald-900/90",
      accent: "bg-emerald-500",
      instructor: "Yaxshi Bola",
      courseId: "c1111111-1111-1111-1111-111111111111",
      badge: "1 Yil Kirish",
      icon: "🤖"
    },
    {
      id: 2,
      tag: "💎 APPLE DESIGN MASTERCLASS",
      title: "Zamonaviy UI/UX va Mobile App Dizayn",
      subtitle: "Figma, Design Systems va Telegram Mini App interfeyslari",
      gradient: "from-purple-950/95 via-slate-900/90 to-indigo-950/90",
      accent: "bg-purple-500",
      instructor: "Zuhra Olimova",
      courseId: "c2222222-2222-2222-2222-222222222222",
      badge: "Sertifikatli",
      icon: "🎨"
    },
    {
      id: 3,
      tag: "⚡️ FULLSTACK 2026",
      title: "Telegram Bot & Mini App Fullstack Dasturlash",
      subtitle: "FastAPI, React, TypeScript, Click & Payme to'lov tizimlari",
      gradient: "from-blue-950/95 via-slate-900/90 to-cyan-950/90",
      accent: "bg-cyan-500",
      instructor: "Yaxshi Bola",
      courseId: "c3333333-3333-3333-3333-333333333333",
      badge: "Top Sotuv",
      icon: "⚡️"
    }
  ];

  // Avtomatik slayder
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const topCourses = courses.slice(0, 3);

  return (
    <div className="flex-1 pb-36 px-4 pt-3 space-y-6 animate-in fade-in duration-200">
      {/* Top Greeting Glass Header */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-md p-3.5 rounded-3xl border border-white/80 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">
            Premium Ta'lim Platformasi
          </span>
          <h1 className="text-sm font-bold text-brand-dark">
            Assalomu alaykum, {user?.name || 'Do\'stim'} 👋
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-forest text-brand-gold flex items-center justify-center shadow-soft border border-white/40">
          <Sparkles className="w-5 h-5 fill-brand-gold/30" />
        </div>
      </div>

      {/* 1. AUTO-SLIDING HERO BANNER CAROUSEL */}
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[175px] border border-white/20">
          {heroBanners.map((banner, index) => {
            const isActive = currentSlide === index;
            const targetCourse = courses.find((c) => c.id === banner.courseId) || courses[0];

            return (
              <div
                key={banner.id}
                onClick={() => {
                  haptic.impact('light');
                  if (targetCourse) onSelectCourse(targetCourse);
                }}
                className={`absolute inset-0 p-4 sm:p-5 bg-gradient-to-br ${banner.gradient} text-white flex flex-col justify-between cursor-pointer transition-all duration-700 ease-in-out backdrop-blur-xl ${
                  isActive ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-8 pointer-events-none'
                }`}
              >
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold tracking-wider bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 uppercase text-amber-300">
                      {banner.tag}
                    </span>
                    <span className="text-[10px] bg-brand-emerald/90 text-white font-bold px-2 py-0.5 rounded-full">
                      {banner.badge}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-serif leading-snug line-clamp-2 pt-1 text-white">
                    {banner.title}
                  </h3>
                  <p className="text-[11px] text-white/80 line-clamp-1">
                    {banner.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/15 relative z-10">
                  <div className="flex items-center space-x-1.5 text-[11px] text-white/90">
                    <span>Ustoz:</span>
                    <strong className="text-white font-semibold">{banner.instructor}</strong>
                  </div>

                  <div className="inline-flex items-center space-x-1 bg-white text-brand-dark px-3 py-1 rounded-xl text-[10px] font-bold shadow-md hover:bg-brand-gold transition-colors">
                    <span>Batafsil</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Decorative background blurs */}
                <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center space-x-1.5 pt-0.5">
          {heroBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                haptic.selection();
                setCurrentSlide(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === i ? 'w-6 bg-brand-emerald' : 'w-1.5 bg-brand-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. 3D GLASSMORPHISM YO'NALISHLAR (CATEGORIES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center space-x-1.5">
            <span>✨ Asosiy Yo'nalishlar</span>
          </h3>
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="text-[11px] font-bold text-brand-emerald hover:underline flex items-center space-x-0.5"
          >
            <span>Katalog</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* AI 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 backdrop-blur-xl border border-emerald-500/30 rounded-3xl text-left space-y-2 shadow-soft hover:border-emerald-500/60 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">1 Yillik Kirish</span>
              <h4 className="text-xs font-bold text-brand-dark">Sun'iy Intellekt (AI)</h4>
              <p className="text-[10px] text-brand-secondary mt-0.5">Gemini 3.7 & Prompt</p>
            </div>
          </button>

          {/* UI/UX 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-gradient-to-br from-purple-500/15 to-indigo-500/5 backdrop-blur-xl border border-purple-500/30 rounded-3xl text-left space-y-2 shadow-soft hover:border-purple-500/60 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider block">Apple Design</span>
              <h4 className="text-xs font-bold text-brand-dark">UI/UX & Mobile</h4>
              <p className="text-[10px] text-brand-secondary mt-0.5">Figma & Design System</p>
            </div>
          </button>

          {/* Telegram Fullstack 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-gradient-to-br from-blue-500/15 to-cyan-500/5 backdrop-blur-xl border border-blue-500/30 rounded-3xl text-left space-y-2 shadow-soft hover:border-blue-500/60 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">Mini App & Bot</span>
              <h4 className="text-xs font-bold text-brand-dark">Telegram Fullstack</h4>
              <p className="text-[10px] text-brand-secondary mt-0.5">FastAPI + React</p>
            </div>
          </button>

          {/* SMM & Savdo 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-gradient-to-br from-amber-500/15 to-orange-500/5 backdrop-blur-xl border border-amber-500/30 rounded-3xl text-left space-y-2 shadow-soft hover:border-amber-500/60 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">Monetizatsiya</span>
              <h4 className="text-xs font-bold text-brand-dark">High-Ticket SMM</h4>
              <p className="text-[10px] text-brand-secondary mt-0.5">Sotuv Voronkalari</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. FEATURED / TOP COURSES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Haftaning Eng Zo'r Kurslari
            </h3>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="text-[11px] font-bold text-brand-emerald hover:underline"
          >
            Barchasini ko'rish →
          </button>
        </div>

        <div className="space-y-3">
          {topCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
              variant="vertical"
            />
          ))}
        </div>
      </div>

      {/* 4. PLATFORM INSTRUCTORS & FOUNDERS (Generatsiya qilingan rasmlar) */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white/80 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-brand-emerald" />
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Bosh Mentorlar & Mualliflar
            </h3>
          </div>
          <span className="text-[10px] bg-brand-mint text-brand-emerald font-bold px-2 py-0.5 rounded-full">
            VIP Mentorlik
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Ustoz 1: Yaxshi Bola */}
          <div className="p-3 bg-brand-surface rounded-2xl border border-brand-border/60 text-center space-y-2 shadow-xs">
            <div className="relative inline-block">
              <img
                src="/images/yaxshi_bola.jpg"
                alt="Yaxshi Bola"
                className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-brand-emerald shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-emerald rounded-full border border-white flex items-center justify-center text-[9px] text-white">
                ✓
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-dark">Yaxshi Bola</h4>
              <p className="text-[9px] text-brand-secondary">AI Architect & Fullstack</p>
            </div>
            <a
              href="https://t.me/yomonboia"
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 bg-brand-emerald text-white rounded-xl text-[10px] font-bold block hover:bg-brand-deep transition-all"
            >
              @yomonboia
            </a>
          </div>

          {/* Ustoz 2: Zuhra Olimova */}
          <div className="p-3 bg-brand-surface rounded-2xl border border-brand-border/60 text-center space-y-2 shadow-xs">
            <div className="relative inline-block">
              <img
                src="/images/zuhra_olimova.jpg"
                alt="Zuhra Olimova"
                className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-brand-gold shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-gold rounded-full border border-white flex items-center justify-center text-[9px] text-white">
                ✓
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-dark">Zuhra Olimova</h4>
              <p className="text-[9px] text-brand-secondary">Lead Designer & Growth</p>
            </div>
            <a
              href="https://t.me/sokin_notalar"
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 bg-brand-forest text-brand-gold rounded-xl text-[10px] font-bold block hover:opacity-90 transition-all"
            >
              @sokin_notalar
            </a>
          </div>
        </div>
      </div>

      {/* 5. WHY CHOOSE US (Afzalliklar) */}
      <div className="bg-gradient-to-br from-brand-forest via-brand-emerald to-emerald-950 text-white rounded-3xl p-5 shadow-elevated space-y-3 relative overflow-hidden border border-white/20">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">
            Kafolatlangan Ta'lim
          </span>
          <h3 className="text-sm font-bold font-serif">Nega aynan bizning platforma?</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
            <Clock className="w-4 h-4 text-brand-gold" />
            <strong className="text-[11px] block text-white">1 Yillik Kirish</strong>
            <p className="text-[9px] text-white/75">365 kun davomida barcha darslar ochiq.</p>
          </div>

          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <strong className="text-[11px] block text-white">Anti-Leak Himoya</strong>
            <p className="text-[9px] text-white/75">Har bir darsda shaxsiy Watermark.</p>
          </div>

          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
            <Award className="w-4 h-4 text-amber-300" />
            <strong className="text-[11px] block text-white">QR Sertifikat</strong>
            <p className="text-[9px] text-white/75">Rasmiy tekshiriladigan diplom.</p>
          </div>

          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
            <Zap className="w-4 h-4 text-yellow-300" />
            <strong className="text-[11px] block text-white">24/7 Qo'llab-quvvatlash</strong>
            <p className="text-[9px] text-white/75">Ustozlar bilan to'g'ridan-to'g'ri aloqa.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
