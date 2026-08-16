import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
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
        {/* Brand Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1B1B22] border border-[#B4F523]/30 text-[#B4F523] flex items-center justify-center shadow-neonSm">
            <Sparkles className="w-4 h-4 fill-[#B4F523]/20" />
          </div>
          <div>
            <span className="text-[9px] font-extrabold tracking-wider text-[#B4F523] uppercase block">
              PREMIUM PLATFORMA
            </span>
            <h1 className="text-xs font-bold text-white leading-tight">
              {user?.name ? user.name.split(' ')[0] : 'Kurslarimiz'}
            </h1>
          </div>
        </div>

        {/* Right Notification Action */}
        <button
          onClick={handleNotificationClick}
          className="relative w-8 h-8 rounded-xl bg-[#16161C] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
          aria-label="Xabarnomalar"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B4F523] rounded-full ring-2 ring-[#09090C] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
