import React from 'react';
import { LayoutGrid, Compass, BookOpen, User } from 'lucide-react';
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
    { id: 'home' as NavTab, label: 'Bosh sahifa', icon: LayoutGrid },
    { id: 'courses' as NavTab, label: 'Kurslar', icon: Compass },
    { id: 'learning' as NavTab, label: 'O‘qish', icon: BookOpen },
    { id: 'profile' as NavTab, label: isAuthenticated ? 'Profil' : 'Kirish', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#05070A]/90 backdrop-blur-2xl border-t border-white/[0.06] pb-safe transition-all duration-300">
      <div className="max-w-md mx-auto flex items-center justify-around px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 ${
                isActive ? 'text-cyan' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Subtle Cyan Top Indicator */}
              {isActive && (
                <div className="w-5 h-0.5 bg-cyan rounded-full shadow-cyanGlowSm mb-1 animate-fade-up" />
              )}

              <div className="relative p-1">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-105 stroke-cyan' : 'stroke-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
              </div>

              <span
                className={`text-[10px] tracking-tight transition-all duration-200 ${
                  isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
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
