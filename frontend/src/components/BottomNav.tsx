import React from 'react';
import { Home, BookOpen, GraduationCap, User as UserIcon } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

export type NavTab = 'home' | 'courses' | 'learning' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isAuthenticated: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, isAuthenticated }) => {
  const { haptic } = useTelegram();

  const handleTabClick = (tab: NavTab) => {
    haptic.impact('light');
    onChangeTab(tab);
  };

  const navItems = [
    { id: 'home' as NavTab, label: 'Bosh sahifa', icon: Home },
    { id: 'courses' as NavTab, label: 'Kurslar', icon: BookOpen },
    { id: 'learning' as NavTab, label: 'O‘qishim', icon: GraduationCap },
    { id: 'profile' as NavTab, label: isAuthenticated ? 'Profil' : 'Kirish', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border/80 shadow-[0_-4px_20px_rgba(13,107,78,0.05)] pb-safe transition-all duration-200">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-brand-emerald'
                  : 'text-brand-muted hover:text-brand-secondary active:scale-95'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-colors duration-200 ${
                  isActive ? 'bg-brand-mint text-brand-emerald' : 'text-brand-secondary'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" strokeWidth={isActive ? 2.3 : 1.8} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-emerald rounded-full" />
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium transition-all duration-200 ${
                  isActive ? 'font-semibold text-brand-emerald' : 'text-brand-secondary'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
