import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { Course } from '../types';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';

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
  const { haptic } = useTelegram();

  if (!isOpen) return null;

  const handlePay = async () => {
    haptic.impact('medium');
    setIsProcessing(true);

    try {
      await api.createOrder(course.id, selectedMethod);
      // Qisqa simulyatsiya va muvaffaqiyat
      setTimeout(() => {
        haptic.notification('success');
        setIsProcessing(false);
        onSuccess(course);
      }, 1200);
    } catch {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'payme', name: 'Payme', badge: 'Karta orqali' },
    { id: 'click', name: 'Click Up', badge: 'Karta orqali' },
    { id: 'uzum', name: 'Uzum Bank', badge: 'Tezkor' },
    { id: 'stars', name: 'Telegram Stars ⭐️', badge: 'Telegram orqali' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-brand-border/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-brand-emerald" />
            <h3 className="text-base font-bold text-brand-dark">Xavfsiz Xarid</h3>
          </div>
          <button
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center text-brand-secondary hover:text-brand-dark"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course Summary */}
        <div className="flex items-center space-x-3.5 my-4 p-3 bg-brand-surface rounded-2xl border border-brand-border/60">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-brand-emerald uppercase">
              {course.category}
            </span>
            <h4 className="text-xs font-bold text-brand-dark line-clamp-1 mt-0.5">
              {course.title}
            </h4>
            <p className="text-[11px] text-brand-secondary mt-0.5">
              {course.lesson_count} ta dars • {course.duration}
            </p>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 py-2 text-xs">
          <div className="flex justify-between text-brand-secondary">
            <span>Kurs narxi:</span>
            <span>{course.old_price?.toLocaleString('uz-UZ') || course.price.toLocaleString('uz-UZ')} so'm</span>
          </div>
          {course.discount_percent && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Chegirma (-{course.discount_percent}%):</span>
              <span>-{(course.old_price! - course.price).toLocaleString('uz-UZ')} so'm</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-brand-border text-brand-dark font-bold text-sm">
            <span>Jami to'lov:</span>
            <span className="text-lg text-brand-emerald">{course.price.toLocaleString('uz-UZ')} so'm</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-4">
          <label className="text-xs font-bold text-brand-dark block mb-2">
            To'lov tizimini tanlang:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    haptic.impact('light');
                    setSelectedMethod(method.id as any);
                  }}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-emerald bg-brand-mint/60 shadow-sm'
                      : 'border-brand-border bg-white hover:border-brand-emerald/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark">{method.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />}
                  </div>
                  <span className="text-[10px] text-brand-secondary mt-0.5">{method.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full mt-6 py-3.5 bg-brand-emerald text-white font-bold rounded-2xl shadow-elevated hover:bg-brand-deep active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-75"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>To'lov qilinmoqda...</span>
            </>
          ) : (
            <>
              <span>To'lovni amalga oshirish</span>
              <Sparkles className="w-4 h-4 text-brand-gold" />
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-brand-muted mt-3">
          To'lovdan so'ng barcha darslar va materiallar avtomatik tarzda shaxsiy kabinetingizda ochiladi.
        </p>
      </div>
    </div>
  );
};
