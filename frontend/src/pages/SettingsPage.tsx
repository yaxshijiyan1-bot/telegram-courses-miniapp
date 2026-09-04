import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Languages,
  Bell,
  Sparkles,
  CreditCard,
  Percent,
  Trash2,
  Check,
  GraduationCap,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { Theme, Lang } from '../context/SettingsContext';
import { useTelegram } from '../context/TelegramContext';

interface SettingsPageProps {
  onBack: () => void;
}

// Kesh kalitlari — faqat shular tozalanadi. Auth token va sozlamalar
// saqlanib qoladi: foydalanuvchi chiqib ketmaydi, imtiyozlar yo'qolmaydi.
const CACHE_KEYS = ['banners_cache_v1', 'purchased_course_ids'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 26 } },
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-[10.5px] font-extrabold text-ink-muted tracking-[0.12em] uppercase px-1 pb-2">
    {title}
  </div>
);

const SettingRow: React.FC<{
  icon: React.ReactNode;
  tint?: 'cyan' | 'violet' | 'gold';
  title: string;
  control: React.ReactNode;
  first?: boolean;
}> = ({ icon, tint, title, control, first }) => (
  <div
    className={`px-4 py-3 flex items-center gap-3 ${first ? '' : 'border-t'}`}
    style={{ borderColor: first ? undefined : 'var(--soft-border)' }}
  >
    <div
      className={`w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0 ${
        tint === 'cyan'
          ? 'bg-cyan/10 text-cyan'
          : tint === 'violet'
            ? 'bg-violet/10 text-violet'
            : tint === 'gold'
              ? 'bg-gold/10 text-gold'
              : 'bg-cyan/10 text-cyan'
      }`}
    >
      {icon}
    </div>
    <div className="flex-1 text-[13px] font-bold text-ink tracking-[-0.005em]">{title}</div>
    {control}
  </div>
);

const SegmentedControl: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; icon?: React.ReactNode }[];
}> = ({ value, onChange, options }) => (
  <div className="inline-flex rounded-[10px] p-[3px]" style={{ background: 'var(--surface-sunken)' }}>
    {options.map((opt) => {
      const active = value === opt.id;
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold inline-flex items-center gap-1 transition-all duration-200"
          style={{
            background: active ? 'var(--seg-active-bg)' : 'transparent',
            color: active ? 'var(--seg-active-text)' : 'var(--ink-muted)',
            boxShadow: active ? 'var(--seg-active-shadow)' : 'none',
          }}
        >
          {opt.icon}
          {opt.label}
        </button>
      );
    })}
  </div>
);

