import React, { useState } from 'react';
import { Lock, User, Send, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';

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

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !passwordInput) {
      setErrorMsg('Iltimos, login va parolni to‘ldiring');
      haptic.notification('warning');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    haptic.impact('medium');

    const ok = await login(loginInput, passwordInput);
    setIsSubmitting(false);

    if (ok) {
      haptic.notification('success');
      onSuccess();
    } else {
      setErrorMsg('Login yoki parol noto‘g‘ri. Qayta urinib ko‘ring.');
      haptic.notification('error');
    }
  };

  const handleTelegramAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    haptic.impact('medium');

    const ok = await telegramLogin();
    setIsSubmitting(false);

    if (ok) {
      haptic.notification('success');
      onSuccess();
    } else {
      setErrorMsg('Telegram orqali ulanishda xatolik yuz berdi');
    }
  };

  return (
    <div className="flex-1 pb-safe px-6 pt-6 flex flex-col justify-between animate-in fade-in duration-200">
      <div className="space-y-6 max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-mint text-brand-emerald flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Xush kelibsiz!</h1>
          <p className="text-xs text-brand-secondary leading-relaxed">
            Kurslaringizga kirish uchun login va parolingizni kiriting yoki Telegram orqali kiring.
          </p>
        </div>

        {/* Telegram Fast Login Button */}
        <button
          onClick={handleTelegramAuth}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#24A1DE] text-white font-bold rounded-2xl shadow-sm hover:bg-[#1E8BC0] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm"
        >
          <Send className="w-4 h-4" />
          <span>Telegram orqali tezkor kirish</span>
        </button>

        {/* Divider */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
            yoki login bilan
          </span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDirectLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark">Login yoki Telefon</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Masalan: abdurahmon_dev"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-input text-xs sm:text-sm text-brand-text focus:outline-none focus:border-brand-emerald shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-input text-xs sm:text-sm text-brand-text focus:outline-none focus:border-brand-emerald shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-brand-secondary pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-brand-emerald focus:ring-brand-emerald" />
              <span>Meni eslab qol</span>
            </label>
            <button type="button" className="text-brand-emerald font-semibold hover:underline">
              Parolni unutdingizmi?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-brand-emerald text-white font-bold rounded-2xl shadow-elevated hover:bg-brand-deep active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-75"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Option */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-brand-secondary">
          Kurs hali sizniki emasmi?{' '}
          <button
            onClick={() => {
              haptic.impact('light');
              onExploreCourses();
            }}
            className="text-brand-emerald font-bold hover:underline"
          >
            Kurslarni ko‘rish
          </button>
        </p>
      </div>
    </div>
  );
};
