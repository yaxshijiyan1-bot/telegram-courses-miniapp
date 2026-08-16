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
    { id: 'courses' as NavTab, label: 'Katalog', icon: BookOpen },
    { id: 'learning' as NavTab, label: 'O‘qishim', icon: GraduationCap },
    { id: 'profile' as NavTab, label: isAuthenticated ? 'Profil' : 'Kirish', icon: UserIcon },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40 pointer-events-auto">
      <nav className="bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_10px_35px_rgba(13,107,78,0.12)] rounded-3xl px-2 py-1.5 transition-all duration-300">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 ${
                  isActive ? 'scale-105' : 'opacity-70 hover:opacity-100 active:scale-95'
                }`}
              >
                <div
                  className={`relative px-3.5 py-1 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-emerald to-brand-deep text-white shadow-soft'
                      : 'text-brand-dark hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 1.8} />
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-bold transition-all duration-200 ${
                    isActive ? 'text-brand-emerald' : 'text-brand-secondary'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
