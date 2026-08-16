import React from 'react';
import { Smartphone, Sparkles } from 'lucide-react';

interface DesktopWrapperProps {
  children: React.ReactNode;
}

export const DesktopWrapper: React.FC<DesktopWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#082C24] flex items-center justify-center p-0 md:p-6 lg:p-8 font-sans">
      {/* Desktop Background Ambient Decor */}
      <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px]" />
      </div>

      {/* Desktop Side Info Banner (only for wide screens) */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm mr-12 text-white z-10">
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-max mb-4">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Telegram Mini App
          </span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-brand-cream leading-tight">
          Premium Kurslar va Shaxsiy Kabinet
        </h2>
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          Ushbu platforma Telegram ichida eng tezkor va qulay tarzda premium ta'lim olish uchun optimallashtirilgan.
        </p>

        <div className="mt-6 flex items-center space-x-3 text-xs text-white/60">
          <Smartphone className="w-4 h-4 text-brand-emerald" />
          <span>Mobil qurilma va Telegram WebView uchun moslangan</span>
        </div>
      </div>

      {/* Mobile Screen Shell Frame */}
      <div className="w-full md:max-w-[430px] min-h-screen md:min-h-[860px] md:max-h-[920px] bg-brand-cream md:rounded-[40px] shadow-2xl md:border-[8px] md:border-black/40 overflow-hidden relative flex flex-col z-20">
        {/* Mobile Speaker / Camera Notch simulation on desktop */}
        <div className="hidden md:flex justify-center pt-2 pb-1 bg-transparent absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="w-28 h-4 bg-black/80 rounded-full" />
        </div>

        {/* The App Content */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  );
};
