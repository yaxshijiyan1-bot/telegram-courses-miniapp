import React from 'react';
import { Search, Bell, BookOpen } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenSearch,
  onOpenProfile,
  hasUnreadNotifications = true,
}) => {
  const { haptic, user: tgUser } = useTelegram();
  const { user } = useAuth();

  const displayName = tgUser?.first_name || user?.name || 'A';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-[#f8fafc]/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
      {/* Brand Lockup */}
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onOpenProfile();
        }}
        className="flex items-center space-x-2.5 text-left active:scale-[0.98] transition-transform"
      >
        {/* Blue Book Squircle Logo */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
          <BookOpen className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-[#0f172a] leading-tight tracking-tight">
            Course Academy
          </span>
          <span className="text-[11px] font-medium text-[#64748b]">
            bilim qiymatga aylanadi
          </span>
        </div>
      </button>

      {/* Header Actions */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenSearch();
          }}
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-[#475569] hover:text-[#0f172a] active:scale-95 transition-all"
          aria-label="Qidiruv"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenNotifications();
          }}
          className="relative w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-[#475569] hover:text-[#0f172a] active:scale-95 transition-all"
          aria-label="Xabarnomalar"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadNotifications && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2563eb] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              1
            </span>
          )}
        </button>

        {/* User Avatar */}
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onOpenProfile();
          }}
          className="w-9 h-9 rounded-xl bg-[#334155] text-white font-bold text-xs flex items-center justify-center shadow-sm active:scale-95 transition-transform overflow-hidden"
          aria-label="Profil"
        >
          {initial}
        </button>
      </div>
    </header>
  );
};
