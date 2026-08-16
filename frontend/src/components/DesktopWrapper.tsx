import React from 'react';
import { Smartphone, Sparkles } from 'lucide-react';

interface DesktopWrapperProps {
  children: React.ReactNode;
}

export const DesktopWrapper: React.FC<DesktopWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#020305] flex items-center justify-center p-0 md:p-6 font-sans">
      {/* Desktop Background Ambient Cyan Decor */}
      <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[140px]" />
      </div>

      {/* Desktop Side Info Banner */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm mr-12 text-white z-10 space-y-4">
        <div className="inline-flex items-center space-x-2 glass-panel px-3.5 py-1.5 rounded-2xl border border-cyan/30 w-max shadow-cyanGlowSm">
          <div className="w-2 h-2 rounded-full bg-cyan" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-cyan">
            COURSE ACADEMY
          </span>
        </div>
        <h2 className="text-3xl font-black text-white leading-tight">
          2026 Premium EdTech Platforma
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-normal">
          Ushbu platforma Telegram ichida eng tezkor va qulay tarzda premium ta‘lim olish uchun maxsus ishlab chiqilgan.
        </p>

        <div className="flex items-center space-x-2.5 text-xs text-slate-400">
          <Smartphone className="w-4 h-4 text-cyan" />
          <span>Telegram Mini App & Mobil WebView uchun optimallashtirilgan</span>
        </div>
      </div>

      {/* Mobile Screen Shell Frame */}
      <div className="w-full md:max-w-[430px] min-h-screen md:min-h-[860px] md:max-h-[920px] bg-[#05070A] md:rounded-[44px] shadow-2xl md:border-[6px] md:border-[#11161D] overflow-hidden relative flex flex-col z-20">
        {/* Notch Simulation */}
        <div className="hidden md:flex justify-center pt-2.5 pb-1 bg-transparent absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="w-24 h-3.5 bg-black rounded-full border border-white/10" />
        </div>

        {/* The App Content */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-[#05070A]">
          {children}
        </div>
      </div>
    </div>
  );
};
