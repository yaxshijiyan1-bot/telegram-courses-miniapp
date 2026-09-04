import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  TicketPercent,
  Wallet,
} from 'lucide-react';
import { Course } from '../types';
import { api, toMediaUrl } from '../services/api';
import { useTelegram } from '../context/TelegramContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/format';
import { InlineLoader } from 'generative-loaders';

interface CheckoutModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (course: Course) => void;
}

const ease = [0.32, 0.72, 0, 1] as const;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cardInfo, setCardInfo] = useState<{ card_number: string; card_holder: string; bank_name?: string }>({
    card_number: '',
    card_holder: '',
    bank_name: ''
  });
  // Promokod holati
  const [promoInput, setPromoInput] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoInfo, setPromoInfo] = useState<{ code: string; percent: number; final_price: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  // Hamyon holati
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const { haptic, user } = useTelegram();
  const { t } = useSettings();

  useEffect(() => {
    api.getPaymentInfo().then(info => {
      if (info && info.card_number) {
        setCardInfo({
          card_number: info.card_number,
          card_holder: info.card_holder,
          bank_name: info.bank_name || 'Uzcard / Humo'
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReceiptImage(null);
      setIsSubmitted(false);
      setErrorMsg('');
      setCopied(false);
      setPromoInput('');
      setPromoInfo(null);
      setPromoError('');
      setUseWallet(false);
      setWalletInput('');
      api.getWallet().then(w => {
        const b = w.balance || 0;
        setWalletBalance(b);
        // Balans bo'lsa avtomatik yoqamiz va butun balansni belgilaymiz —
        // foydalanuvchi istagan summagacha kamlitishi mumkin
        setUseWallet(b > 0);
        setWalletInput(b > 0 ? String(b) : '');
      }).catch(() => setWalletBalance(0));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cardNumber = cardInfo.card_number;

  const handleCopyCard = () => {
    haptic?.impact?.('light');
    navigator.clipboard.writeText(cardNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        haptic?.notification?.('success');
      };
      reader.readAsDataURL(file);
    }
  };

  // "Birinchi N kishi" chegirmasi faol bo'lsa — asos narx; promokod ustiga qo'shiladi
  const basePrice = course.discount_active && course.final_price != null && course.final_price < course.price
    ? course.final_price
    : course.price;
  const promoPrice = promoInfo ? promoInfo.final_price : basePrice;
  const hasPromo = !!promoInfo;
  // Hamyon: foydalanuvchi belgilagan summa (balans va to'lanadigan summa bilan cheklangan)
  const walletMax = Math.min(walletBalance, promoPrice);
  const walletSpend = useWallet ? Math.max(0, Math.min(parseInt(walletInput) || 0, walletMax)) : 0;
  const finalPrice = promoPrice - walletSpend;

  // Promokod qo'llanganda wallet summasi yangi chegaraga sig'ishi kerak
  React.useEffect(() => {
    const cur = parseInt(walletInput) || 0;
    if (cur > walletMax) setWalletInput(String(walletMax));
    if (cur < walletMax && cur === walletBalance) setWalletInput(String(walletMax));
  }, [promoPrice, walletBalance]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code || promoApplying) return;
    setPromoApplying(true);
    setPromoError('');
    haptic?.impact?.('light');
    try {
      const res = await api.validatePromo(code, course.id);
      if (res.valid && res.code && res.percent != null && res.final_price != null) {
        setPromoInfo({ code: res.code, percent: res.percent, final_price: res.final_price });
        haptic?.notification?.('success');
      } else {
        setPromoInfo(null);
        setPromoError(res.message || t('Promokod yaroqsiz'));
        haptic?.notification?.('error');
      }
    } catch (e: any) {
      setPromoInfo(null);
      setPromoError(e?.message || t('Promokod yaroqsiz'));
      haptic?.notification?.('error');
    } finally {
      setPromoApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoInfo(null);
    setPromoInput('');
    setPromoError('');
    haptic?.impact?.('light');
  };

  const handleSubmitReceipt = async () => {
    if (finalPrice > 0 && !receiptImage) {
      setErrorMsg(t("Iltimos, avval to‘lov cheki skrinshotini yuklang!"));
      haptic?.notification?.('error');
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');
    haptic?.impact?.('heavy');

    try {
      await api.submitReceipt({
        course_id: course.id,
        course_title: course.title,
        amount: finalPrice,
        payment_method: finalPrice === 0 && walletSpend > 0 ? 'hamyon' : 'karta',
        receipt_image: receiptImage || undefined,
        student_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Talaba',
        username: user?.username || 'user',
        telegram_id: user?.id || 0,
        promo_code: promoInfo?.code || undefined,
        wallet_amount: walletSpend > 0 ? walletSpend : undefined,
        use_wallet: walletSpend > 0 ? undefined : false
      });

      haptic?.notification?.('success');
      setIsSubmitted(true);

      setTimeout(() => {
        onSuccess(course);
        onClose();
      }, 2200);

    } catch (err: any) {
      setErrorMsg(err.message || t('Chekni yuborishda xatolik yuz berdi'));
      haptic?.notification?.('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 animate-in dark-scope">
      <div className="w-full max-w-md glass-deep !rounded-t-[28px] sm:!rounded-[28px] text-ink shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-sheet relative">

        {/* Modal Header */}
        <div className="sticky top-0 z-10 glass-deep !rounded-t-[28px] flex items-center justify-between p-4 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            {step === 2 && !isSubmitted && (
              <button
                onClick={() => { haptic?.impact?.('light'); setStep(1); setErrorMsg(''); }}
                className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary active:scale-90 transition-transform"
                aria-label={t('Orqaga')}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan flex items-center justify-center">
              <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-ink leading-tight">{t('Xavfsiz to‘lov')}</h3>
              <p className="text-[10px] text-ink-muted">
                {isSubmitted ? t('Yuborildi') : step === 1 ? t('1/2 · Karta rekvizitlari') : t('2/2 · Chek yuborish')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic?.impact?.('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {!isSubmitted && (
          <div className="px-4 pt-3 flex space-x-1.5">
            {[1, 2].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan to-violet-light"
                  initial={false}
                  animate={{ width: step >= s ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="p-4 space-y-4">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="py-8 text-center space-y-3"
            >
              <div className="w-16 h-16 bg-cyan/15 text-cyan rounded-full flex items-center justify-center mx-auto border border-cyan/30 shadow-cyanGlowSm">
                <CheckCircle2 className="w-8 h-8" strokeWidth={2.2} />
              </div>
              <h4 className="text-base font-extrabold text-ink">
                {finalPrice === 0 ? t('Kurs muvaffaqiyatli ochildi!') : t('Chek adminga yuborildi!')}
              </h4>
              <p className="text-[11px] text-ink-secondary max-w-xs mx-auto leading-relaxed">
                {finalPrice === 0
                  ? t("To'lov to'liq qoplandi va kurs profilingizga biriktirildi. O'rganishni boshlashingiz mumkin! 🎉")
                  : t('To‘lov chekingiz adminlarimizga yuborildi. Tekshirilgach, darslar kabinetingizda ochiladi va bot orqali xabar boradi.')}
              </p>
            </motion.div>
          ) : step === 1 ? (
            <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease }} className="space-y-4">
              {/* Course Card Preview */}
              <div className="glass-chip rounded-[20px] p-3.5 flex items-center justify-between">
                <div className="min-w-0 pr-2 flex items-center space-x-2.5">
                  <img src={toMediaUrl(course.cover_url)} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-cyan uppercase tracking-[0.14em] block">
                      {course.category}
                    </span>
                    <h4 className="text-xs font-bold text-ink truncate">{course.title}</h4>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 flex-shrink-0 tabular-nums">
                  {finalPrice < course.price ? (
                    <s className="text-[10px] text-slate-400 font-semibold">{formatPrice(course.price)}</s>
                  ) : null}
                  <span className={`text-sm font-extrabold ${finalPrice < course.price ? 'text-rose-500' : 'text-cyan'}`}>
                    {formatPrice(finalPrice)}
                  </span>
                </span>
              </div>

              {/* Promokod bloki */}
              <div className="glass-chip rounded-[18px] p-3 space-y-2">
                {hasPromo ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600">
                      <TicketPercent className="w-4 h-4" />
                      {promoInfo.code} · −{promoInfo.percent}%
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      {t('Olib tashlash ✕')}
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-ink-secondary uppercase tracking-wider">
                      <TicketPercent className="w-3.5 h-3.5 text-cyan" />
                      {t('Promokodim bor')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
                        placeholder={t('Masalan: YANGI10')}
                        className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-ink uppercase tracking-wide outline-none focus:border-cyan/60"
                      />
                      <button
                        type="button"
                        disabled={promoApplying || !promoInput.trim()}
                        onClick={handleApplyPromo}
                        className="px-3.5 py-2 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan text-[11px] font-extrabold disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
                      >
                        {promoApplying ? '…' : t('Qo‘llash')}
                      </button>
                    </div>
                    {promoError ? (
                      <p className="text-[10px] font-semibold text-rose-500 leading-snug">{promoError}</p>
                    ) : null}
                  </>
                )}
              </div>

              {/* Hamyon bloki — balans bo'lsa ko'rinadi; summani o'zi belgilaydi */}
              {walletBalance > 0 ? (
                <div className={`rounded-[18px] p-3 border space-y-2.5 transition-all ${
                  useWallet ? 'border-emerald-400/60 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}>
                  <button
                    type="button"
                    onClick={() => { haptic?.selection?.(); setUseWallet(v => !v); }}
                    className="w-full flex items-center justify-between active:scale-[0.98] transition-transform"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-ink">
                      <Wallet className={`w-4 h-4 ${useWallet ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {t('Hamyondan to‘lash')}
                      <span className="text-ink-muted font-bold">· {formatPrice(walletBalance)}</span>
                    </span>
                    <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${useWallet ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${useWallet ? 'translate-x-4' : ''}`} />
                    </span>
                  </button>

                  {useWallet ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={walletMax}
                        value={walletInput}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setWalletInput(String(Math.max(0, Math.min(v, walletMax))));
                        }}
                        placeholder="0"
                        className="flex-1 min-w-0 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 tabular-nums outline-none focus:border-emerald-400"
                      />
                      <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{t("so'm")}</span>
                      <button
                        type="button"
                        onClick={() => { haptic?.selection?.(); setWalletInput(String(walletMax)); }}
                        className="px-2.5 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-[10px] font-extrabold active:scale-95 transition-transform flex-shrink-0"
                      >
                        {t('Hammasi')}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Bank Card Info Card */}
              <div className="glass rounded-[22px] p-4 space-y-3.5 border border-slate-200/90 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-ink-secondary">
                    <CreditCard className="w-4 h-4 text-cyan" />
                    <span className="font-bold text-slate-800">{cardInfo.bank_name || 'Humo / Uzcard'}</span>
                  </div>
                  <button
                    onClick={handleCopyCard}
                    className="flex items-center space-x-1 text-[11px] font-bold text-cyan glass-chip px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t('Nusxalandi!') : t('Karta raqamini nusxalash')}</span>
                  </button>
                </div>

                <div className="bg-slate-100/90 rounded-2xl p-3.5 flex items-center justify-between font-mono border border-slate-200">
                  <span className="text-base font-extrabold tracking-wider text-slate-900">{cardNumber}</span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t('Karta egasi:')}</span>
                    <span className="font-extrabold text-slate-900">{cardInfo.card_holder}</span>
                  </div>
                  {basePrice < course.price ? (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{t('Chegirma:')}</span>
                      <span className="font-extrabold text-rose-500">
                        −{course.discount_percent}% ({t('birinchi')} {course.discount_limit} {t('kishi')})
                      </span>
                    </div>
                  ) : null}
                  {hasPromo ? (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{t('Promokod')}:</span>
                      <span className="font-extrabold text-emerald-600">
                        {promoInfo.code} · −{promoInfo.percent}%
                      </span>
                    </div>
                  ) : null}
                  {walletSpend > 0 ? (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{t('Hamyon:')}</span>
                      <span className="font-extrabold text-emerald-600">
                        −{formatPrice(walletSpend)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t('To‘lov summasi:')}</span>
                    <span className="font-extrabold text-base text-cyan tabular-nums">{formatPrice(finalPrice)}</span>
                  </div>
                  {walletSpend > 0 && finalPrice > 0 ? (
                    <p className="text-[10px] font-semibold text-emerald-700 leading-snug pt-1">
                      💳 {t('Qolgan')} <b>{formatPrice(finalPrice)}</b> {t("so'mni karta orqali to'lang.")}
                    </p>
                  ) : null}
                  {walletSpend > 0 && finalPrice === 0 ? (
                    <p className="text-[10px] font-semibold text-emerald-600 leading-snug pt-1">
                      ✅ {t("Kurs narxi hamyon hisobingizdan 100% qoplandi! Chek yuklash shart emas, darslar darhol ochiladi.")}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Simple 2-Step Instruction */}
              {finalPrice > 0 ? (
                <div className="glass-chip rounded-[18px] p-3 text-[11px] text-ink-secondary leading-relaxed space-y-1">
                  <p className="font-semibold text-ink">💡 {t('To‘lov qilish tartibi:')}</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-ink-muted">
                    <li>{t('Karta raqamidan nusxa oling va ilovangizdan pul o‘tkazing.')}</li>
                    <li>{t('To‘lov chekining skrinshotini oling.')}</li>
                    <li><b>{t('"Chek yuklash"')}</b> {t('tugmasini bosib, rasmni yuboring.')}</li>
                  </ol>
                </div>
              ) : null}

              {finalPrice === 0 ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSubmitReceipt}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {isProcessing ? (
                    <InlineLoader variant="orbit" size={16} color="#FFFFFF" />
                  ) : (
                    <>
                      <span>{t('Hamyondan to‘lash va kursni ochish')}</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { haptic?.impact?.('light'); setStep(2); }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl shadow-cyanGlow active:scale-[0.98] transition-transform flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{t('To‘lov qildim, chek yuklash')}</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-ink-secondary block">{t('To‘lov cheki skrinshoti')}</label>
                <label className="border-2 border-dashed border-slate-300 hover:border-cyan/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 relative overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {receiptImage ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                      <img src={receiptImage} alt="Chek" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        {t('Boshqa rasm tanlash')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/25 text-cyan flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-ink">{t('Chek rasmini yuklang')}</p>
                      <p className="text-[10px] text-ink-muted">{t('PNG, JPG yoki WebP (Galereyadan tanlang)')}</p>
                    </div>
                  )}
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-600 rounded-2xl text-[11px] flex items-center space-x-2 animate-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitReceipt}
                disabled={isProcessing || !receiptImage}
                className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl shadow-cyanGlow active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-40 disabled:shadow-none"
              >
                {isProcessing ? (
                  <InlineLoader variant="orbit" size={16} color="#FFFFFF" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t('Chekni adminga yuborish')}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-ink-muted text-center leading-relaxed">
                {t('Chek to‘g‘ridan-to‘g‘ri adminlarga yuboriladi. Tasdiqlangach, kurs darslari ochiladi.')}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
