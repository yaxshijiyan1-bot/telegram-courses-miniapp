import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Copy,
  Upload,
  Check,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';
import { InlineLoader } from 'generative-loaders';

interface CheckoutModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (course: Course) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'payme' | 'click' | 'uzum' | 'stars'>('payme');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cardInfo, setCardInfo] = useState<{ card_number: string; card_holder: string }>({
    card_number: '8600 5304 1234 5678',
    card_holder: 'Yaxshi Bola / Zuhra Olimova'
  });
  const { haptic, user } = useTelegram();

  useEffect(() => {
    api.getPaymentInfo().then(info => {
      if (info && info.card_number) {
        setCardInfo({ card_number: info.card_number, card_holder: info.card_holder });
      }
    }).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const cardNumber = cardInfo.card_number;
  const cardHolder = cardInfo.card_holder;

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
      
      setTimeout(() => {
        onClose();
      }, 3500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Chekni yuborishda xatolik yuz berdi');
      haptic.notification('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + " so'm";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0D1117] text-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-cyan" />
            <h3 className="text-sm font-bold text-white">Xavfsiz To‘lov</h3>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-fade-up">
            <div className="w-14 h-14 bg-cyan/15 text-cyan rounded-full flex items-center justify-center mx-auto border border-cyan/40 shadow-cyanGlow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">To‘lov cheki qabul qilindi!</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Chekingiz adminlarimizga yuborildi. 5-10 daqiqa ichida tekshirilib, darslar shaxsiy kabinetingizda ochiladi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Course Summary */}
            <div className="p-3.5 bg-[#11161D] rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
                  {course.category}
                </span>
                <h4 className="text-xs font-bold text-white truncate">{course.title}</h4>
              </div>
              <span className="text-sm font-black text-cyan flex-shrink-0">
                {formatPrice(course.price)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                To‘lov usuli:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['payme', 'click', 'uzum', 'stars'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      haptic.selection();
                      setSelectedMethod(method);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold uppercase transition-all card-interactive ${
                      selectedMethod === method
                        ? 'bg-cyan text-black shadow-cyanGlowSm'
                        : 'bg-[#11161D] border border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details Card */}
            <div className="p-4 bg-[#11161D] rounded-2xl border border-white/[0.08] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Karta raqami</span>
                <button
                  onClick={handleCopyCard}
                  className="text-xs text-cyan flex items-center space-x-1 font-bold active:scale-95 transition-transform"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Nusxalandi" : "Nusxalash"}</span>
                </button>
              </div>

              <div className="text-base font-mono font-bold tracking-widest text-white">
                {cardNumber}
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400">Qabul qiluvchi:</span>
                <span className="font-bold text-white">{cardHolder}</span>
              </div>
            </div>

            {/* Receipt Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                To‘lov chekini yuklash:
              </label>

              <label className="flex flex-col items-center justify-center p-4 bg-[#11161D] border border-dashed border-cyan/40 rounded-2xl cursor-pointer hover:border-cyan transition-colors group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {receiptImage ? (
                  <div className="flex items-center space-x-2 text-cyan">
                    <CheckCircle2 className="w-5 h-5 stroke-cyan" />
                    <span className="text-xs font-bold">Chek tanlandi (o‘zgartirish uchun bosing)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1.5 text-slate-400 group-hover:text-cyan transition-colors">
                    <Upload className="w-6 h-6 stroke-cyan" />
                    <span className="text-xs font-bold">Chek rasmini tanlang</span>
                    <span className="text-[10px] text-slate-500">JPG, PNG yoki Skrinshot</span>
                  </div>
                )}
              </label>

              {receiptImage && (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-36 bg-black">
                  <img src={receiptImage} alt="Chek" className="w-full object-contain max-h-36" />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit CTA */}
            <button
              onClick={handleSubmitReceipt}
              disabled={isProcessing || !receiptImage}
              className="w-full py-3.5 bg-cyan text-black font-black rounded-2xl shadow-cyanGlow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm tracking-wide disabled:opacity-50"
            >
              {isProcessing ? (
                <InlineLoader variant="orbit" size={16} color="#000000" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>To‘lovni tasdiqlash uchun yuborish</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
