import React from 'react';
import { LayoutGrid, Compass, GraduationCap, User as UserIcon } from 'lucide-react';
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
    { id: 'home' as NavTab, label: 'Main', icon: LayoutGrid },
    { id: 'courses' as NavTab, label: 'Katalog', icon: Compass },
    { id: 'learning' as NavTab, label: 'O‘qish', icon: GraduationCap },
    { id: 'profile' as NavTab, label: isAuthenticated ? 'Profile' : 'Kirish', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E12]/95 backdrop-blur-2xl border-t border-white/5 pb-safe transition-all duration-300">
      <div className="max-w-md mx-auto flex items-center justify-around px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 ${
                isActive ? 'text-[#B4F523]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {/* Active Indicator Bar on Top/Center */}
              {isActive && (
                <div className="w-6 h-1 bg-[#B4F523] rounded-full shadow-neon mb-1 animate-in zoom-in-75 duration-200" />
              )}

              <div className="relative p-1">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>

              <span className={`text-[10px] tracking-tight transition-all duration-200 ${isActive ? 'font-bold text-[#B4F523]' : 'font-medium text-zinc-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
