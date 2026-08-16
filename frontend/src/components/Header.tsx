import React from 'react';
import { Bell, Settings, Plus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';

interface HeaderProps {
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, hasUnreadNotifications = true }) => {
  const { user } = useAuth();
  const { haptic } = useTelegram();

  const handleNotificationClick = () => {
    haptic.impact('light');
    onOpenNotifications?.();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#09090C]/90 backdrop-blur-xl px-4 py-2.5 border-b border-white/5 transition-all duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Actions: Settings & Notifications */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => haptic.impact('light')}
            className="w-9 h-9 rounded-2xl bg-[#16161C] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all"
            aria-label="Sozlamalar"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleNotificationClick}
            className="relative w-9 h-9 rounded-2xl bg-[#16161C] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all"
            aria-label="Bildirishnomalar"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#B4F523] rounded-full ring-2 ring-[#09090C] animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Action: Balance / XP Pill with Plus (Rasmdagi kabi) */}
        <div className="flex items-center space-x-1.5 bg-[#16161C] border border-white/10 rounded-full pl-3 pr-1.5 py-1 shadow-soft">
          <Zap className="w-3.5 h-3.5 text-[#B4F523] fill-[#B4F523]" />
          <span className="text-xs font-bold text-white tracking-wide">
            1,450 XP
          </span>
          <button
            onClick={() => haptic.impact('medium')}
            className="w-5 h-5 rounded-full bg-[#B4F523] text-black flex items-center justify-center font-bold active:scale-90 transition-transform shadow-neonSm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </header>
  );
};
