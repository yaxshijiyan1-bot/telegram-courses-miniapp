import React, { useState } from 'react';
import { Lock, User, Send, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelegram } from '../context/TelegramContext';
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

    const result = await login(loginInput, passwordInput);
    setIsSubmitting(false);

    if (result.success) {
      haptic.notification('success');
      onSuccess();
    } else {
      setErrorMsg(result.error || 'Login yoki parol noto‘g‘ri. Qayta urinib ko‘ring.');
      haptic.notification('error');
    }
  };

  const handleTelegramAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    haptic.impact('medium');

    const result = await telegramLogin();
    setIsSubmitting(false);

    if (result.success) {
      haptic.notification('success');
      onSuccess();
    } else {
      setErrorMsg(result.error || 'Telegram orqali ulanishda xatolik yuz berdi');
      haptic.notification('error');
    }
  };

  return (
    <div className="flex-1 pb-24 px-6 pt-6 flex flex-col justify-between text-white animate-fade-up">
      <div className="space-y-6 max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#0D1117] border border-cyan/40 text-cyan flex items-center justify-center mx-auto shadow-cyanGlowSm">
            <Lock className="w-6 h-6 stroke-cyan" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Xush kelibsiz!</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Darslaringizga kirish uchun Telegram orqali avtorizatsiyadan o‘ting yoki login bilan kiring.
          </p>
        </div>

        {/* Telegram Fast Login Button */}
        <button
          onClick={handleTelegramAuth}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#24A1DE] text-white font-bold rounded-2xl shadow-soft hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm"
        >
          <Send className="w-4 h-4" />
          <span>Telegram orqali tezkor kirish</span>
        </button>

        {/* Divider */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            yoki login bilan
          </span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Direct Login Form */}
        <form onSubmit={handleDirectLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Login yoki Telefon</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Login yoki @username"
                className="w-full pl-10 pr-3.5 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Parol</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-3 bg-[#0D1117] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-cyan text-black font-black rounded-2xl shadow-cyanGlow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? (
              <InlineLoader variant="orbit" size={16} color="#000000" />
            ) : (
              <>
                <span>Kirish</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom CTA */}
      <div className="pt-6 text-center space-y-2">
        <p className="text-xs text-slate-500">Hali kurs xarid qilmadingizmi?</p>
        <button
          onClick={() => {
            haptic.impact('light');
            onExploreCourses();
          }}
          className="text-xs text-cyan font-bold hover:underline"
        >
          Kurslar katalogini ko‘rish →
        </button>
      </div>
    </div>
  );
};
