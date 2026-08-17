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
    { id: 'learning', label: 'O‘quvlarim', icon: BookOpen },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 max-w-[416px] mx-auto z-40">
      <nav className="bg-white/95 backdrop-blur-xl rounded-[24px] py-2 px-2 shadow-nav border border-slate-100/90 flex items-center justify-around">
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
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                isActive ? 'text-[#2563eb]' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <div
                className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#64748b]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 ${
                  isActive ? 'font-bold text-[#2563eb]' : 'font-medium text-[#64748b]'
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
