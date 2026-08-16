import React, { useState } from 'react';
import {
  Award,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  MessageCircle,
  Trophy,
  Layers,
  ArrowRight,
  Flame,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';
import { Certificate, NotificationItem, EnrolledCourse } from '../types';
import { AdminDashboardModal } from './AdminDashboardModal';

interface ProfilePageProps {
  certificates: Certificate[];
  notifications: NotificationItem[];
  dashboardData?: {
    overall_progress_percent: number;
    completed_lessons_count: number;
    total_lessons_count: number;
    enrolled_courses?: EnrolledCourse[];
  } | null;
  onNotificationsRead?: () => void;
  onNavigateToCourses: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  certificates,
  notifications,
  dashboardData,
  onNotificationsRead,
  onNavigateToCourses
}) => {
  const { user, logout } = useAuth();
  const { haptic, user: tgUser } = useTelegram();
  const [activeModal, setActiveModal] = useState<'certificates' | 'notifications' | 'admin' | null>(null);

  const handleLogout = () => {
    haptic.impact('medium');
    logout();
  };

  const isSuperadmin = user?.role === 'superadmin';

  // Real ko'rsatkichlar
  const overallProgress = dashboardData?.overall_progress_percent ?? 0;
  const enrolledCourses = dashboardData?.enrolled_courses ?? [];
  const completedLessons = dashboardData?.completed_lessons_count ?? 0;
  const totalLessons = dashboardData?.total_lessons_count ?? 0;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Avatar: Telegram rasmi > adminlar uchun rasmi > bosh harflar
  const isZuhra = user?.telegram_id === 8112688757 || user?.username === 'sokin_notalar';
  const isYaxshi = user?.telegram_id === 8544023815 || user?.username === 'yomonboia';
  const avatarUrl: string | null =
    tgUser?.photo_url ||
    (isZuhra ? '/images/zuhra_olimova.jpg' : isYaxshi ? '/images/yaxshi_bola.jpg' : null);

  const openNotifications = () => {
    haptic.impact('light');
    setActiveModal('notifications');
    onNotificationsRead?.();
  };

  return (
    <div className="flex-1 pb-36 px-4 pt-3 space-y-4 text-white animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* 1. TOP USER IDENTITY — Telegram avatari bilan */}
      <div className="flex flex-col items-center text-center space-y-2 pt-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-[#B4F523] via-[#B4F523]/40 to-transparent">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-[#09090C] shadow-elevated"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#1B1B22] border-2 border-[#09090C] flex items-center justify-center text-xl font-black text-[#B4F523]">
                {(user?.name || 'T')[0]}
              </div>
            )}
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#B4F523] border-2 border-[#09090C] rounded-full" />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {user?.name || 'Talaba'}
          </h2>
          <p className="text-xs text-zinc-400">
            {user?.username ? `@${user.username}` : 'Premium Talaba'}
            {isSuperadmin && (
              <span className="ml-1.5 text-[9px] bg-[#B4F523]/15 text-[#B4F523] font-bold px-1.5 py-0.5 rounded-full align-middle">
                SUPERADMIN
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 2. REAL METRIKALAR */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="bg-[#131318] p-3 rounded-2xl border border-white/5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-[#B4F523]">
            <Flame className="w-3.5 h-3.5 fill-[#B4F523]" />
            <span className="text-xs font-black">{overallProgress}%</span>
          </div>
          <span className="text-[10px] text-zinc-400 block font-medium">Natija</span>
        </div>

        <div className="bg-[#131318] p-3 rounded-2xl border border-white/5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-[#B4F523]">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-xs font-black">{enrolledCourses.length}</span>
          </div>
          <span className="text-[10px] text-zinc-400 block font-medium">Kurslarim</span>
        </div>

        <div className="bg-[#131318] p-3 rounded-2xl border border-white/5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-[#B4F523]">
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="text-xs font-black">{certificates.length}</span>
          </div>
          <span className="text-[10px] text-zinc-400 block font-medium">Sertifikat</span>
        </div>
      </div>

      {/* 3. MENING KURSLARIM — real progress (ixcham ro'yxat) */}
      {enrolledCourses.length > 0 ? (
        <div className="bg-[#131318] p-3.5 rounded-3xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#B4F523]" />
              <span>Kurslarim Progressi</span>
            </span>
            <span className="text-[10px] font-bold text-[#B4F523]">
              {completedLessons}/{totalLessons} dars
            </span>
          </div>

          <div className="space-y-2.5">
            {enrolledCourses.slice(0, 3).map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white truncate pr-2">{c.title}</span>
                  <span className="text-[#B4F523] font-black flex-shrink-0">{c.progress_percent}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8BC34A] to-[#B4F523] rounded-full transition-all duration-700 progress-fill"
                    style={{ width: `${c.progress_percent}%` }}
                  />
                </div>
              </div>
            ))}
            {enrolledCourses.length > 3 && (
              <button
                onClick={() => { haptic.selection(); onNavigateToCourses(); }}
                className="w-full text-[10px] text-zinc-400 hover:text-[#B4F523] py-1"
              >
                +{enrolledCourses.length - 3} ta kurs ko'rish →
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => { haptic.impact('light'); onNavigateToCourses(); }}
          className="w-full p-4 bg-[#131318] rounded-3xl border border-dashed border-[#B4F523]/25 flex items-center justify-between text-left active:scale-[0.98] transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#B4F523] uppercase tracking-wider block">
              Birinchi kursingizni boshlang
            </span>
            <p className="text-[11px] text-zinc-400">1 yillik kirish + QR sertifikat bilan</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#B4F523] text-black flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-5 h-5" />
          </div>
        </button>
      )}

      {/* 4. YUTUQLAR (kurslar bo'lsa) */}
      {enrolledCourses.length > 0 && (
        <div className="bg-[#131318] p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-soft">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#B4F523] uppercase tracking-wider block">
              O'quv Yutuqlari
            </span>
            <h4 className="text-sm font-bold text-white">
              {completedLessons} ta dars muvaffaqiyatli yakunlandi!
            </h4>
            <p className="text-xs text-zinc-400">
              {overallProgress >= 100 ? 'Sertifikatlar tayyor! 🎓' : 'Davom eting — a\'lo natijaga yaqinsiz'}
            </p>
          </div>

          <div className={`w-14 h-14 rounded-2xl bg-[#1B1B22] border flex items-center justify-center flex-shrink-0 ${overallProgress >= 100 ? 'border-[#B4F523] shadow-neonSm text-[#B4F523]' : 'border-white/10 text-zinc-500'}`}>
            <Trophy className="w-7 h-7" />
          </div>
        </div>
      )}

      {/* 5. KATTA GORIZONTAL KARTOCKA */}
      <button
        onClick={() => {
          haptic.impact('light');
          onNavigateToCourses();
        }}
        className="w-full p-4 bg-[#131318] rounded-3xl border border-white/5 flex items-center justify-between text-left hover:border-[#B4F523]/40 active:scale-[0.98] transition-all shadow-soft group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#1B1B22] border border-[#B4F523]/30 text-[#B4F523] flex items-center justify-center flex-shrink-0 shadow-neonSm group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white group-hover:text-[#B4F523] transition-colors">
              Yangi amaliy darslarni boshlash
            </h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
              Katalogdagi eng so'nggi kurslar va masterclasslar
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#B4F523] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>

      {/* 6. SOZLAMALAR RO'YXATI */}
      <div className="bg-[#131318] rounded-3xl border border-white/5 overflow-hidden divide-y divide-white/5 shadow-soft">
        {/* Superadmin Panel */}
        {isSuperadmin && (
          <button
            onClick={() => {
              haptic.impact('medium');
              setActiveModal('admin');
            }}
            className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#B4F523]/15 text-[#B4F523] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">👑 Superadmin Panel</span>
                <span className="text-[10px] text-[#B4F523]">Kurslar, Cheklar & Baza</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        )}

        {/* Sertifikatlar */}
        <button
          onClick={() => {
            haptic.impact('light');
            setActiveModal('certificates');
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Mening Sertifikatlarim</span>
              <span className="text-[10px] text-zinc-400">{certificates.length} ta rasmiy sertifikat</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Bildirishnomalar */}
        <button
          onClick={openNotifications}
          className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 bg-[#B4F523] text-black rounded-full flex items-center justify-center text-[8px] font-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Bildirishnomalar</span>
              <span className="text-[10px] text-zinc-400">
                {notifications.length > 0 ? `${unreadCount} ta o'qilmagan • ${notifications.length} ta xabar` : 'Hozircha xabar yo\'q'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Chiqish */}
        <button
          onClick={handleLogout}
          className="w-full p-3.5 flex items-center justify-between hover:bg-red-500/10 transition-colors text-left text-red-400"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Hisobdan chiqish</span>
          </div>
        </button>
      </div>

      {/* 7. ADMIN BILAN BOG'LANISH */}
      <div className="bg-[#131318] rounded-3xl p-4 border border-white/5 space-y-3 shadow-soft">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-[#B4F523]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Admin bilan bog'lanish
          </h3>
        </div>

        <div className="space-y-2">
          <a
            href="https://t.me/yomonboia"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-[#181820] hover:border-[#B4F523]/40 rounded-2xl border border-white/5 flex items-center justify-between transition-all"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#B4F523]/15 text-[#B4F523] flex items-center justify-center font-bold text-xs">
                👨‍💼
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#B4F523] uppercase block">Yigitlar uchun</span>
                <h4 className="text-xs font-bold text-white">Yaxshi Bola (@yomonboia)</h4>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#B4F523] text-black rounded-xl text-[10px] font-bold">
              Yozish ↗
            </span>
          </a>

          <a
            href="https://t.me/sokin_notalar"
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-[#181820] hover:border-[#B4F523]/40 rounded-2xl border border-white/5 flex items-center justify-between transition-all"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#B4F523]/15 text-[#B4F523] flex items-center justify-center font-bold text-xs">
                👩‍💼
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#B4F523] uppercase block">Qizlar uchun</span>
                <h4 className="text-xs font-bold text-white">Zuhra Olimova (@sokin_notalar)</h4>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#B4F523] text-black rounded-xl text-[10px] font-bold">
              Yozish ↗
            </span>
          </a>
        </div>
      </div>

      {/* ADMIN DASHBOARD MODAL */}
      <AdminDashboardModal
        isOpen={activeModal === 'admin'}
        onClose={() => setActiveModal(null)}
        adminName={user?.name || 'Yaxshi Bola'}
      />

      {/* SERTIFIKATLAR MODAL */}
      {activeModal === 'certificates' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-md bg-[#131318] text-white rounded-3xl p-5 border border-white/10 space-y-4 animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold">Sertifikatlarim</h3>
              <button onClick={() => setActiveModal(null)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {certificates.length > 0 ? (
                certificates.map((cert) => (
                  <div key={cert.id} className="p-3 bg-[#181820] rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold">{cert.course_title}</h4>
                      <span className="text-[10px] text-[#B4F523]">{cert.certificate_code}</span>
                    </div>
                    {cert.certificate_url && (
                      <a href={cert.certificate_url} target="_blank" rel="noreferrer" className="p-2 bg-[#B4F523] text-black rounded-xl">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4">Kursni to'liq bitiring va QR sertifikat oling!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BILDIRISHNOMALAR MODAL (ixcham) */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-md bg-[#131318] text-white rounded-3xl p-5 border border-white/10 space-y-4 animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold">Bildirishnomalar</h3>
              <button onClick={() => setActiveModal(null)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6 leading-relaxed">
                  Hozircha bildirishnomalar yo'q.
                  <br />Kurs tasdiqlanishi va sertifikatlar shu yerda ko'rinadi.
                </p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3 rounded-2xl border space-y-1 ${n.is_read ? 'bg-[#181820] border-white/5' : 'bg-[#B4F523]/8 border-[#B4F523]/20'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white leading-snug">{n.title}</h4>
                      <span className="text-[9px] text-zinc-500 flex-shrink-0 mt-0.5">{n.created_at}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
