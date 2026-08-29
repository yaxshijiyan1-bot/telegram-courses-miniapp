import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  CircleHelp,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  BookOpen,
  Copy,
  Check,
  Trophy,
  GraduationCap,
  Send,
  X,
  Settings2,
  Users,
} from 'lucide-react';
import { Certificate, NotificationItem } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import { relativeTime } from '../utils/format';

interface ProfilePageProps {
  certificates: Certificate[];
  notifications: NotificationItem[];
  dashboardData: any;
  onNotificationsRead: () => void;
  onNavigateToCourses: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

// Do'stlarni taklif qilish — har foydalanuvchining shaxsiy referal havolasi.
// Havola botga /start ref_KOD payload'i bilan boradi; do'sti kurs sotib olganda
// referrerga bir martalik foizli mukofot promokodi beriladi.
const FALLBACK_INVITE_URL = 'https://telegram-courses-miniapp2.pages.dev';
const INVITE_TEXT = "Kreativ AI — bilim qiymatga aylanadi. Kurslarni ko'rib chiq!";

interface ReferralInfo {
  code: string;
  link: string;
  invited_count: number;
  buyers_count: number;
  reward_codes: { code: string; percent: number; used: boolean }[];
  reward_percent: number;
  invitee_percent: number;
  milestones?: {
    id: string;
    invited_count: number;
    title: string;
    gift_course_title?: string | null;
    claimed?: boolean;
    progress?: number;
  }[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  certificates,
  notifications,
  dashboardData,
  onNotificationsRead,
  onNavigateToCourses,
  onOpenAdmin,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const { haptic, user: tgUser } = useTelegram();
  const { t } = useSettings();
  const [showCertModal, setShowCertModal] = useState(false);
  // Referal ma'lumotlari
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  useEffect(() => {
    api.getReferralInfo().then(setReferral).catch(() => {});
  }, []);

  const inviteLink = referral?.link || FALLBACK_INVITE_URL;
  const inviteShare = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(INVITE_TEXT)}`;

  const handleCopyReferral = () => {
    haptic?.impact?.('light');
    navigator.clipboard?.writeText(inviteLink).catch(() => {});
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

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
    { icon: BookOpen, label: t('yakunlangan dars'), value: completedLessons, accent: 'text-cyan bg-cyan/10 border-cyan/20' },
    { icon: GraduationCap, label: t('aktiv kurs'), value: enrolledCount, accent: 'text-violet bg-violet/10 border-violet/20' },
    { icon: Trophy, label: t('umumiy progress'), value: `${overallProgress}%`, accent: 'text-gold bg-gold/10 border-gold/20' },
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
        <div className="absolute -right-12 -top-16 w-44 h-44 blob blob-cyan pointer-events-none" />
        <div className="absolute -left-10 -bottom-16 w-40 h-40 blob blob-violet pointer-events-none" />

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
              {t('Telegram')}: <span className="text-cyan">@{username}</span>
            </p>
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <Send className="w-2.5 h-2.5" />
              {t('Profil birikkan')}
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
        <h2 className="text-sm font-bold text-ink px-1">{t('Hisob boshqaruvi')}</h2>

        <div className="glass rounded-[22px] divide-y divide-white/[0.05] overflow-hidden">


          {isSuperadmin && (
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                onOpenAdmin();
              }}
              className="w-full p-3.5 flex items-center justify-between bg-cyan/[0.05] hover:bg-cyan/[0.09] transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 text-cyan" strokeWidth={2.2} />
                <span className="text-xs font-extrabold text-cyan">{t('Superadmin boshqaruv paneli')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan" />
            </button>
          )}

          {/* Sozlamalar */}
          <button
            type="button"
            onClick={() => {
              haptic.impact('medium');
              onOpenSettings();
            }}
            className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <Settings2 className="w-4 h-4 text-cyan" strokeWidth={2.2} />
              <span className="text-xs font-semibold text-ink">{t('Sozlamalar')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </button>

          <a
            href="https://t.me/yomonboIa"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.impact('light')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <CircleHelp className="w-4 h-4 text-cyan" strokeWidth={2.2} />
              <span className="text-xs font-semibold text-ink">{t('Yordam va qo‘llab-quvvatlash')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </a>
        </div>
      </motion.div>

      {/* Do'stlarni taklif qilish — shaxsiy referal havola + mukofot */}
      <motion.div variants={item} className="relative overflow-hidden rounded-[22px] p-4 space-y-3 text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', boxShadow: '0 10px 30px -12px rgba(124,58,237,0.55)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Users className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <b className="text-xs font-extrabold block leading-tight">{t("Do'stlarni taklif qilish")}</b>
              <span className="text-[10px] text-white/80 block">
                {referral
                  ? t('Do\'stingiz kurs olganda') + ` −${referral.reward_percent}% ${t('mukofot kodi')}`
                  : t('Bilimni yaqinlaringiz bilan ulashing')}
              </span>
            </div>
          </div>
          <a
            href={inviteShare}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.impact('medium')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex-shrink-0"
            aria-label={t('Ulashish')}
          >
            <ArrowUpRight className="w-4 h-4 text-white/90" />
          </a>
        </div>

        {referral ? (
          <>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl p-2">
              <span className="flex-1 min-w-0 text-[10px] font-mono text-white/90 truncate">{inviteLink}</span>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-violet-600 text-[10px] font-extrabold active:scale-95 transition-transform flex-shrink-0"
              >
                {refCopied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                {refCopied ? t('Nusxalandi!') : t('Nusxalash')}
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-white/85">
              <span>👥 {referral.invited_count} {t('taklif qilingan')}</span>
              <span>🛒 {referral.buyers_count} {t('xarid qildi')}</span>
              <span>🎁 {t('mukofot')} −{referral.reward_percent}%</span>
            </div>
            {(referral.milestones ?? []).length > 0 ? (
              <div className="space-y-1.5">
                {referral.milestones!.map((ms) => {
                  const prog = Math.min(ms.progress ?? 0, ms.invited_count);
                  const pct = Math.round((prog / ms.invited_count) * 100);
                  return (
                    <div key={ms.id} className="bg-white/10 border border-white/15 rounded-xl p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-white truncate">
                          {ms.claimed ? '✅ ' : '🎯 '}{ms.title}
                        </span>
                        <span className="text-[10px] font-extrabold text-white/90 tabular-nums flex-shrink-0">
                          {ms.claimed ? t('Olingan') : `${prog}/${ms.invited_count}`}
                        </span>
                      </div>
                      {!ms.claimed ? (
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden mt-1.5">
                          <div
                            className="h-full rounded-full bg-white transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      ) : null}
                      {ms.gift_course_title ? (
                        <p className="text-[9px] text-white/75 mt-1">🎁 {ms.gift_course_title}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            {referral.reward_codes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {referral.reward_codes.filter(c => !c.used).slice(0, 3).map(c => (
                  <span key={c.code} className="text-[10px] font-extrabold font-mono px-2 py-1 rounded-lg bg-white/15 border border-white/20">
                    {c.code} · −{c.percent}%
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </motion.div>

      {/* Ustozlar */}
      <motion.div variants={item} className="space-y-2">
        <h2 className="text-sm font-bold text-ink px-1">{t('Ustozlar bilan bog‘lanish')}</h2>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { name: 'Zuhra Olimova', tag: '@Olimova_Zuhra', avatar: '/images/ustoz_zuhra_olimova.webp', url: 'https://t.me/+awu_1WFe7MhiNmQ6' },
            { name: 'Yaxshi Bola', tag: '@yomonboIa', avatar: '/images/ustoz_yaxshi_bola.webp', url: 'https://t.me/yomonboIa' },
          ].map((mentor) => (
            <a
              key={mentor.url}
              href={mentor.url}
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
          <h2 className="text-sm font-bold text-ink px-1">{t('Oxirgi bildirishnomalar')}</h2>
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



    </motion.div>
  );
};
