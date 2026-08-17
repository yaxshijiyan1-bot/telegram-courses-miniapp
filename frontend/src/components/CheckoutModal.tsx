import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Upload,
  Check,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Wallet,
  ImageIcon,
} from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';
import { InlineLoader } from 'generative-loaders';
import { formatPrice } from '../utils/format';

interface CheckoutModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (course: Course) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

const METHOD_LABELS: Record<string, string> = {
  payme: 'Payme',
  click: 'Click',
  uzum: 'Uzum',
  stars: 'Stars',
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMethod, setSelectedMethod] = useState<'payme' | 'click' | 'uzum' | 'stars'>('payme');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cardInfo, setCardInfo] = useState<{ card_number: string; card_holder: string; bank_name?: string }>({
    card_number: '8600 5304 1234 5678',
    card_holder: 'Yaxshi Bola / Zuhra Olimova',
  });
  const { haptic, user } = useTelegram();

  useEffect(() => {
    api.getPaymentInfo().then(info => {
      if (info && info.card_number) {
        setCardInfo({ card_number: info.card_number, card_holder: info.card_holder, bank_name: info.bank_name });
      }
    }).catch(() => {});
  }, []);

  // Modal ochilganda holatni tozalash
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
    haptic.impact('light');
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
        haptic.notification('success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receiptImage) {
      setErrorMsg("Iltimos, avval to‘lov cheki skrinshotini yuklang!");
      haptic.notification('error');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    haptic.impact('heavy');

    try {
      await api.submitReceipt({
        course_id: course.id,
        course_title: course.title,
        amount: course.price,
        payment_method: selectedMethod,
        receipt_image: receiptImage,
        student_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Talaba',
        username: user?.username || 'user',
        telegram_id: user?.id || 0
      });

      setIsSubmitted(true);
      haptic.notification('success');
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#22D3EE', '#8B5CF6', '#F5C66B', '#ffffff'],
        disableForReducedMotion: true,
      });

      setTimeout(() => {
        onSuccess(course);
      }, 2600);

    } catch (err: any) {
      setErrorMsg(err.message || 'Chekni yuborishda xatolik yuz berdi');
      haptic.notification('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in">
      <div className="w-full max-w-md glass-deep !rounded-t-[28px] sm:!rounded-[28px] text-ink shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-sheet relative">

        {/* Header */}
        <div className="sticky top-0 z-10 glass-deep !rounded-t-[28px] flex items-center justify-between p-4 border-b border-white/[0.07]">
          <div className="flex items-center space-x-2.5">
            {step === 2 && !isSubmitted && (
              <button
                onClick={() => { haptic.impact('light'); setStep(1); setErrorMsg(''); }}
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
                {isSubmitted ? 'Yuborildi' : step === 1 ? '1/2 · To‘lov usuli' : '2/2 · Chek yuborish'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        {!isSubmitted && (
          <div className="px-4 pt-3 flex space-x-1.5">
            {[1, 2].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                className="w-16 h-16 bg-cyan/15 text-cyan rounded-full flex items-center justify-center mx-auto border border-cyan/30 shadow-cyanGlowSm"
              >
                <CheckCircle2 className="w-8 h-8" strokeWidth={2.2} />
              </motion.div>
              <h4 className="text-base font-extrabold text-ink">Chek qabul qilindi!</h4>
              <p className="text-[11px] text-ink-secondary max-w-xs mx-auto leading-relaxed">
                Chekingiz adminlarga yuborildi. 5–10 daqiqa ichida tekshirilib, darslar shaxsiy kabinetingizda ochiladi.
              </p>
            </motion.div>
          ) : step === 1 ? (
            <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease }} className="space-y-4">
              {/* Buyurtma xulosasi */}
              <div className="glass-chip rounded-[20px] p-3.5 flex items-center justify-between">
                <div className="min-w-0 pr-2 flex items-center space-x-2.5">
                  <img src={course.cover_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-cyan uppercase tracking-[0.14em] block">
                      {course.category}
                    </span>
                    <h4 className="text-xs font-bold text-ink truncate">{course.title}</h4>
                    <span className="text-[9px] text-ink-muted">1 yillik kirish · {course.lesson_count} dars</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-cyan flex-shrink-0 tabular-nums">
                  {formatPrice(course.price)}
                </span>
              </div>

              {/* Usul tanlash */}
              <div className="space-y-2">
                <label className="eyebrow block">To‘lov tizimi</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['payme', 'click', 'uzum', 'stars'] as const).map((method) => {
                    const active = selectedMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => {
                          haptic.selection();
                          setSelectedMethod(method);
                        }}
                        className={`relative py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                          active ? 'text-[#05070A]' : 'glass-chip text-ink-secondary'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="pay-method"
                            className="absolute inset-0 rounded-xl bg-cyan shadow-cyanGlowSm"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">{METHOD_LABELS[method]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-ink-muted leading-relaxed">
                  {METHOD_LABELS[selectedMethod]} orqali o‘tkazing va chek skrinshotini yuboring. Admin tasdiqlagach darslar ochiladi.
                </p>
              </div>

              {/* Karta rekvizitlari */}
              <div className="glass-chip rounded-[20px] p-4 space-y-3 relative overflow-hidden">
                <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-cyan/[0.08] blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center">
                  <span className="eyebrow flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-cyan" />
                    Karta raqami
                  </span>
                  <button
                    onClick={handleCopyCard}
                    className={`text-[11px] flex items-center space-x-1 font-extrabold px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                      copied ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30' : 'text-cyan glass-chip'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>

                <div className="text-[17px] font-mono font-bold tracking-[0.12em] text-ink tabular-nums">
                  {cardNumber}
                </div>

                <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-white/[0.06]">
                  <span className="text-ink-muted">Qabul qiluvchi:</span>
                  <span className="font-bold text-ink text-right">{cardInfo.card_holder}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  haptic.impact('medium');
                  setStep(2);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl shadow-cyanGlow active:scale-[0.98] transition-transform flex items-center justify-center space-x-2 text-sm"
              >
                <span>To‘ladim, davom etish</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease }} className="space-y-4">
              {/* Chek yuklash */}
              <div className="space-y-2">
                <label className="eyebrow block">To‘lov cheki skrinshoti</label>

                <label className="flex flex-col items-center justify-center p-6 glass-chip border border-dashed border-cyan/35 !rounded-[20px] cursor-pointer hover:border-cyan transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {receiptImage ? (
                    <div className="flex items-center space-x-2 text-cyan">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-bold">Chek tanlandi — o‘zgartirish uchun bosing</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-ink-muted group-hover:text-cyan transition-colors">
                      <div className="w-11 h-11 rounded-2xl bg-cyan/10 border border-cyan/20 text-cyan flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Chek rasmini tanlang</span>
                      <span className="text-[10px] text-ink-muted">JPG, PNG yoki skrinshot</span>
                    </div>
                  )}
                </label>

                {receiptImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-2xl overflow-hidden border border-white/10 max-h-44 bg-black"
                  >
                    <img src={receiptImage} alt="Chek" className="w-full object-contain max-h-44" />
                    <div className="absolute top-2 right-2 text-[9px] font-bold bg-black/60 backdrop-blur-md text-cyan px-2 py-1 rounded-md flex items-center gap-1 border border-cyan/25">
                      <ImageIcon className="w-3 h-3" />
                      {METHOD_LABELS[selectedMethod]}
                    </div>
                  </motion.div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-300 rounded-2xl text-[11px] flex items-center space-x-2 animate-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleSubmitReceipt}
                disabled={isProcessing || !receiptImage}
                className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl shadow-cyanGlow active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-40 disabled:shadow-none"
              >
                {isProcessing ? (
                  <InlineLoader variant="orbit" size={16} color="#05070A" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Chekni yuborish</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-ink-muted text-center leading-relaxed">
                Chek yuborilgach admin tekshiradi. Tasdiqlansa, kurs avtomatik ochiladi va bot orqali xabar keladi.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
