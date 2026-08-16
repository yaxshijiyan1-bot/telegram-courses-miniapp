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
  success: { icon: <CheckCircle2 className="w-4 h-4 stroke-cyan" />, accent: 'text-cyan', bg: 'bg-cyan/10 border-cyan/30' },
  warning: { icon: <AlertTriangle className="w-4 h-4 stroke-amber-400" />, accent: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/25' },
  course: { icon: <Award className="w-4 h-4 stroke-cyan" />, accent: 'text-cyan', bg: 'bg-cyan/10 border-cyan/30' },
  info: { icon: <Info className="w-4 h-4 stroke-slate-300" />, accent: 'text-slate-300', bg: 'bg-white/[0.04] border-white/[0.08]' }
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0D1117] text-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/[0.08] shadow-2xl max-h-[78vh] flex flex-col animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan/15 border border-cyan/30 text-cyan flex items-center justify-center shadow-cyanGlowSm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Bildirishnomalar</h3>
              <span className="text-[10px] text-slate-400">{notifications.length} ta xabar</span>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-cyan/60" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Hozircha bildirishnomalar yo‘q
              </p>
              <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                Kurs tasdiqlanishi, sertifikat va yangiliklar shu yerda ko‘rinadi
              </p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.info;
              return (
                <div
                  key={n.id}
                  className={`flex items-start space-x-3 p-3 rounded-2xl border ${cfg.bg}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center ${cfg.accent}`}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white leading-snug">{n.title}</h4>
                      <span className="text-[9px] text-slate-500 flex-shrink-0 mt-0.5">{n.created_at}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan shadow-cyanGlowSm flex-shrink-0 mt-1" />
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
