import React, { useState } from 'react';
import {
  User as UserIcon,
  Award,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  ShieldAlert,
  MessageCircle
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

  return (
    <div className="flex-1 pb-safe-nav px-4 pt-3 space-y-4 animate-in fade-in duration-200">
      {/* Profile Info Header */}
      <div className="bg-white rounded-hero p-5 border border-brand-border/80 shadow-soft text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-emerald to-brand-forest text-white flex items-center justify-center text-2xl font-bold font-serif mx-auto shadow-elevated border-2 border-brand-gold/40">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-brand-emerald border-2 border-white rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </span>
        </div>

        <div>
          <h2 className="text-base font-bold text-brand-dark">{user?.name || 'Yaxshi Bola'}</h2>
          <p className="text-xs text-brand-secondary mt-0.5">@{user?.username || 'yomonboia'}</p>
          <div className="inline-flex items-center space-x-1 mt-2 bg-brand-mint px-2.5 py-0.5 rounded-full text-[10px] font-bold text-brand-emerald uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-brand-gold" />
            <span>{isSuperadmin ? '👑 Superadmin' : 'Premium Student'}</span>
          </div>
        </div>
      </div>

      {/* Menu Navigation List */}
      <div className="bg-white rounded-card border border-brand-border/80 shadow-soft overflow-hidden divide-y divide-brand-border/60">
        {/* Admin Dashboard Entry (Ikkala teng huquqli admin uchun) */}
        {isSuperadmin && (
          <button
            onClick={() => {
              haptic.impact('medium');
              setActiveModal('admin');
            }}
            className="w-full p-4 flex items-center justify-between bg-brand-mint/20 hover:bg-brand-mint/40 text-left transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-brand-emerald text-white flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-brand-emerald">Superadmin Dashboard</h4>
                <p className="text-[10px] text-brand-secondary">Cheklar, tushumlar, kurslar & CRM</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-emerald" />
          </button>
        )}

        <button
          onClick={() => {
            haptic.impact('light');
            setActiveModal('certificates');
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-brand-surface text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-dark">Sertifikatlarim</h4>
              <p className="text-[10px] text-brand-secondary">Bitirgan kurslar sertifikatlari</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-brand-emerald font-bold">
            <span>{certificates.length} ta</span>
            <ChevronRight className="w-4 h-4 text-brand-muted" />
          </div>
        </button>

        <button
          onClick={() => {
            haptic.impact('light');
            setActiveModal('notifications');
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-brand-surface text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-brand-mint text-brand-emerald flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-dark">Bildirishnomalar</h4>
              <p className="text-[10px] text-brand-secondary">Tizim xabarlari va yangiliklar</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-muted" />
        </button>

        <button
          onClick={() => {
            haptic.impact('light');
            onNavigateToCourses();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-brand-surface text-left transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-dark">Katalog va Xaridlar</h4>
              <p className="text-[10px] text-brand-secondary">Yangi kurslar kashf qilish</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-muted" />
        </button>
      </div>

      {/* Bog'lanish va Yordam Markazi (Adminlar lichkalari) */}
      <div className="bg-white rounded-card border border-brand-border/80 shadow-soft p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-brand-emerald" />
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
            Rasmiy Aloqa & Qo'llab-quvvatlash
          </h3>
        </div>

        <p className="text-[11px] text-brand-secondary leading-relaxed">
          Savollar, to'lov cheki yoki takliflar bo'yicha to'g'ridan-to'g'ri adminlarimizga yozishingiz mumkin:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Admin 1: Yaxshi Bola */}
          <a
            href="https://t.me/yomonboia"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 bg-brand-surface hover:bg-brand-mint/30 rounded-2xl border border-brand-border/80 flex items-center space-x-2.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-emerald text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              YB
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-brand-dark group-hover:text-brand-emerald transition-colors truncate">
                Yaxshi Bola
              </h4>
              <p className="text-[10px] text-brand-secondary truncate">@yomonboia</p>
            </div>
          </a>

          {/* Admin 2: Zuhra Olimova */}
          <a
            href="https://t.me/sokin_notalar"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 bg-brand-surface hover:bg-brand-mint/30 rounded-2xl border border-brand-border/80 flex items-center space-x-2.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-forest text-brand-gold flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              ZO
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-brand-dark group-hover:text-brand-emerald transition-colors truncate">
                Zuhra Olimova
              </h4>
              <p className="text-[10px] text-brand-secondary truncate">@sokin_notalar</p>
            </div>
          </a>
        </div>

        {/* Rasmiy Bot */}
        <a
          href="https://t.me/kurslarimizbot"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 bg-brand-mint/40 hover:bg-brand-mint text-brand-emerald rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border border-brand-emerald/20"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Rasmiy Bot: @kurslarimizbot</span>
        </a>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-200/60 hover:bg-red-100/60 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Hisobdan chiqish</span>
      </button>

      {/* Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={activeModal === 'admin'}
        onClose={() => setActiveModal(null)}
        adminName={user?.name || 'Yaxshi Bola'}
      />

      {/* Certificates Modal */}
      {activeModal === 'certificates' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-brand-border space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-brand-gold" />
                <h3 className="text-sm font-bold text-brand-dark">Sertifikatlarim</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-brand-surface flex items-center justify-center text-brand-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-gradient-to-br from-brand-cream to-brand-surface rounded-2xl p-4 border-2 border-brand-gold/30 shadow-soft space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-emerald">
                      Rasmiy Sertifikat
                    </span>
                    <h4 className="text-xs font-serif font-bold text-brand-dark mt-0.5">
                      {cert.course_title}
                    </h4>
                  </div>
                  <Sparkles className="w-4 h-4 text-brand-gold flex-shrink-0" />
                </div>

                <div className="text-[10px] text-brand-secondary space-y-0.5 pt-1 border-t border-brand-gold/20">
                  <p>Talaba: <span className="font-bold text-brand-dark">{cert.student_name}</span></p>
                  <p>Kod: <span className="font-mono text-brand-emerald">{cert.certificate_code}</span></p>
                  <p>Berilgan sana: {cert.issued_at}</p>
                </div>

                <button
                  onClick={() => haptic.notification('success')}
                  className="w-full py-2 bg-brand-emerald text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sertifikatni yuklab olish (PDF)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-brand-border space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-sm font-bold text-brand-dark">Bildirishnomalar</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-brand-surface flex items-center justify-center text-brand-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 bg-brand-surface rounded-xl border border-brand-border/60 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-dark">{notif.title}</h4>
                    <span className="text-[9px] text-brand-muted">{notif.created_at}</span>
                  </div>
                  <p className="text-[11px] text-brand-secondary leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
