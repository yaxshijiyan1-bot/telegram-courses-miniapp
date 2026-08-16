import React from 'react';
import { Smartphone, Sparkles } from 'lucide-react';

interface DesktopWrapperProps {
  children: React.ReactNode;
}

export const DesktopWrapper: React.FC<DesktopWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-0 md:p-6 font-sans">
      {/* Desktop Background Ambient Neon Decor */}
      <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#B4F523]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#B4F523]/5 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Side Info Banner (only for wide screens) */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm mr-12 text-white z-10 space-y-4">
        <div className="inline-flex items-center space-x-2 bg-[#131318] px-3 py-1.5 rounded-2xl border border-white/5 w-max">
          <Sparkles className="w-4 h-4 text-[#B4F523]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#B4F523]">
            TELEGRAM MINI APP
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white leading-tight">
          Premium Kurslar va Shaxsiy Kabinet
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Ushbu platforma Telegram ichida eng tezkor va qulay tarzda premium ta'lim olish uchun optimallashtirilgan.
        </p>

        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          <Smartphone className="w-4 h-4 text-[#B4F523]" />
          <span>Mobil qurilma va Telegram WebView uchun to'liq moslangan</span>
        </div>
      </div>

      {/* Mobile Screen Shell Frame */}
      <div className="w-full md:max-w-[430px] min-h-screen md:min-h-[860px] md:max-h-[920px] bg-[#09090C] md:rounded-[44px] shadow-2xl md:border-[6px] md:border-[#1E1E26] overflow-hidden relative flex flex-col z-20">
        {/* Mobile Speaker / Camera Notch simulation on desktop */}
        <div className="hidden md:flex justify-center pt-2.5 pb-1 bg-transparent absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="w-28 h-4 bg-black rounded-full border border-white/10" />
        </div>

        {/* The App Content */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-[#09090C]">
          {children}
        </div>
      </div>
    </div>
  );
};
