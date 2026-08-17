import React from 'react';
import { Smartphone, BookOpen, Sparkles } from 'lucide-react';

interface DesktopWrapperProps {
  children: React.ReactNode;
}

export const DesktopWrapper: React.FC<DesktopWrapperProps> = ({ children }) => {
  return (
    <div className="app-canvas">
      {/* Desktop Left Info Column */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm mr-12 text-[#0f172a] space-y-4">
        <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 w-max shadow-sm text-[#2563eb]">
          <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase">
            COURSE ACADEMY
          </span>
        </div>

        <h2 className="text-3xl font-extrabold text-[#0f172a] leading-tight">
          O‘quv Studiyasi
        </h2>

        <p className="text-xs text-[#64748b] leading-relaxed font-medium">
          Telegram Mini App uchun optimallashtirilgan eng qulay, tezkor va professional ta'lim platformasi.
        </p>

        <div className="flex items-center space-x-2 text-xs text-[#2563eb] font-semibold">
          <Smartphone className="w-4 h-4" />
          <span>Telegram WebView & mobil qurilmalarga to‘liq moslangan</span>
        </div>
      </div>

      {/* Mobile Device Frame */}
      <main className="app-frame" aria-label="Course Academy">
        {children}
      </main>
    </div>
  );
};
