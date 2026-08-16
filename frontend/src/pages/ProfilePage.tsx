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
  Users,
  Flame,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';
import { Certificate, NotificationItem } from '../types';
import { AdminDashboardModal } from './AdminDashboardModal';

interface ProfilePageProps {
  certificates: Certificate[];
  notifications: NotificationItem[];
  onNavigateToCourses: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  certificates,
  notifications,
  onNavigateToCourses
}) => {
  const { user, logout } = useAuth();
  const { haptic } = useTelegram();
  const [activeModal, setActiveModal] = useState<'certificates' | 'notifications' | 'admin' | null>(null);

  const handleLogout = () => {
    haptic.impact('medium');
    logout();
  };

  const isSuperadmin = user?.role === 'superadmin' || 
                       user?.username === 'yomonboia' || 
                       user?.username === 'sokin_notalar' || 
                       user?.telegram_id === 8544023815 || 
                       user?.telegram_id === 8112688757;

  // Haftalik kunlar (Rasmdagi kabi streak)
  const weekDays = [
    { day: 'Mon', date: 19, active: true },
    { day: 'Tue', date: 20, active: true },
    { day: 'Wen', date: 21, active: true },
    { day: 'Thu', date: 22, current: true, active: true },
    { day: 'Fri', date: 23, active: false },
    { day: 'Sat', date: 24, active: false },
    { day: 'Sun', date: 25, active: false },
  ];

  return (
    <div className="flex-1 pb-36 px-4 pt-3 space-y-4 text-white animate-in fade-in duration-200">
      
      {/* 1. TOP USER IDENTITY (Rasmdagi kabi doiraviy neon avatar va ism) */}
      <div className="flex flex-col items-center text-center space-y-2 pt-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full p-1 border-2 border-dashed border-[#B4F523] flex items-center justify-center">
            <img
              src="/images/yaxshi_bola.jpg"
              alt="Avatar"
              className="w-full h-full rounded-full object-cover shadow-elevated"
            />
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#B4F523] border-2 border-[#09090C] rounded-full" />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {user?.name || 'Yaxshi Bola'}
          </h2>
          <p className="text-xs text-zinc-400">@{user?.username || 'yomonboia'}</p>
        </div>
      </div>

      {/* 2. 3 TA METRIKA (Rasmdagi 70% Win/Lose, 8 Level, 76 Days kabi) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Progress % */}
        <div className="bg-[#131318] p-3 rounded-2xl border border-white/5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-[#B4F523]">
            <Flame className="w-3.5 h-3.5 fill-[#B4F523]" />
            <span className="text-xs font-black">78%</span>
          </div>
          <span className="text-[10px] text-zinc-400 block font-medium">Natija</span>
        </div>

        {/* Level */}
        <div className="bg-[#131318] p-3 rounded-2xl border border-white/5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-[#B4F523]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-black">8 Lvl</span>
          </div>
          <span className="text-[10px] text-zinc-400 block font-medium">Daraja</span>
        </div>

        {/* Days */}
        <div className="bg-[#131318] p-3 rounded-2xl border border-white/5 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1 text-[#B4F523]">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-black">35 Kun</span>
          </div>
          <span className="text-[10px] text-zinc-400 block font-medium">Davomiylik</span>
        </div>
      </div>

      {/* 3. HAFTALIK KALENDAR STREAK (Rasmdagi Mon 19, Thu 22 kartochkalari) */}
      <div className="bg-[#131318] p-3.5 rounded-3xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Haftalik Faollik
          </span>
          <span className="text-[10px] font-bold text-[#B4F523]">
            4/7 kun bajarildi
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {weekDays.map((item, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-center transition-all ${
                item.current
                  ? 'bg-[#1B1B22] border-1.5 border-[#B4F523] shadow-neonSm'
                  : 'bg-[#181820]/60 border border-white/5'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mb-1 ${item.active ? 'bg-[#B4F523]' : 'bg-zinc-600'}`} />
              <span className="text-[10px] text-zinc-400 font-medium">{item.day}</span>
              <span className={`text-xs font-bold mt-0.5 ${item.current ? 'text-[#B4F523]' : 'text-white'}`}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 2 TA IXCHAM BLOK (Friends & Keep it up Trophy) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Friends / Kursdoshlar */}
        <div className="bg-[#131318] p-3.5 rounded-3xl border border-white/5 flex flex-col justify-between space-y-3">
          <div className="flex -space-x-2 overflow-hidden pt-1">
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#131318] object-cover" src="/images/yaxshi_bola.jpg" alt="" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#131318] object-cover" src="/images/zuhra_olimova.jpg" alt="" />
            <div className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-[#131318] bg-zinc-800 text-[10px] font-bold text-[#B4F523]">
              +12
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Kursdoshlar</h4>
            <span className="text-[10px] text-[#B4F523] font-semibold flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-[#B4F523] rounded-full animate-ping" />
              <span>14 nafar onlayn</span>
            </span>
          </div>
        </div>

        {/* Keep it up! 3D Trophy */}
        <div className="bg-[#131318] p-3.5 rounded-3xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <h4 className="text-xs font-bold text-white">Yutuqlar</h4>
            <p className="text-[10px] text-zinc-400">35 kun ketma-ket darsda!</p>
            {/* 5 ta progress nuqtalari */}
            <div className="flex items-center space-x-1 pt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4F523]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4F523]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4F523]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4F523]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#1B1B22] text-[#B4F523] flex items-center justify-center self-end shadow-soft mt-1">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 5. KATTA GORIZONTAL KARTOCKA (Rasmdagi Complete new tasks kabi) */}
      <button
        onClick={() => {
          haptic.impact('light');
          onNavigateToCourses();
        }}
        className="w-full p-4 bg-gradient-to-r from-[#181820] to-[#131318] rounded-3xl border border-white/10 flex items-center justify-between text-left hover:border-[#B4F523]/40 active:scale-[0.98] transition-all shadow-soft group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#B4F523]/15 border border-[#B4F523]/30 text-[#B4F523] flex items-center justify-center flex-shrink-0 shadow-neonSm group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white group-hover:text-[#B4F523] transition-colors">
              Yangi amaliy darslarni boshlash
            </h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
              Vazifalarni topshiring va +250 XP bonus oling
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#B4F523] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>

      {/* 6. ADMIN DASHBOARD & SOZLAMALAR RO'YXATI */}
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
          onClick={() => {
            haptic.impact('light');
            setActiveModal('notifications');
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Xabarnomalar</span>
              <span className="text-[10px] text-zinc-400">{notifications.length} ta xabar</span>
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

      {/* 7. ADMIN BILAN BOG'LANISH (Yigitlar / Qizlar) */}
      <div className="bg-[#131318] rounded-3xl p-4 border border-white/5 space-y-3 shadow-soft">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-[#B4F523]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Admin bilan bog'lanish
          </h3>
        </div>

        <div className="space-y-2">
          {/* Yigitlar uchun */}
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

          {/* Qizlar uchun */}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#131318] text-white rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold">Sertifikatlarim</h3>
              <button onClick={() => setActiveModal(null)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
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

      {/* BILDIRISHNOMALAR MODAL */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#131318] text-white rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold">Xabarnomalar</h3>
              <button onClick={() => setActiveModal(null)} className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 bg-[#181820] rounded-2xl border border-white/5 space-y-1">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <p className="text-[11px] text-zinc-400">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
