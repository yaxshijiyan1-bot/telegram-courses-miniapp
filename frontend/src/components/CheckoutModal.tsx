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
} from 'lucide-react';
import { Course } from '../types';
import { api, toMediaUrl } from '../services/api';
import { useTelegram } from '../context/TelegramContext';
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
  const { haptic, user } = useTelegram();

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

  const handleSubmitReceipt = async () => {
    if (!receiptImage) {
      setErrorMsg("Iltimos, avval to‘lov cheki skrinshotini yuklang!");
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
        amount: course.price,
        payment_method: 'karta',
        receipt_image: receiptImage,
        student_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Talaba',
        username: user?.username || 'user',
        telegram_id: user?.id || 0
      });

      haptic?.notification?.('success');
      setIsSubmitted(true);

      setTimeout(() => {
        onSuccess(course);
        onClose();
      }, 2600);

    } catch (err: any) {
      setErrorMsg(err.message || 'Chekni yuborishda xatolik yuz berdi');
      haptic?.notification?.('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 animate-in">
      <div className="w-full max-w-md glass-deep !rounded-t-[28px] sm:!rounded-[28px] text-ink shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-sheet relative">

        {/* Modal Header */}
        <div className="sticky top-0 z-10 glass-deep !rounded-t-[28px] flex items-center justify-between p-4 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            {step === 2 && !isSubmitted && (
              <button
                onClick={() => { haptic?.impact?.('light'); setStep(1); setErrorMsg(''); }}
                className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary active:scale-90 transition-transform"
                aria-label="Orqaga"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan flex items-center justify-center">
              <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-ink leading-tight">Xavfsiz to‘lov</h3>
              <p className="text-[10px] text-ink-muted">
                {isSubmitted ? 'Yuborildi' : step === 1 ? '1/2 · Karta rekvizitlari' : '2/2 · Chek yuborish'}
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
              <h4 className="text-base font-extrabold text-ink">Chek adminga yuborildi!</h4>
              <p className="text-[11px] text-ink-secondary max-w-xs mx-auto leading-relaxed">
                To‘lov chekingiz adminlarimizga yuborildi. Tekshirilgach, darslar kabinetingizda ochiladi va bot orqali xabar boradi.
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
                <span className="text-sm font-extrabold text-cyan flex-shrink-0 tabular-nums">
                  {formatPrice(course.price)}
                </span>
              </div>

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
                    <span>{copied ? 'Nusxalandi!' : 'Karta raqamini nusxalash'}</span>
                  </button>
                </div>

                <div className="bg-slate-100/90 rounded-2xl p-3.5 flex items-center justify-between font-mono border border-slate-200">
                  <span className="text-base font-extrabold tracking-wider text-slate-900">{cardNumber}</span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Karta egasi:</span>
                    <span className="font-extrabold text-slate-900">{cardInfo.card_holder}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>To‘lov summasi:</span>
                    <span className="font-extrabold text-base text-cyan tabular-nums">{formatPrice(course.price)}</span>
                  </div>
                </div>
              </div>

              {/* Simple 2-Step Instruction */}
              <div className="glass-chip rounded-[18px] p-3 text-[11px] text-ink-secondary leading-relaxed space-y-1">
                <p className="font-semibold text-ink">💡 To‘lov qilish tartibi:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-ink-muted">
                  <li>Karta raqamidan nusxa oling va ilovangizdan pul o‘tkazing.</li>
                  <li>To‘lov chekining skrinshotini oling.</li>
                  <li><b>"Chek yuklash"</b> tugmasini bosib, rasmni yuboring.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => { haptic?.impact?.('light'); setStep(2); }}
                className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-white font-extrabold rounded-2xl shadow-cyanGlow active:scale-[0.98] transition-transform flex items-center justify-center space-x-2 text-sm"
              >
                <span>To‘lov qildim, chek yuklash</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-ink-secondary block">To‘lov cheki skrinshoti</label>
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
                        Boshqa rasm tanlash
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/25 text-cyan flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-ink">Chek rasmini yuklang</p>
                      <p className="text-[10px] text-ink-muted">PNG, JPG yoki WebP (Galereyadan tanlang)</p>
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
                    <span>Chekni adminga yuborish</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-ink-muted text-center leading-relaxed">
                Chek to‘g‘ridan-to‘g‘ri adminlarga yuboriladi. Tasdiqlangach, kurs darslari ochiladi.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
