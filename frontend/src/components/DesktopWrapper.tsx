import React from 'react';
import { Smartphone, GraduationCap } from 'lucide-react';

interface DesktopWrapperProps {
  children: React.ReactNode;
}

export const DesktopWrapper: React.FC<DesktopWrapperProps> = ({ children }) => {
  return (
    <div className="app-canvas">
      {/* Desktop Left Info Column */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm mr-12 text-ink space-y-5">
        <div className="inline-flex items-center space-x-2 glass-chip px-3.5 py-1.5 rounded-full w-max text-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
          <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase">
            Kreativ AI
          </span>
        </div>

        <h2 className="text-4xl font-extrabold text-ink leading-tight tracking-tight">
          O‘quv studiyasi —<br />
          <em className="serif-accent">suyuq shisha.</em>
        </h2>

        <p className="text-xs text-ink-secondary leading-relaxed font-medium max-w-xs">
          Telegram Mini App uchun optimallashtirilgan eng qulay, tezkor va professional ta'lim platformasi. 2026 standartlari: Toza oq fon, Liquid Glass qatlamlar va silliq spring animatsiyalar.
        </p>

        <div className="flex items-center space-x-2 text-xs text-cyan font-semibold">
          <Smartphone className="w-4 h-4" />
          <span>Telegram WebView & mobil qurilmalarga to‘liq moslangan</span>
        </div>

        <div className="flex items-center space-x-2.5 pt-2">
          <div className="w-11 h-11 rounded-2xl glass flex items-center justify-center text-cyan">
            <GraduationCap className="w-5 h-5" strokeWidth={2} />
          </div>
          <p className="text-xs font-medium text-slate-400 leading-relaxed font-sans">
            Amaliy kurslar · Xavfsiz to‘lov<br />
            Telegram Mini App orqali qulay ta’lim.
          </p>
        </div>
      </div>

      {/* Mobile Device Frame */}
      <main className="app-frame" aria-label="Kreativ AI">
        {children}
      </main>
    </div>
  );
};
