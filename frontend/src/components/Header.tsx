import React from 'react';
import { Bell, Search, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';

interface HeaderProps {
  onOpenNotifications?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenSearch,
  onOpenProfile,
  hasUnreadNotifications = true
}) => {
  const { user } = useAuth();
  const { haptic } = useTelegram();

  return (
    <header className="sticky top-0 z-30 bg-[#05070A]/85 backdrop-blur-2xl px-4 py-3 border-b border-white/[0.06] transition-all duration-300">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Minimalist Geometric Wordmark Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0D1117] border border-cyan/30 flex items-center justify-center shadow-cyanGlowSm">
            <div className="w-2.5 h-2.5 bg-cyan rounded-sm rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-[0.2em] text-white uppercase font-sans">
              COURSE<span className="text-cyan font-light ml-1">ACADEMY</span>
            </span>
          </div>
        </div>

        {/* Right Action Icons: Search, Notifications & Profile Avatar */}
        <div className="flex items-center space-x-1.5">
          {onOpenSearch && (
            <button
              onClick={() => {
                haptic.impact('light');
                onOpenSearch();
              }}
              className="w-8 h-8 rounded-full bg-[#0D1117] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all"
              aria-label="Qidiruv"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              haptic.impact('light');
              onOpenNotifications?.();
            }}
            className="relative w-8 h-8 rounded-full bg-[#0D1117] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all"
            aria-label="Xabarnomalar"
          >
            <Bell className="w-3.5 h-3.5" />
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan rounded-full shadow-cyanGlowSm animate-cyan-pulse" />
            )}
          </button>

          {onOpenProfile && (
            <button
              onClick={() => {
                haptic.impact('light');
                onOpenProfile();
              }}
              className="w-8 h-8 rounded-full bg-[#0D1117] border border-white/[0.08] hover:border-cyan/40 p-0.5 flex items-center justify-center active:scale-95 transition-all"
              aria-label="Profil"
            >
              {user?.telegram_id === 8112688757 ? (
                <img src="/images/zuhra_olimova.jpg" alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <img src="/images/yaxshi_bola.jpg" alt="Avatar" className="w-full h-full rounded-full object-cover" />
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