const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    className="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
    style={{ background: on ? '#0284C7' : '#CBD5E1' }}
  >
    <span
      className="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-200"
      style={{ left: on ? 18 : 2, boxShadow: '0 2px 4px rgba(15,23,42,0.15)' }}
    />
  </button>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme, setTheme, lang, setLang, notif, setNotif, t } = useSettings();
  const { haptic } = useTelegram();
  const [cleared, setCleared] = useState(false);

  const clearCache = () => {
    try {
      CACHE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {}
    haptic?.impact?.('light');
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-[100dvh] w-full bg-white dark-scope flex flex-col"
    >
      {/* Sarlavha paneli */}
      <div className="pt-safe px-4 py-3 flex items-center justify-between relative z-10">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl glass-chip flex items-center justify-center text-ink pressable"
        >
          <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2.2} />
        </button>
        <div className="text-[15px] font-extrabold text-ink tracking-[-0.02em]">
          {t('Sozlamalar')}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-1 pb-24">
        {/* ===== Ko'rinish ===== */}
        <motion.div variants={item} className="mb-5">
          <SectionHeader title={t("Ko'rinish")} />
          <div
            className="glass rounded-[20px] overflow-hidden"
          >
            <SettingRow
              icon={<Sparkles className="w-4 h-4" strokeWidth={2.2} />}
              tint="cyan"
              title={t('Mavzu')}
              first
              control={
                <SegmentedControl
                  value={theme}
                  onChange={(v) => { setTheme(v as Theme); haptic?.selection?.(); }}
                  options={[
                    { id: 'light', label: t('Kunduzgi'), icon: <Sun className="w-3 h-3" strokeWidth={2.4} /> },
                    { id: 'dark', label: t('Tungi'), icon: <Moon className="w-3 h-3" strokeWidth={2.4} /> },
                  ]}
                />
              }
            />
            <SettingRow
              icon={<Languages className="w-4 h-4" strokeWidth={2.2} />}
              title={t('Til')}
              control={
                <SegmentedControl
                  value={lang}
                  onChange={(v) => { setLang(v as Lang); haptic?.selection?.(); }}
                  options={[
                    { id: 'lat', label: t('Lotin') },
                    { id: 'cyr', label: t('Kirill') },
                  ]}
                />
              }
            />
          </div>
        </motion.div>

        {/* ===== Bildirishnomalar ===== */}
        <motion.div variants={item} className="mb-5">
          <SectionHeader title={t('Bildirishnomalar')} />
          <div className="glass rounded-[20px] overflow-hidden">
            <SettingRow
              icon={<Bell className="w-4 h-4" strokeWidth={2.2} />}
              tint="cyan"
              title={t('Yangi kurslar')}
              first
              control={<Switch on={notif.new} onChange={(v) => { setNotif({ ...notif, new: v }); haptic?.selection?.(); }} />}
            />
            <SettingRow
              icon={<CreditCard className="w-4 h-4" strokeWidth={2.2} />}
              title={t("To'lov holati")}
              control={<Switch on={notif.pay} onChange={(v) => { setNotif({ ...notif, pay: v }); haptic?.selection?.(); }} />}
            />
            <SettingRow
              icon={<Percent className="w-4 h-4" strokeWidth={2.2} />}
              title={t('Chegirmalar')}
              control={<Switch on={notif.promo} onChange={(v) => { setNotif({ ...notif, promo: v }); haptic?.selection?.(); }} />}
            />
          </div>
        </motion.div>

        {/* ===== Ma'lumotlar ===== */}
        <motion.div variants={item} className="mb-5">
          <SectionHeader title={t("Ma'lumotlar")} />
          <div className="glass rounded-[20px] overflow-hidden">
            <SettingRow
              icon={<Trash2 className="w-4 h-4" strokeWidth={2.2} />}
              title={t('Keshni tozalash')}
              first
              control={
                <button
                  type="button"
                  onClick={clearCache}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-all duration-200"
                  style={{
                    color: cleared ? '#059669' : '#0284C7',
                    background: cleared ? 'rgba(5,150,105,0.08)' : 'rgba(2,132,199,0.08)',
                  }}
                >
                  {cleared ? (
                    <>
                      <Check className="w-3 h-3" strokeWidth={2.6} />
                      {t('Tozalandi')}
                    </>
                  ) : (
                    t('Tozalash')
                  )}
                </button>
              }
            />
          </div>
        </motion.div>

        {/* ===== Ilova haqida ===== */}
        <motion.div variants={item}>
          <SectionHeader title={t('Ilova haqida')} />
          <div className="glass rounded-[20px] p-4 text-center">
            <div
              className="w-11 h-11 rounded-[14px] mx-auto mb-2.5 inline-flex items-center justify-center text-cyan"
              style={{ background: 'linear-gradient(135deg, rgba(2,132,199,0.15), rgba(56,189,248,0.20))' }}
            >
              <GraduationCap className="w-[22px] h-[22px]" strokeWidth={2} />
            </div>
            <div className="text-sm font-extrabold text-ink tracking-[-0.01em]">Kreativ AI</div>
            <div className="text-[10.5px] text-ink-muted font-medium mt-0.5">
              {t('Versiya')} 1.0.0 · 2026
            </div>
            <div className="text-[10px] text-ink-muted font-medium mt-1.5">
              <em className="serif-accent">{t('bilim qiymatga aylanadi')}</em>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
