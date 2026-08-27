import React from 'react';
import { Home, Compass, BookOpen, User } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

export type NavTab = 'home' | 'courses' | 'learning' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isAuthenticated: boolean;
}

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
    <div
      className="flex-shrink-0 relative z-30 w-full px-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <nav className="max-w-[420px] mx-auto bg-white/92 backdrop-blur-2xl rounded-[26px] p-1.5 shadow-xl border border-slate-200/90 flex items-center justify-between">
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
              className="flex-1 flex flex-col items-center justify-center py-0.5 active:scale-95 transition-transform"
            >
              {/* Symmetrical Uniform Bubble Icon Container */}
              <div
                className={`w-11 h-7 sm:w-12 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/35 text-cyan shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon
                  className="w-[18px] h-[18px]"
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              </div>

              {/* Tab Text Label */}
              <span
                className={`text-[9.5px] tracking-tight mt-0.5 transition-colors duration-200 ${
                  isActive
                    ? 'font-bold text-cyan'
                    : 'font-medium text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
