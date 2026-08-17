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
  success: { icon: <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />, accent: 'text-[#22D3EE]', bg: 'bg-[#22D3EE]/[0.08] border-[#22D3EE]/25' },
  warning: { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, accent: 'text-amber-400', bg: 'bg-amber-400/[0.08] border-amber-400/25' },
  course: { icon: <Award className="w-4 h-4 text-[#22D3EE]" />, accent: 'text-[#22D3EE]', bg: 'bg-[#22D3EE]/[0.08] border-[#22D3EE]/25' },
  info: { icon: <Info className="w-4 h-4 text-[#94A3B8]" />, accent: 'text-[#94A3B8]', bg: 'bg-white/[0.04] border-white/[0.08]' }
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-t-[32px] sm:rounded-[32px] text-[#F4F7FB] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden pb-6 sm:pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[#22D3EE] flex items-center justify-center">
              <Bell className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white leading-tight">Bildirishnomalar</h3>
              <span className="text-[10px] text-[#94A3B8]">
                {unread > 0 ? `${unread} ta yangi xabar` : `${notifications.length} ta xabar`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white active:scale-90 transition-all"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-[#64748B]">
                <Sparkles className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-xs text-[#94A3B8] font-medium">
                Hozircha yangi bildirishnomalar yo‘q
              </p>
              <p className="text-[10px] text-[#64748B] max-w-[220px] mx-auto leading-relaxed">
                Kurs tasdiqlanishi, yangi darslar va sertifikatlar shu yerda ko‘rinadi
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
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className={`flex items-start space-x-3 p-3.5 rounded-2xl border ${cfg.bg}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl bg-black/50 flex items-center justify-center ${cfg.accent}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                      <span className="text-[9px] text-[#64748B] font-mono flex-shrink-0 ml-2">
                        {relativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-3">
                      {n.message}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
