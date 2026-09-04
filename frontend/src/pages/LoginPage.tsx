import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Send, ArrowRight, AlertCircle, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';
import { InlineLoader } from 'generative-loaders';

interface LoginPageProps {
  onSuccess: () => void;
  onExploreCourses: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onExploreCourses
}) => {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, telegramLogin } = useAuth();
  const { haptic } = useTelegram();
  const { t } = useSettings();

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !passwordInput) {
      setErrorMsg(t('Iltimos, login va parolni to‘ldiring'));
      haptic?.notification?.('warning');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    haptic?.impact?.('medium');

    const result = await login(loginInput, passwordInput);
    setIsSubmitting(false);

    if (result.success) {
      haptic?.notification?.('success');
      onSuccess();
    } else {
      setErrorMsg(result.error || t('Login yoki parol noto‘g‘ri. Qayta urinib ko‘ring.'));
      haptic?.notification?.('error');
    }
  };

  const handleTelegramAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    haptic?.impact?.('medium');

    const result = await telegramLogin();
    setIsSubmitting(false);

    if (result.success) {
      haptic?.notification?.('success');
      onSuccess();
    } else {
      setErrorMsg(result.error || t('Telegram orqali ulanishda xatolik yuz berdi'));
      haptic?.notification?.('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 pb-28 px-6 pt-10 flex flex-col justify-between text-ink"
    >
      <div className="space-y-6 max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-16 h-16 rounded-[20px] mx-auto glass border border-cyan/25 text-cyan flex items-center justify-center shadow-cyanGlowSm"
          >
            <GraduationCap className="w-7 h-7" strokeWidth={2} />
          </motion.div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">{t('Xush kelibsiz!')}</h1>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {t('Darslaringizga kirish uchun Telegram orqali avtorizatsiyadan o‘ting yoki login bilan kiring.')}
            </p>
          </div>
        </div>

        {/* Telegram login */}
        <motion.button
          onClick={handleTelegramAuth}
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 bg-[#24A1DE] text-white font-bold rounded-2xl shadow-soft hover:opacity-90 transition-all flex items-center justify-center space-x-2 text-sm"
        >
          <Send className="w-4 h-4" />
          <span>{t('Telegram orqali tezkor kirish')}</span>
        </motion.button>

        {/* Divider */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
            {t('yoki login bilan')}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Error */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/25 text-red-300 rounded-2xl text-[11px]"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Login form */}
        <form onSubmit={handleDirectLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-ink-secondary">{t('Login yoki telefon')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder={t('Login yoki @username')}
                className="field !pl-11"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-ink-secondary">{t('Parol')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="field !pl-11"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl shadow-cyanGlow flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <InlineLoader variant="orbit" size={16} color="#FFFFFF" />
            ) : (
              <>
                <span>{t('Kirish')}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Bottom */}
      <div className="pt-6 text-center space-y-2">
        <p className="text-xs text-ink-muted">{t('Hali kurs xarid qilmadingizmi?')}</p>
        <button
          onClick={() => {
            haptic?.impact?.('light');
            onExploreCourses();
          }}
          className="text-xs text-cyan font-bold hover:underline"
        >
          {t('Kurslar katalogini ko‘rish →')}
        </button>
      </div>
    </motion.div>
  );
};
