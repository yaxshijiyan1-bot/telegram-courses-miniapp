import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';
import { NotificationItem } from '../types';
import { useTelegram } from '../context/TelegramContext';

interface NotificationsPanelProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
}

const typeConfig: Record<string, { icon: React.ReactNode; accent: string; bg: string }> = {
  success: { icon: <CheckCircle2 className="w-4 h-4" />, accent: 'text-[#B4F523]', bg: 'bg-[#B4F523]/12 border-[#B4F523]/25' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, accent: 'text-amber-400', bg: 'bg-amber-400/12 border-amber-400/25' },
  course: { icon: <Award className="w-4 h-4" />, accent: 'text-cyan-400', bg: 'bg-cyan-400/12 border-cyan-400/25' },
  info: { icon: <Info className="w-4 h-4" />, accent: 'text-zinc-300', bg: 'bg-white/5 border-white/10' }
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  notifications,
  onClose
}) => {
  const { haptic } = useTelegram();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#131318] text-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl max-h-[78vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1B1B22] border border-[#B4F523]/30 text-[#B4F523] flex items-center justify-center shadow-neonSm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Bildirishnomalar</h3>
              <span className="text-[10px] text-zinc-400">{notifications.length} ta xabar</span>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ro'yxat */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-[#1B1B22] border border-white/8 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-[#B4F523]/60" />
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Hozircha bildirishnomalar yo'q
              </p>
              <p className="text-[10px] text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
                Kurs tasdiqlanishi, sertifikat va yangiliklar shu yerda ko'rinadi
              </p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.info;
              return (
                <div
                  key={n.id}
                  className={`flex items-start space-x-3 p-3 rounded-2xl border animate-in fade-in slide-in-from-right-2 ${cfg.bg}`}
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center ${cfg.accent}`}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white leading-snug">{n.title}</h4>
                      <span className="text-[9px] text-zinc-500 flex-shrink-0 mt-0.5">{n.created_at}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#B4F523] flex-shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
