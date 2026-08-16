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
  Users,
  Cpu,
  Palette,
  Bot,
  BarChart3,
  CheckCircle2
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
  const { haptic } = useTelegram();
  const { user } = useAuth();

  // 3 ta Dark Neon Slayder Bannerlar
  const heroBanners = [
    {
      id: 1,
      tag: "🔥 CHEGIRMA — 50% GACHA",
      title: "Sun'iy Intellekt va Prompt Engineering Pro",
      subtitle: "Gemini 3.7, Claude & AI Agentlar orqali daromadingizni oshiring",
      gradient: "from-[#1B2810] via-[#131318] to-[#0D1808]",
      border: "border-[#B4F523]/30",
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
      gradient: "from-[#1F1528] via-[#131318] to-[#140D1F]",
      border: "border-purple-500/30",
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
      gradient: "from-[#0F1E28] via-[#131318] to-[#0A161F]",
      border: "border-cyan-500/30",
      instructor: "Yaxshi Bola",
      courseId: "c3333333-3333-3333-3333-333333333333",
      badge: "Top Sotuv",
      icon: "⚡️"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const topCourses = courses.slice(0, 3);

  return (
    <div className="flex-1 pb-36 px-4 pt-3 space-y-5 text-white animate-in fade-in duration-200">
      
      {/* 1. TOP GREETING GLASS HEADER */}
      <div className="flex items-center justify-between bg-[#131318] p-3.5 rounded-3xl border border-white/5 shadow-soft">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1B1B22] border border-[#B4F523]/30 text-[#B4F523] flex items-center justify-center shadow-neonSm">
            <Sparkles className="w-5 h-5 fill-[#B4F523]/20" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#B4F523] uppercase tracking-wider block">
              PREMIUM TA'LIM
            </span>
            <h1 className="text-sm font-bold text-white leading-tight">
              Salom, {user?.name ? user.name.split(' ')[0] : "O'quvchi"} 👋
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            haptic.impact('light');
            onNavigateToCourses();
          }}
          className="px-3 py-1.5 bg-[#B4F523] text-black text-[11px] font-bold rounded-xl active:scale-95 transition-transform"
        >
          Katalog →
        </button>
      </div>

      {/* 2. AUTO-SLIDING HERO BANNER CAROUSEL */}
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-3xl min-h-[175px] border border-white/10 shadow-elevated">
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
                className={`absolute inset-0 p-4 sm:p-5 bg-gradient-to-br ${banner.gradient} text-white flex flex-col justify-between cursor-pointer transition-all duration-700 ease-in-out border ${banner.border} ${
                  isActive ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-8 pointer-events-none'
                }`}
              >
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 uppercase text-[#B4F523]">
                      {banner.tag}
                    </span>
                    <span className="text-[10px] bg-[#B4F523] text-black font-bold px-2 py-0.5 rounded-full">
                      {banner.badge}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 pt-1 text-white">
                    {banner.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">
                    {banner.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10">
                  <div className="flex items-center space-x-1.5 text-[11px] text-zinc-300">
                    <span>Ustoz:</span>
                    <strong className="text-white font-semibold">{banner.instructor}</strong>
                  </div>

                  <div className="inline-flex items-center space-x-1 bg-white text-black px-3 py-1 rounded-xl text-[10px] font-bold shadow-md hover:bg-[#B4F523] transition-colors">
                    <span>Batafsil</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
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
                currentSlide === i ? 'w-6 bg-[#B4F523]' : 'w-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3. 3D YO'NALISHLAR (CATEGORIES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
            <span>✨ Asosiy Yo'nalishlar</span>
          </h3>
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="text-[11px] font-bold text-[#B4F523] hover:underline flex items-center space-x-0.5"
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
            className="p-3 bg-[#131318] border border-white/5 rounded-3xl text-left space-y-2 shadow-soft hover:border-[#B4F523]/40 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1B1B22] border border-[#B4F523]/30 text-[#B4F523] flex items-center justify-center shadow-neonSm group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#B4F523] uppercase tracking-wider block">1 Yillik Kirish</span>
              <h4 className="text-xs font-bold text-white">Sun'iy Intellekt (AI)</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Gemini 3.7 & Prompt</p>
            </div>
          </button>

          {/* UI/UX 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-[#131318] border border-white/5 rounded-3xl text-left space-y-2 shadow-soft hover:border-purple-500/40 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1B1B22] border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">Apple Design</span>
              <h4 className="text-xs font-bold text-white">UI/UX & Mobile</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Figma & Design System</p>
            </div>
          </button>

          {/* Telegram Fullstack 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-[#131318] border border-white/5 rounded-3xl text-left space-y-2 shadow-soft hover:border-cyan-500/40 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1B1B22] border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">Mini App & Bot</span>
              <h4 className="text-xs font-bold text-white">Telegram Fullstack</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">FastAPI + React</p>
            </div>
          </button>

          {/* SMM & Savdo 3D Card */}
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="p-3 bg-[#131318] border border-white/5 rounded-3xl text-left space-y-2 shadow-soft hover:border-amber-500/40 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1B1B22] border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Monetizatsiya</span>
              <h4 className="text-xs font-bold text-white">High-Ticket SMM</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Sotuv Voronkalari</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. FEATURED / TOP COURSES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-[#B4F523] fill-[#B4F523]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Haftaning Eng Sara Kurslari
            </h3>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onNavigateToCourses();
            }}
            className="text-[11px] font-bold text-[#B4F523] hover:underline"
          >
            Barchasi →
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

      {/* 5. PLATFORM INSTRUCTORS & FOUNDERS */}
      <div className="bg-[#131318] rounded-3xl p-4 border border-white/5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#B4F523]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Bosh Mentorlar & Mualliflar
            </h3>
          </div>
          <span className="text-[10px] bg-[#B4F523]/15 text-[#B4F523] font-bold px-2 py-0.5 rounded-full">
            VIP Mentorlik
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Ustoz 1: Yaxshi Bola */}
          <div className="p-3 bg-[#181820] rounded-2xl border border-white/5 text-center space-y-2">
            <div className="relative inline-block">
              <img
                src="/images/yaxshi_bola.jpg"
                alt="Yaxshi Bola"
                className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-[#B4F523] shadow-neonSm"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#B4F523] rounded-full border border-[#09090C] flex items-center justify-center text-[9px] text-black font-bold">
                ✓
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Yaxshi Bola</h4>
              <p className="text-[9px] text-zinc-400">AI Architect & Fullstack</p>
            </div>
            <a
              href="https://t.me/yomonboia"
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 bg-[#B4F523] text-black rounded-xl text-[10px] font-bold block hover:opacity-90 transition-all"
            >
              @yomonboia
            </a>
          </div>

          {/* Ustoz 2: Zuhra Olimova */}
          <div className="p-3 bg-[#181820] rounded-2xl border border-white/5 text-center space-y-2">
            <div className="relative inline-block">
              <img
                src="/images/zuhra_olimova.jpg"
                alt="Zuhra Olimova"
                className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-[#B4F523] shadow-neonSm"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#B4F523] rounded-full border border-[#09090C] flex items-center justify-center text-[9px] text-black font-bold">
                ✓
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Zuhra Olimova</h4>
              <p className="text-[9px] text-zinc-400">Lead Designer & Growth</p>
            </div>
            <a
              href="https://t.me/sokin_notalar"
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 bg-[#B4F523] text-black rounded-xl text-[10px] font-bold block hover:opacity-90 transition-all"
            >
              @sokin_notalar
            </a>
          </div>
        </div>
      </div>

      {/* 6. WHY CHOOSE US */}
      <div className="bg-[#131318] text-white rounded-3xl p-5 shadow-elevated space-y-3 relative overflow-hidden border border-white/5">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-[#B4F523] uppercase tracking-widest">
            Kafolatlangan Ta'lim
          </span>
          <h3 className="text-sm font-bold">Nega aynan bizning platforma?</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 bg-[#181820] rounded-2xl border border-white/5 space-y-1">
            <Clock className="w-4 h-4 text-[#B4F523]" />
            <strong className="text-[11px] block text-white">1 Yillik Kirish</strong>
            <p className="text-[9px] text-zinc-400">365 kun darslar ochiq.</p>
          </div>

          <div className="p-2.5 bg-[#181820] rounded-2xl border border-white/5 space-y-1">
            <ShieldCheck className="w-4 h-4 text-[#B4F523]" />
            <strong className="text-[11px] block text-white">Anti-Leak Himoya</strong>
            <p className="text-[9px] text-zinc-400">Shaxsiy Watermark.</p>
          </div>

          <div className="p-2.5 bg-[#181820] rounded-2xl border border-white/5 space-y-1">
            <Award className="w-4 h-4 text-[#B4F523]" />
            <strong className="text-[11px] block text-white">QR Sertifikat</strong>
            <p className="text-[9px] text-zinc-400">Rasmiy tekshiriladigan.</p>
          </div>

          <div className="p-2.5 bg-[#181820] rounded-2xl border border-white/5 space-y-1">
            <Zap className="w-4 h-4 text-[#B4F523]" />
            <strong className="text-[11px] block text-white">24/7 Aloqa</strong>
            <p className="text-[9px] text-zinc-400">Ustozlar bilan bog'lanish.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
