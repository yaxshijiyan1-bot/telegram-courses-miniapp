import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, BookOpen, User } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

export type NavTab = 'home' | 'courses' | 'learning' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isAuthenticated: boolean;
}

const spring = { type: 'spring' as const, stiffness: 420, damping: 32 };

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const { haptic } = useTelegram();

  const tabs: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Bosh sahifa', icon: Home },
    { id: 'courses', label: 'Kurslar', icon: Compass },
    { id: 'learning', label: 'Darslarim', icon: BookOpen },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 max-w-[416px] mx-auto z-40">
      <nav className="glass rounded-[26px] px-2 py-2 shadow-nav flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic.selection();
                onChangeTab(tab.id);
              }}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan/20 to-cyan/[0.07] border border-cyan/25"
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-[19px] h-[19px] transition-colors duration-200 ${isActive ? 'text-cyan' : 'text-ink-muted'}`}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                <span
                  className={`text-[9px] tracking-tight mt-0.5 transition-colors duration-200 ${
                    isActive ? 'font-bold text-cyan' : 'font-medium text-ink-muted'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
