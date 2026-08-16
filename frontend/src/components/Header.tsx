import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';

interface HeaderProps {
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, hasUnreadNotifications = true }) => {
  const { user, isAuthenticated } = useAuth();
  const { haptic } = useTelegram();

  const handleNotificationClick = () => {
    haptic.impact('light');
    onOpenNotifications?.();
  };

  return (
    <header className="sticky top-0 z-30 bg-brand-cream/90 backdrop-blur-md px-4 py-3 border-b border-brand-border/60 transition-all duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & Greeting */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-emerald to-brand-forest flex items-center justify-center shadow-soft">
            <Sparkles className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold tracking-wider text-brand-emerald uppercase bg-brand-mint px-1.5 py-0.5 rounded-md">
                Premium
              </span>
            </div>
            <h1 className="text-sm font-semibold text-brand-dark leading-tight mt-0.5">
              {isAuthenticated ? `Salom, ${user?.name.split(' ')[0]} 👋` : 'EduCore Platform'}
            </h1>
          </div>
        </div>

        {/* Notifications Icon */}
        <button
          onClick={handleNotificationClick}
          className="relative w-9 h-9 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-secondary hover:text-brand-emerald active:scale-95 transition-all shadow-sm"
          aria-label="Bildirishnomalar"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadNotifications && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-emerald rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
