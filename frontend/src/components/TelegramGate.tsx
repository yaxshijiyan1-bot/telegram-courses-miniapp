import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, Lock, Smartphone, ExternalLink, Code2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TelegramGateProps {
  children: React.ReactNode;
}

export const TelegramGate: React.FC<TelegramGateProps> = ({ children }) => {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);
  const [devBypass, setDevBypass] = useState<boolean>(false);

  useEffect(() => {
    // 1. URL parametrlari va Telegram muhitini tekshirish
    const hasTgParam = window.location.hash.includes('tgWebAppData') || 
                       window.location.search.includes('tgWebAppData') ||
                       window.location.search.includes('tgWebAppVersion');

    const tg = (window as any).Telegram?.WebApp;
    const hasInitData = Boolean(tg?.initData && tg.initData.length > 0);
    const hasTgUser = Boolean(tg?.initDataUnsafe?.user?.id);
    const hasProxy = Boolean((window as any).TelegramWebviewProxy || (window as any).TelegramGameProxy);

    // Dev bypass tekshiruvi (faqat dasturchilar test qilishi uchun)
    const isDevMode = import.meta.env.DEV || window.location.search.includes('dev=true');

    if (hasInitData || hasTgUser || hasProxy || hasTgParam) {
      setIsTelegram(true);
    } else if (isDevMode) {
      // Localhost/dev rejimida avtomatik yoki tugma orqali ruxsat berish
      setIsTelegram(false);
    } else {
      setIsTelegram(false);
    }
  }, []);

  if (isTelegram === null) {
    // Muhit aniqlanmoqda
    return (
      <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  // Telegram ichida bo'lsa yoki dasturchi bypass qilgan bo'lsa ilovani ochamiz
  if (isTelegram || devBypass) {
    return (
      <>
        {devBypass && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-300 px-3 py-1 text-[10px] font-mono flex items-center justify-between z-50">
            <span className="flex items-center space-x-1">
              <Code2 className="w-3 h-3" />
              <span>Dasturchi rejimi: Telegram Gate cheklovi chetlab o'tildi</span>
            </span>
            <button
              onClick={() => setDevBypass(false)}
              className="underline font-bold hover:text-white"
            >
              Qaytarish
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  const botUsername = 'kurslarimizbot'; // default bot username

  // Tashqi brauzerda ochilganda Xavfsizlik ekrani
  return (
    <div className="min-h-screen bg-[#05070A] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 text-center space-y-6 relative shadow-2xl z-10"
      >
        {/* Shield Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan/20 to-blue-500/20 border border-cyan/30 flex items-center justify-center shadow-cyanGlow">
          <ShieldCheck className="w-10 h-10 text-cyan animate-pulse" strokeWidth={2.2} />
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#05070A] border border-cyan flex items-center justify-center">
            <Lock className="w-3 h-3 text-cyan-light" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/25 text-cyan text-[10px] font-extrabold uppercase tracking-widest">
            <Smartphone className="w-3 h-3" />
            <span>Telegram WebApp Only</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Faqat Telegram orqali<br />kirish mumkin
          </h1>

          <p className="text-xs text-white/65 leading-relaxed max-w-xs mx-auto">
            Ushbu platforma, videodarslar va mualliflik materiallari faqat rasmiy Telegram boti orqali himoyalangan holda ochilishi uchun maxsus sozlangan.
          </p>
        </div>

        {/* Protection Badges */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-medium text-white/80">
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>HMAC-SHA256 Auth</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
            <span>Anti-Screen Record</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-gradient-to-r from-[#24A1DE] to-cyan text-white font-extrabold rounded-2xl shadow-cyanGlow flex items-center justify-center space-x-2 text-sm active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" />
            <span>Telegram Botni Ochish</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>

          {/* Dasturchilar uchun local dev bypass */}
          {import.meta.env.DEV && (
            <button
              onClick={() => setDevBypass(true)}
              className="text-[11px] text-white/40 hover:text-white/80 transition-colors flex items-center justify-center space-x-1 mx-auto pt-2"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Dasturchi rejimida ko'rish (Dev Bypass)</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Footer copyright */}
      <div className="mt-8 text-[11px] text-white/40 font-mono text-center">
        COURSE ACADEMY SECURE PLATFORM © 2026
      </div>
    </div>
  );
};
