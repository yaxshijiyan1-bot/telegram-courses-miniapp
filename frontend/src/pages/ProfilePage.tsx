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
    <div className="flex-1 pb-24 px-4 pt-3 space-y-4 text-white animate-fade-up">

      {/* 1. TOP USER IDENTITY */}
      <div className="flex flex-col items-center text-center space-y-2 pt-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-cyan via-cyan/30 to-transparent shadow-cyanGlowSm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-[#05070A]"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#0D1117] border-2 border-[#05070A] flex items-center justify-center text-xl font-black text-cyan">
                {(user?.name || 'T')[0]}
              </div>
            )}
          </div>
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-cyan border-2 border-[#05070A] rounded-full shadow-cyanGlowSm" />
        </div>

        <div>
          <h2 className="text-base font-bold tracking-tight text-white">
            {user?.name || 'Talaba'}
          </h2>
          <p className="text-xs text-slate-400">
            {user?.username ? `@${user.username}` : 'Premium Talaba'}
            {isSuperadmin && (
              <span className="ml-1.5 text-[9px] bg-cyan/15 text-cyan font-bold px-2 py-0.5 rounded-full align-middle border border-cyan/30">
                SUPERADMIN
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 2. REAL STATS GRID */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="glass-panel p-3 rounded-2xl border border-white/[0.06] text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-cyan">
            <Sparkles className="w-3.5 h-3.5 stroke-cyan" />
            <span className="text-xs font-black">{overallProgress}%</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Natija</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-white/[0.06] text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-cyan">
            <BookOpen className="w-3.5 h-3.5 stroke-cyan" />
            <span className="text-xs font-black">{enrolledCourses.length}</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Kurslarim</span>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-white/[0.06] text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-cyan">
            <GraduationCap className="w-3.5 h-3.5 stroke-cyan" />
            <span className="text-xs font-black">{certificates.length}</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Sertifikat</span>
        </div>
      </div>

      {/* 3. COURSES PROGRESS PREVIEW */}
      {enrolledCourses.length > 0 ? (
        <div className="glass-panel p-4 rounded-3xl border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan" />
              <span>Kurslarim Progressi</span>
            </span>
            <span className="text-[10px] font-bold text-cyan">
              {completedLessons}/{totalLessons} dars
            </span>
          </div>

          <div className="space-y-2.5">
            {enrolledCourses.slice(0, 3).map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white truncate pr-2">{c.title}</span>
                  <span className="text-cyan font-black flex-shrink-0">{c.progress_percent}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan rounded-full animate-progress shadow-cyanGlowSm"
                    style={{ width: `${c.progress_percent}%` }}
                  />
                </div>
              </div>
            ))}
            {enrolledCourses.length > 3 && (
              <button
                onClick={() => { haptic.selection(); onNavigateToCourses(); }}
                className="w-full text-[10px] text-slate-400 hover:text-cyan py-1"
              >
                +{enrolledCourses.length - 3} ta kurs ko‘rish →
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => { haptic.impact('light'); onNavigateToCourses(); }}
          className="w-full p-4 glass-panel rounded-3xl border border-dashed border-cyan/30 flex items-center justify-between text-left active:scale-[0.98] transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
              Birinchi kursingizni boshlang
            </span>
            <p className="text-[11px] text-slate-400">1 yillik kirish + Rasmiy sertifikat bilan</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan text-black flex items-center justify-center flex-shrink-0 shadow-cyanGlowSm">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* 4. ACTIONS & SETTINGS LIST */}
      <div className="glass-panel rounded-3xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06] shadow-soft">
        
        {/* Superadmin Panel */}
        {isSuperadmin && (
          <button
            onClick={() => {
              haptic.impact('medium');
              setActiveModal('admin');
            }}
            className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan/15 border border-cyan/30 text-cyan flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Superadmin Panel</h4>
                <p className="text-[10px] text-slate-400">Cheklar, statistika, kurslar va talabalar</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        )}

        {/* Certificates */}
        <button
          onClick={() => {
            haptic.impact('light');
            setActiveModal('certificates');
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-cyan flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Mening Sertifikatlarim</h4>
              <p className="text-[10px] text-slate-400">
                {certificates.length > 0 ? `${certificates.length} ta sertifikat mavjud` : 'Kurslarni yakunlang va sertifikat oling'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Notifications */}
        <button
          onClick={openNotifications}
          className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-cyan flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Xabarnomalar</h4>
              <p className="text-[10px] text-slate-400">Yangi darslar va xarid yangiliklari</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan shadow-cyanGlowSm" />
            )}
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </button>

        {/* Admin bilan bog'lanish */}
        <div className="p-3.5 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Admin bilan bog'lanish:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://t.me/sokin_notalar"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.impact('light')}
              className="p-2.5 rounded-xl bg-[#0D1117] border border-white/[0.08] hover:border-cyan/40 flex items-center space-x-2 text-xs transition-colors"
            >
              <img src="/images/zuhra_olimova.jpg" alt="Zuhra" className="w-6 h-6 rounded-full object-cover" />
              <div className="min-w-0">
                <span className="font-bold text-white block text-[11px] truncate">Qizlar uchun</span>
                <span className="text-[9px] text-cyan">@sokin_notalar</span>
              </div>
            </a>

            <a
              href="https://t.me/yomonboia"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.impact('light')}
              className="p-2.5 rounded-xl bg-[#0D1117] border border-white/[0.08] hover:border-cyan/40 flex items-center space-x-2 text-xs transition-colors"
            >
              <img src="/images/yaxshi_bola.jpg" alt="Yaxshi Bola" className="w-6 h-6 rounded-full object-cover" />
              <div className="min-w-0">
                <span className="font-bold text-white block text-[11px] truncate">Yigitlar uchun</span>
                <span className="text-[9px] text-cyan">@yomonboia</span>
              </div>
            </a>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full p-3.5 flex items-center justify-between hover:bg-red-500/10 transition-colors text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-400">Hisobdan chiqish</h4>
              <p className="text-[10px] text-slate-500">Sessiyani yakunlash</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
        </button>

      </div>

      {/* MODAL: Certificates */}
      {activeModal === 'certificates' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0D1117] rounded-t-3xl sm:rounded-3xl p-5 border border-white/[0.08] max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-cyan" />
                <h3 className="text-sm font-bold text-white">Sertifikatlarim</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Award className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Hozircha faol sertifikatlaringiz yo‘q</p>
                <p className="text-[10px] text-slate-500">
                  Kurs darslarini 100% yakunlaganingizdan so‘ng QR sertifikat avtomatik beriladi.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 bg-[#11161D] rounded-2xl border border-white/[0.08] space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">{cert.course_title}</h4>
                        <span className="text-[10px] text-cyan font-mono">
                          ID: {cert.certificate_code}
                        </span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-cyan" />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/[0.06]">
                      <span>Berilgan sana: {cert.issued_at?.slice(0, 10) || '2026-08-16'}</span>
                      {cert.certificate_url && (
                        <a
                          href={cert.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan font-bold flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Yuklab olish</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Notifications */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0D1117] rounded-t-3xl sm:rounded-3xl p-5 border border-white/[0.08] max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-cyan" />
                <h3 className="text-sm font-bold text-white">Xabarnomalar</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Yangi xabarnomalar mavjud emas</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-[#11161D] rounded-2xl border border-white/[0.06] space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <span className="text-[9px] text-slate-500">
                        {n.created_at?.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Superadmin Dashboard */}
      {activeModal === 'admin' && isSuperadmin && (
        <AdminDashboardModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          adminName={user?.name || 'Superadmin'}
        />
      )}

    </div>
  );
};
