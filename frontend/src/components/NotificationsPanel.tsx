import React from 'react';
import { motion } from 'motion/react';
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
  success: { icon: <CheckCircle2 className="w-4 h-4 text-cyan" />, accent: 'text-cyan', bg: 'bg-sky-50 border-sky-200' },
  warning: { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, accent: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  course: { icon: <Award className="w-4 h-4 text-cyan" />, accent: 'text-cyan', bg: 'bg-sky-50 border-sky-200' },
  info: { icon: <Info className="w-4 h-4 text-slate-500" />, accent: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' }
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  notifications,
  onClose
}) => {
  const { haptic } = useTelegram();

  const unread = notifications.filter((n) => !n.is_read).length;

  React.useEffect(() => {
    if (isOpen && unread > 0) {
      import('../services/api').then(({ api }) => {
        api.markNotificationsRead();
      });
      // Optimistic update locally
      notifications.forEach(n => n.is_read = true);
    }
  }, [isOpen, unread, notifications]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/50 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-[32px] sm:rounded-[32px] text-slate-900 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden pb-6 sm:pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-cyan flex items-center justify-center">
              <Bell className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Bildirishnomalar</h3>
              <span className="text-[10px] text-slate-500 font-medium">
                {unread > 0 ? `${unread} ta yangi xabar` : `${notifications.length} ta xabar`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic?.impact?.('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-90 transition-all"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-2.5 bg-slate-50/50">
          {notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Sparkles className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Hozircha yangi bildirishnomalar yo‘q
              </p>
              <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                Kurs tasdiqlanishi, yangi darslar va foydali ma'lumotlar shu yerda ko'rinadi
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
                  className={`flex items-start space-x-3 p-3.5 rounded-2xl border ${cfg.bg} shadow-sm`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center ${cfg.accent}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug truncate pr-2">
                        {n.title}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-medium flex-shrink-0">
                        {relativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-cyan flex-shrink-0 mt-1" />
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
