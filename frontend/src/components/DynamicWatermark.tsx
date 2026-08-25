import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useAuth } from '../context/AuthContext';

interface DynamicWatermarkProps {
  variant?: 'video' | 'fullscreen';
}

const PRIMARY_POSITIONS = [
  { top: '12%', left: '10%', transform: 'translate(0, 0)' },
  { top: '15%', right: '12%', transform: 'translate(0, 0)' },
  { top: '48%', left: '14%', transform: 'translate(0, -50%)' },
  { top: '48%', right: '14%', transform: 'translate(0, -50%)' },
  { bottom: '22%', left: '12%', transform: 'translate(0, 0)' },
  { bottom: '20%', right: '12%', transform: 'translate(0, 0)' },
  { top: '28%', left: '42%', transform: 'translate(-50%, 0)' },
  { bottom: '38%', left: '55%', transform: 'translate(-50%, 0)' },
];

const SECONDARY_POSITIONS = [
  { bottom: '15%', right: '8%' },
  { top: '20%', left: '8%' },
  { bottom: '30%', left: '15%' },
  { top: '15%', right: '15%' },
];

export const DynamicWatermark: React.FC<DynamicWatermarkProps> = ({ variant = 'video' }) => {
  const { user: tgUser } = useTelegram();
  const { user: authUser } = useAuth();
  const [posIndex, setPosIndex] = useState(0);
  const [secIndex, setSecIndex] = useState(0);
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString());

  const activeUser = tgUser || authUser;
  const displayName = activeUser?.first_name || activeUser?.name || 'Talaba';
  const telegramId = activeUser?.id || activeUser?.telegram_id || 'ID: 8544023815';
  const username = activeUser?.username ? `@${activeUser.username}` : '';

  useEffect(() => {
    // Har 4.5 soniyada asosiy watermark pozitsiyasini o'zgartirish
    const interval = setInterval(() => {
      setPosIndex((prev) => (prev + 1) % PRIMARY_POSITIONS.length);
      setSecIndex((prev) => (prev + 1) % SECONDARY_POSITIONS.length);
      setTimestamp(new Date().toLocaleTimeString());
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const primaryPos = PRIMARY_POSITIONS[posIndex];
  const secondaryPos = SECONDARY_POSITIONS[secIndex];

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-30 select-none ${
        variant === 'fullscreen' ? 'fixed' : 'absolute'
      }`}
      aria-hidden="true"
    >
      {/* 1. Katta Diagonal Forensic Markaziy Watermark (Ekran yozib olinsa ham xira fonda o'chmas iz) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-18deg] select-none">
        <div className="text-center space-y-1">
          <div className="text-white font-mono text-sm sm:text-base font-extrabold tracking-widest uppercase">
            {displayName} · TG: {telegramId}
          </div>
          <div className="text-[10px] text-cyan-light font-mono tracking-widest opacity-80">
            MAXSUS SHIFRLANGAN DARSLIK · {username} · {timestamp}
          </div>
        </div>
      </div>

      {/* 2. Asosiy Dinamik Harakatlanuvchi Rangli Watermark */}
      <div
        className="absolute transition-all duration-1000 ease-in-out pointer-events-none"
        style={{
          ...primaryPos,
          opacity: 0.85,
        }}
      >
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-cyan/40 text-white font-mono text-[10px] sm:text-[11px] tracking-wider shadow-lg">
          <Shield className="w-3 h-3 text-cyan animate-pulse" />
          <span className="font-bold text-white">{displayName}</span>
          <span className="text-white/40">|</span>
          <span className="text-cyan font-extrabold">ID: {telegramId}</span>
          {username && (
            <>
              <span className="text-white/40">|</span>
              <span className="text-white/80">{username}</span>
            </>
          )}
          <span className="text-white/40">|</span>
          <span className="text-[9px] text-cyan-light font-bold">{timestamp}</span>
        </div>
      </div>

      {/* 3. Ikkinchi suzuvchi mikro chip (turli burchaklarda) */}
      <div
        className="absolute transition-all duration-1000 ease-in-out pointer-events-none opacity-50"
        style={secondaryPos}
      >
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-white/90 font-mono text-[8px]">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
          <span>MUALLIFLIK HIMOYASI: {telegramId}</span>
        </div>
      </div>

      {/* 4. Doimiy burchak xavfsizlik shtampi */}
      <div className="absolute top-2 left-2.5 opacity-40 text-[9px] font-mono text-white pointer-events-none flex items-center space-x-1 bg-black/40 px-2 py-0.5 rounded border border-white/10">
        <Lock className="w-2.5 h-2.5 text-cyan" />
        <span>SECURE STREAM · {telegramId}</span>
      </div>
    </div>
  );
};
