import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Trophy, GraduationCap } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';

interface SplashPageProps {
  onStart: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const { haptic } = useTelegram();
  const { t } = useSettings();

  const handleStart = () => {
    haptic?.impact?.('medium');
    onStart();
  };

  return (
    <div
      className="min-h-screen flex-1 flex flex-col text-slate-900 select-none relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFCFE 100%)' }}
    >
      {/* Ambient glows */}
      <div className="blob blob-cyan absolute -top-32 -left-24 w-80 h-80 pointer-events-none" />
      <div className="blob blob-violet absolute -bottom-36 -right-24 w-96 h-96 pointer-events-none" />

      {/* Nozik grid nuqtalar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(2,132,199,0.055) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 68%)',
        }}
      />

      {/* Yuqori brend pill */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
        className="pt-safe flex justify-center relative z-10"
      >
        <div className="mt-5 inline-flex items-center space-x-2 px-3.5 py-[7px] rounded-full glass-chip">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-glow" />
          <span className="text-[10px] font-extrabold tracking-[0.20em] uppercase text-cyan">
            Kreativ AI
          </span>
        </div>
      </motion.div>

      {/* Markaziy hero */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-[5] min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.2 }}
          className="relative w-[300px] max-w-full h-[220px] flex items-center justify-center mb-5"
        >
          {/* Hero ortidagi radial nur */}
          <div
            className="absolute -inset-5"
            style={{
              background:
                'radial-gradient(circle at 50% 55%, rgba(2,132,199,0.22) 0%, rgba(56,189,248,0.08) 40%, transparent 68%)',
            }}
          />

          {/* Suzuvchi chip — chap yuqori */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.7 }}
            className="absolute -left-4 -top-1 z-[3]"
          >
            <div
              className="animate-floaty bg-white border border-slate-900/[0.06] rounded-[14px] px-3 py-2 flex items-center gap-1.5"
              style={{ boxShadow: '0 12px 30px -12px rgba(2,132,199,0.28)', animationDelay: '0.4s' }}
            >
              <span className="w-[22px] h-[22px] rounded-lg bg-cyan/10 text-cyan inline-flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3" strokeWidth={2.2} />
              </span>
              <span className="text-left">
                <span className="block text-[9px] text-slate-500 font-semibold leading-none">{t('AI-yordamchi')}</span>
                <span className="block text-[11px] text-slate-900 font-extrabold tracking-[-0.01em] mt-0.5">{t('Real amaliyot')}</span>
              </span>
            </div>
          </motion.div>

          {/* Suzuvchi chip — o'ng past */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: EASE, delay: 0.85 }}
            className="absolute -right-2.5 bottom-[26px] z-[3]"
          >
            <div
              className="animate-floaty bg-white border border-slate-900/[0.06] rounded-[14px] px-3 py-2 flex items-center gap-1.5"
              style={{ boxShadow: '0 12px 30px -12px rgba(124,58,237,0.28)', animationDelay: '1.1s' }}
            >
              <span className="w-[22px] h-[22px] rounded-lg bg-violet/10 text-violet inline-flex items-center justify-center shrink-0">
                <Trophy className="w-3 h-3" strokeWidth={2.2} />
              </span>
              <span className="text-left">
                <span className="block text-[9px] text-slate-500 font-semibold leading-none">9 000+</span>
                <span className="block text-[11px] text-slate-900 font-extrabold tracking-[-0.01em] mt-0.5">{t('obunachi')}</span>
              </span>
            </div>
          </motion.div>

          {/* Hero rasm — o'z maxsus 3D rasmlarimiz */}
          <img
            src="/images/splash_hero_v2.webp"
            alt=""
            draggable={false}
            className="animate-floaty relative z-[2] w-full h-full object-contain pointer-events-none"
            style={{ filter: 'drop-shadow(0 20px 30px rgba(15,23,42,0.15))' }}
          />
        </motion.div>

        {/* Sarlavha */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.28 }}
          className="text-center max-w-[300px]"
        >
          <h1 className="text-[34px] font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.05]">
            {t('Foydali bilimlar.')}
            <br />
            <em className="serif-accent text-cyan text-[35px]">{t('Bitta mini-ilovada.')}</em>
          </h1>
          <p className="text-[13.5px] text-slate-600 leading-[1.55] font-medium mt-3.5 tracking-[-0.005em]">
            {t("AI, dizayn va SMM bo'yicha amaliy kurslar — Telegram ichida, o'zbek tilida.")}
          </p>
        </motion.div>

        {/* Ustozlar qatori — real rasmlar */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.4 }}
          className="mt-[22px] flex items-center gap-2.5 pl-3 pr-4 py-2.5 bg-white border border-slate-900/5 rounded-full"
          style={{ boxShadow: '0 8px 24px -12px rgba(15,23,42,0.08)' }}
        >
          <span className="flex">
            <img
              src="/images/ustoz_zuhra_olimova.webp"
              alt="Zuhra Olimova"
              className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover object-top"
            />
            <img
              src="/images/ustoz_yaxshi_bola.webp"
              alt="Yaxshi Bola"
              className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover object-top -ml-2.5"
            />
          </span>
          <span className="text-[11.5px] text-slate-600 font-semibold leading-[1.3]">
            <span className="text-slate-900 font-extrabold">{t('2 amaliyotchi ustoz')}</span>
            <br />
            {t("sizga yo'lni ko'rsatadi")}
          </span>
        </motion.div>
      </div>

      {/* Pastki CTA */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE, delay: 0.55 }}
        className="px-5 pb-safe relative z-10"
      >
        <motion.button
          type="button"
          onClick={handleStart}
          whileTap={{ scale: 0.97 }}
          className="w-full py-[17px] px-[22px] bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl text-[15.5px] flex items-center justify-center space-x-2 shadow-cyanGlow"
        >
          <GraduationCap className="w-[18px] h-[18px]" strokeWidth={2.2} />
          <span>{t('Boshlash')}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.4]" />
        </motion.button>
        <p className="text-center mt-3 mb-[10px] text-[10.5px] text-slate-400 font-semibold tracking-[0.02em]">
          <em className="serif-accent text-slate-500 text-xs mr-1">{t('bilim qiymatga aylanadi')}</em>
          · Kreativ AI 2026
        </p>
      </motion.div>
    </div>
  );
};
