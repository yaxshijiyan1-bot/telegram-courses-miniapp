import React, { useState } from 'react';
import {
  Award,
  CircleHelp,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  User,
  ArrowUpRight
} from 'lucide-react';
import { Certificate, NotificationItem } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardModal } from './AdminDashboardModal';

interface ProfilePageProps {
  certificates: Certificate[];
  notifications: NotificationItem[];
  dashboardData: any;
  onNotificationsRead: () => void;
  onNavigateToCourses: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  certificates,
  notifications,
  onNotificationsRead,
  onNavigateToCourses,
}) => {
  const { user } = useAuth();
  const { haptic, user: tgUser } = useTelegram();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const isSuperadmin = user?.role === 'superadmin' || tgUser?.id === 8544023815 || tgUser?.id === 8112688757;
  const displayName = tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : (user?.name || 'Yaxshi Bola');
  const username = tgUser?.username || user?.username || 'yomonboia';

  return (
    <div className="px-4 pt-3 space-y-4 animate-fade-up">
      {/* 1. Profile Info Card */}
      <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-soft space-y-1">
        <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mb-2 shadow-sm">
          <User className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <p className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
          SHAXSIY HUDUD
        </p>
        <h1 className="text-lg sm:text-xl font-extrabold text-[#0f172a] leading-tight">
          {displayName}
        </h1>
        <p className="text-xs font-semibold text-[#64748b]">
          Telegram: <span className="text-[#2563eb]">@{username}</span>
        </p>
      </section>

      {/* 2. Telegram Connect Status Card */}
      <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft flex items-start space-x-3">
        <div className="w-8 h-8 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0 mt-0.5">
          <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#0f172a]">
            Telegram bilan birikkan profil
          </h3>
          <p className="text-[11px] text-[#64748b] leading-relaxed">
            Bot ichida ochilganda profilingiz xavfsiz tekshiriladi.
          </p>
        </div>
      </section>

      {/* 3. Account Actions / Preferences */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[#0f172a] px-1">
          Hisob boshqaruvi
        </h2>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft divide-y divide-slate-100 overflow-hidden">
          {/* Sertifikatlar */}
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              setShowCertModal(true);
            }}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <Award className="w-4 h-4 text-[#2563eb]" />
              <span className="text-xs font-semibold text-[#0f172a]">
                Mening sertifikatlarim
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </button>

          {/* Superadmin Panel */}
          {isSuperadmin && (
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                setIsAdminOpen(true);
              }}
              className="w-full p-3.5 flex items-center justify-between bg-[#eff6ff]/60 hover:bg-[#eff6ff] transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                <span className="text-xs font-bold text-[#2563eb]">
                  Superadmin Boshqaruv Paneli
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#2563eb]" />
            </button>
          )}

          {/* Yordam va Qo'llab-quvvatlash */}
          <a
            href="https://t.me/yomonboia"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.impact('light')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <CircleHelp className="w-4 h-4 text-[#2563eb]" />
              <span className="text-xs font-semibold text-[#0f172a]">
                Yordam va qo‘llab-quvvatlash
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </a>
        </div>
      </div>

      {/* 4. Mentors Direct Contact */}
      <div className="space-y-2 pt-1">
        <h2 className="text-sm font-bold text-[#0f172a] px-1">
          Ustozlar bilan bog‘lanish
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href="https://t.me/yomonboia"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.impact('light')}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-soft flex items-center justify-between hover:border-[#2563eb]/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src="/images/yaxshi_bola.jpg"
                alt="Yaxshi Bola"
                className="w-9 h-9 rounded-xl object-cover border border-slate-100 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0f172a] block truncate">
                  Yaxshi Bola
                </span>
                <span className="text-[10px] text-[#64748b] truncate block">
                  @yomonboia
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#2563eb] flex-shrink-0" />
          </a>

          <a
            href="https://t.me/sokin_notalar"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.impact('light')}
            className="p-3 bg-white border border-slate-100 rounded-2xl shadow-soft flex items-center justify-between hover:border-[#2563eb]/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src="/images/zuhra_olimova.jpg"
                alt="Zuhra Olimova"
                className="w-9 h-9 rounded-xl object-cover border border-slate-100 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0f172a] block truncate">
                  Zuhra Olimova
                </span>
                <span className="text-[10px] text-[#64748b] truncate block">
                  @sokin_notalar
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#2563eb] flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Sertifikatlar Modali */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-[#0f172a]">Mening Sertifikatlarim</h3>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-[#64748b] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#eff6ff] rounded-2xl border border-[#dbeafe] text-center space-y-2">
              <Award className="w-10 h-10 mx-auto text-[#2563eb]" />
              <h4 className="text-xs font-bold text-[#0f172a]">Course Academy Sertifikati</h4>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Kurs darslarini 100% yakunlaganingizdan so‘ng rasmiy QR-kodli, raqamli tekshiriladigan sertifikat bu yerda ochiladi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCertModal(false)}
              className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}

      {/* Superadmin Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          adminName={displayName}
        />
      )}
    </div>
  );
};
