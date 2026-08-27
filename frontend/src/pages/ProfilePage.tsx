import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  CircleHelp,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  BookOpen,
  Trophy,
  GraduationCap,
  Send,
  X,
} from 'lucide-react';
import { Certificate, NotificationItem } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardModal } from './AdminDashboardModal';
import { relativeTime } from '../utils/format';

interface ProfilePageProps {
  certificates: Certificate[];
  notifications: NotificationItem[];
  dashboardData: any;
  onNotificationsRead: () => void;
  onNavigateToCourses: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

export const ProfilePage: React.FC<ProfilePageProps> = ({
  certificates,
  notifications,
  dashboardData,
  onNotificationsRead,
  onNavigateToCourses,
}) => {
  const { user } = useAuth();
  const { haptic, user: tgUser } = useTelegram();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const isSuperadmin = user?.role === 'superadmin' || tgUser?.id === 8544023815 || tgUser?.id === 8112688757;
  const displayName = tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : (user?.name || 'Talaba');
  const username = tgUser?.username || user?.username || '—';
  const photoUrl = tgUser?.photo_url;

  // REAL metrikalar — backend dashboard ma'lumotidan
  const completedLessons = dashboardData?.completed_lessons_count ?? 0;
  const enrolledCount = dashboardData?.enrolled_courses?.length ?? 0;
  const overallProgress = dashboardData?.overall_progress_percent ?? 0;

  const initial = displayName.charAt(0).toUpperCase();

  const metrics = [
    { icon: BookOpen, label: 'yakunlangan dars', value: completedLessons, accent: 'text-cyan bg-cyan/10 border-cyan/20' },
    { icon: GraduationCap, label: 'aktiv kurs', value: enrolledCount, accent: 'text-violet bg-violet/10 border-violet/20' },
    { icon: Trophy, label: 'umumiy progress', value: `${overallProgress}%`, accent: 'text-gold bg-gold/10 border-gold/20' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pt-4 space-y-4"
    >
      {/* Profil kartasi */}
      <motion.section variants={item} className="glass rounded-[26px] p-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-16 w-44 h-44 rounded-full bg-cyan/[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-16 w-40 h-40 rounded-full bg-violet/[0.06] blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-[18px] overflow-hidden bg-gradient-to-br from-cyan/40 to-violet/40 border border-slate-200 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-cyanGlowSm">
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-ink leading-tight truncate">{displayName}</h1>
            <p className="text-[11px] font-semibold text-ink-muted">
              Telegram: <span className="text-cyan">@{username}</span>
            </p>
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <Send className="w-2.5 h-2.5" />
              Profil birikkan
            </span>
          </div>
        </div>

        {/* REAL metrikalar */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="text-center space-y-1">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mx-auto ${m.accent}`}>
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <b className="text-sm font-extrabold text-ink block leading-none tabular-nums">{m.value}</b>
                <span className="text-[9px] text-ink-muted block leading-tight">{m.label}</span>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Hisob boshqaruvi */}
      <motion.div variants={item} className="space-y-2">
        <h2 className="text-sm font-bold text-ink px-1">Hisob boshqaruvi</h2>

        <div className="glass rounded-[22px] divide-y divide-white/[0.05] overflow-hidden">


          {isSuperadmin && (
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                setIsAdminOpen(true);
              }}
              className="w-full p-3.5 flex items-center justify-between bg-cyan/[0.05] hover:bg-cyan/[0.09] transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 text-cyan" strokeWidth={2.2} />
                <span className="text-xs font-extrabold text-cyan">Superadmin boshqaruv paneli</span>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan" />
            </button>
          )}

          <a
            href="https://t.me/yomonboia"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.impact('light')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <CircleHelp className="w-4 h-4 text-cyan" strokeWidth={2.2} />
              <span className="text-xs font-semibold text-ink">Yordam va qo‘llab-quvvatlash</span>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </a>
        </div>
      </motion.div>

      {/* Ustozlar */}
      <motion.div variants={item} className="space-y-2">
        <h2 className="text-sm font-bold text-ink px-1">Ustozlar bilan bog‘lanish</h2>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { name: 'Yaxshi Bola', tag: '@yomonboia', avatar: '/images/ustoz_yaxshi_bola.webp' },
            { name: 'Zuhra Olimova', tag: '@sokin_notalar', avatar: '/images/ustoz_zuhra_olimova.webp' },
          ].map((mentor) => (
            <a
              key={mentor.tag}
              href={`https://t.me/${mentor.tag.slice(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.impact('light')}
              className="glass !rounded-[20px] p-3 flex items-center justify-between pressable"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="w-9 h-9 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-ink block truncate">{mentor.name}</span>
                  <span className="text-[9px] text-ink-muted truncate block">{mentor.tag}</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-cyan flex-shrink-0" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Oxirgi bildirishnomalar — real vaqt bilan */}
      {notifications.length > 0 && (
        <motion.div variants={item} className="space-y-2">
          <h2 className="text-sm font-bold text-ink px-1">Oxirgi bildirishnomalar</h2>
          <div className="glass rounded-[22px] divide-y divide-white/[0.05] overflow-hidden">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-[11px] font-bold text-ink block clamp-1">{n.title}</b>
                  <p className="text-[10px] text-ink-muted clamp-1">{n.message}</p>
                </div>
                <span className="text-[9px] text-ink-muted flex-shrink-0 mt-0.5">{relativeTime(n.created_at)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}



      {/* Superadmin */}
      {isAdminOpen && (
        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          adminName={displayName}
        />
      )}
    </motion.div>
  );
};
