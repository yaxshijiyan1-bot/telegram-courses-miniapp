import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  Award,
  Sparkles,
} from 'lucide-react';
import { NotificationItem } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { relativeTime } from '../utils/format';

interface NotificationsPanelProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
}

const typeConfig: Record<string, { icon: React.ReactNode; accent: string; bg: string }> = {
  success: { icon: <CheckCircle2 className="w-4 h-4 text-cyan" />, accent: 'text-cyan', bg: 'bg-cyan/[0.07] border-cyan/20' },
  warning: { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, accent: 'text-amber-400', bg: 'bg-amber-400/[0.07] border-amber-400/20' },
  course: { icon: <Award className="w-4 h-4 text-cyan" />, accent: 'text-cyan', bg: 'bg-cyan/[0.07] border-cyan/20' },
  info: { icon: <Info className="w-4 h-4 text-ink-secondary" />, accent: 'text-ink-secondary', bg: 'bg-white/[0.035] border-white/[0.07]' }
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  notifications,
  onClose
}) => {
  const { haptic } = useTelegram();

  if (!isOpen) return null;

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md animate-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-deep !rounded-t-[28px] sm:!rounded-[28px] text-ink shadow-2xl max-h-[78vh] flex flex-col animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan flex items-center justify-center shadow-cyanGlowSm">
              <Bell className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-ink leading-tight">Bildirishnomalar</h3>
              <span className="text-[10px] text-ink-muted">
                {unread > 0 ? `${unread} ta o‘qilmagan` : `${notifications.length} ta xabar`}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl glass-chip flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-ink-muted" strokeWidth={2} />
              </div>
              <p className="text-xs text-ink-secondary font-medium">
                Hozircha bildirishnomalar yo‘q
              </p>
              <p className="text-[10px] text-ink-muted max-w-[220px] mx-auto leading-relaxed">
                Kurs tasdiqlanishi, sertifikat va yangiliklar shu yerda ko‘rinadi
              </p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.info;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={`flex items-start space-x-3 p-3 rounded-2xl border ${cfg.bg}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center ${cfg.accent}`}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-ink leading-snug">{n.title}</h4>
                      <span className="text-[9px] text-ink-muted flex-shrink-0 mt-0.5 whitespace-nowrap">
                        {relativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-secondary leading-relaxed mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan shadow-cyanGlowSm flex-shrink-0 mt-1.5" />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
