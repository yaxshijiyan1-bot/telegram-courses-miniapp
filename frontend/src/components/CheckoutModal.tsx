import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Loader2,
  Copy,
  Upload,
  Check,
  Image as ImageIcon,
  MessageCircle,
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
      setErrorMsg("Iltimos, avval to'lov cheki skrinshotini yuklang!");
      return;
    }

    haptic.impact('medium');
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Backend API ga yuborish
      const API_URL = import.meta.env.VITE_API_URL || 'https://kurslar-backend-api.onrender.com/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/checkout/submit-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          course_id: course.id,
          payment_method: selectedMethod,
          receipt_image: receiptImage,
          comment: `Talaba: ${user?.first_name || 'Talaba'} (@${user?.username || 'tg_user'})`
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Xatolikni yashirmaymiz — foydalanuvchiga ko'rsatamiz
        setIsProcessing(false);
        if (response.status === 401) {
          api.clearCredentials();
          setErrorMsg('Sessiya muddati tugagan. Iltimos, Mini Appni yopib, qaytadan oching va Telegram orqali kiring.');
        } else {
          setErrorMsg(resData.detail || 'Chek yuborishda xatolik yuz berdi. Internetni tekshirib, qayta urinib ko\'ring.');
        }
        haptic.notification('error');
        return;
      }

      setIsProcessing(false);
      setIsSubmitted(true);
      haptic.notification('success');

      // 3.5 soniyadan keyin modal yopiladi — kurs faqat admin tasdiqlagach ochiladi
      setTimeout(() => {
        setIsSubmitted(false);
        setReceiptImage(null);
        onClose();
      }, 3500);
    } catch {
      setIsProcessing(false);
      setErrorMsg('Serverga ulanib bo\'lmadi. Internetni tekshirib, qayta urinib ko\'ring.');
      haptic.notification('error');
    }
  };

  const paymentMethods = [
    { id: 'payme', name: 'Payme', badge: 'Karta orqali' },
    { id: 'click', name: 'Click Up', badge: 'Karta orqali' },
    { id: 'uzum', name: 'Uzum Bank', badge: 'Tezkor' },
    { id: 'stars', name: 'Telegram Stars ⭐️', badge: 'Telegram orqali' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#131318] text-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#B4F523]" />
            <h3 className="text-base font-bold text-white">Xavfsiz To'lov</h3>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#181820] flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          /* Submitted State */
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#B4F523]/15 text-[#B4F523] flex items-center justify-center mx-auto shadow-neonSm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">To'lov Cheki Qabul Qilindi! 🎉</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Chekingiz adminlarimiz (<span className="font-bold text-[#B4F523]">@yomonboia</span> va <span className="font-bold text-[#B4F523]">@sokin_notalar</span>) ga yetkazildi. Tekshirilib bir necha daqiqada darslar ochiladi!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Course Summary */}
            <div className="flex items-center space-x-3.5 p-3 bg-[#181820] rounded-2xl border border-white/5">
              <img
                src={course.cover_url}
                alt={course.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#B4F523] uppercase">
                  {course.category}
                </span>
                <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                  {course.title}
                </h4>
                <div className="text-xs font-bold text-[#B4F523] mt-0.5">
                  {course.price.toLocaleString('uz-UZ')} so'm
                </div>
              </div>
            </div>

            {/* Step 1: Payment Method Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>1. To'lov tizimini tanlang:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedMethod(method.id as any);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all relative ${
                      selectedMethod === method.id
                        ? 'border-[#B4F523] bg-[#B4F523]/10 shadow-neonSm'
                        : 'border-white/5 bg-[#181820] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">
                      {method.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {method.badge}
                    </span>
                    {selectedMethod === method.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#B4F523] absolute top-2.5 right-2.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Card details & Transfer Info */}
            <div className="p-3.5 bg-[#181820] rounded-2xl border border-white/5 text-white space-y-2.5 shadow-soft">
              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span>2. Quyidagi kartaga pul o'tkazing:</span>
                <span className="bg-[#B4F523]/15 text-[#B4F523] px-2 py-0.5 rounded-full font-bold">
                  8600 • Uzcard/Humo
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="font-mono text-sm font-bold tracking-wider text-white">
                  {cardNumber}
                </span>
                <button
                  onClick={handleCopyCard}
                  className="px-2.5 py-1 bg-[#B4F523] hover:opacity-90 text-black rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all active:scale-95 shadow-neonSm"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Nusxalandi" : "Nusxa"}</span>
                </button>
              </div>

              <div className="flex justify-between text-[11px] text-zinc-300 pt-0.5">
                <span>Egasi: <strong className="text-white">{cardHolder}</strong></span>
                <span>Summa: <strong className="text-[#B4F523]">{course.price.toLocaleString('uz-UZ')} so'm</strong></span>
              </div>
            </div>

            {/* Step 3: Receipt Screenshot Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>3. To'lov cheki skrinshotini yuklang:</span>
                <span className="text-[10px] text-[#B4F523] font-normal">Majburiy</span>
              </label>

              <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#B4F523]/40 hover:border-[#B4F523] rounded-2xl cursor-pointer bg-[#181820] hover:bg-[#B4F523]/5 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {receiptImage ? (
                  <div className="flex items-center space-x-2 text-[#B4F523] font-bold text-xs">
                    <ImageIcon className="w-5 h-5" />
                    <span>Skrinshot yuklandi (O'zgartirish)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1 text-center">
                    <Upload className="w-6 h-6 text-[#B4F523]" />
                    <span className="text-xs font-bold text-white">Chek rasmini tanlang</span>
                    <span className="text-[10px] text-zinc-500">PNG, JPG yoki Skrinshot</span>
                  </div>
                )}
              </label>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Action Button with Generative Loader */}
            <button
              onClick={handleSubmitReceipt}
              disabled={isProcessing}
              className={`w-full py-3.5 font-bold rounded-2xl shadow-neonSm flex items-center justify-center space-x-2 transition-all ${
                isProcessing
                  ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  : 'bg-[#B4F523] text-black hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <InlineLoader variant="orbit" size={18} color="#B4F523" />
                  <span className="text-xs font-semibold">Chek adminlarga uzatilmoqda...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs">Chekni Yuborish & Kursni Ochish</span>
                </>
              )}
            </button>

            {/* Support info */}
            <div className="text-center pt-1">
              <a
                href="https://t.me/yomonboia"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-[11px] text-brand-secondary hover:text-brand-emerald"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Savollar bormi? Adminlar: @yomonboia | @sokin_notalar</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
