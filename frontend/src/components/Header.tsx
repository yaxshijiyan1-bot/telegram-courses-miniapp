import React from 'react';
import { Search, Bell, GraduationCap } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenSearch,
  onOpenProfile,
  unreadCount = 0,
}) => {
  const { haptic, user: tgUser } = useTelegram();
  const { user } = useAuth();

  const displayName = tgUser?.first_name || user?.name || 'Talaba';
  const initial = displayName.charAt(0).toUpperCase();
  const photoUrl = tgUser?.photo_url;

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 pb-3 bg-white/95 border-b border-slate-200/80 flex items-center justify-between">
      {/* Brand */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onOpenProfile();
        }}
        className="flex items-center space-x-3 text-left pressable rounded-2xl pr-2"
      >
        <div className="relative w-10 h-10 rounded-[14px] bg-gradient-to-br from-cyan-500/15 via-cyan-500/10 to-violet-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0 shadow-cyanGlowSm">
          <GraduationCap className="w-5 h-5 text-cyan" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-extrabold text-ink leading-tight tracking-tight">
            Kreativ AI
          </span>
          <span className="text-[10px] font-medium text-ink-muted tracking-wide">
            bilim qiymatga aylanadi
          </span>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center space-x-2">

        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenSearch();
          }}
          className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink active:scale-90 transition-all"
          aria-label="Qidiruv"
        >
          <Search className="w-4 h-4" strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenNotifications();
          }}
          className="relative w-9 h-9 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink active:scale-90 transition-all"
          aria-label="Xabarnomalar"
        >
          <Bell className="w-4 h-4" strokeWidth={2.2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse-glow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onOpenProfile();
          }}
          className="w-9 h-9 rounded-[14px] overflow-hidden bg-gradient-to-br from-cyan/40 to-violet/40 border border-slate-200 flex items-center justify-center text-white font-extrabold text-xs active:scale-90 transition-transform"
          aria-label="Profil"
        >
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </button>
      </div>
    </header>
  );
};
