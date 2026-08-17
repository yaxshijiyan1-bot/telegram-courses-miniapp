import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Check,
  Ban,
  Send,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Wallet,
  GraduationCap,
  BookOpen,
  ReceiptText,
  Megaphone,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';
import { AdminStats, PendingReceipt, AdminStudent, Course } from '../types';
import { InlineLoader } from 'generative-loaders';
import { formatPrice, formatNumber, formatMln, formatDate } from '../utils/format';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
}

type AdminTab = 'receipts' | 'stats' | 'new_course' | 'students' | 'broadcast' | 'settings';

const ease = [0.22, 1, 0.36, 1] as const;

const TABS: { id: AdminTab; label: string; icon: typeof Clock }[] = [
  { id: 'receipts', label: 'Cheklar', icon: ReceiptText },
  { id: 'stats', label: 'Statistika', icon: TrendingUp },
  { id: 'new_course', label: 'Kurslar', icon: BookOpen },
  { id: 'students', label: 'Talabalar', icon: Users },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'settings', label: 'Karta', icon: CreditCard },
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminName
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('receipts');
  const { haptic } = useTelegram();

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [receipts, setReceipts] = useState<PendingReceipt[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseOldPrice, setCourseOldPrice] = useState('');
  const [courseCategory, setCourseCategory] = useState('AI');
  const [courseDesc, setCourseDesc] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [cardNumber, setCardNumber] = useState('8600 5304 1234 5678');
  const [cardHolder, setCardHolder] = useState('Yaxshi Bola / Zuhra Olimova');
  const [bankName, setBankName] = useState('');
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setIsSuccess(true);
    setErrorMsg('');
    haptic.notification('success');
    setTimeout(() => {
      setIsSuccess(false);
      setSuccessMsg('');
    }, 3200);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setIsSuccess(false);
    haptic.notification('error');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [s, r, st, c] = await Promise.all([
        api.getAdminStats(),
        api.getPendingReceipts(),
        api.getAdminStudents(),
        api.getAdminCourses()
      ]);
      setStats(s);
      setReceipts(r);
      setStudents(st);
      setCourses(c);
    } catch (e: any) {
      showError(e?.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Karta rekvizitlarini backend'dan yuklash
  const loadPaymentInfo = useCallback(async () => {
    try {
      const info = await api.getPaymentInfo();
      if (info?.card_number) {
        setCardNumber(info.card_number);
        setCardHolder(info.card_holder || '');
        setBankName(info.bank_name || '');
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadPaymentInfo();
    }
  }, [isOpen, loadData, loadPaymentInfo]);

  if (!isOpen) return null;

  const pendingCount = receipts.filter(r => r.status === 'pending').length;

  const handleApprove = async (orderId: string) => {
    haptic.impact('heavy');
    setIsActionLoading(orderId);
    try {
      const res = await api.approveReceipt(orderId);
      showNotification(res.message || 'Chek tasdiqlandi va darslar ochildi!');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Tasdiqlashda xatolik yuz berdi');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    haptic.impact('medium');
    setIsActionLoading(orderId);
    try {
      const res = await api.rejectReceipt(orderId);
      showNotification(res.message || 'Chek rad etildi');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Rad etishda xatolik yuz berdi');
    } finally {
      setIsActionLoading(null);
    }
  };

  const startEditCourse = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseTitle(c.title);
    setCoursePrice(String(c.price));
    setCourseOldPrice(c.old_price ? String(c.old_price) : '');
    setCourseCategory(c.category || 'AI');
    setCourseDesc(c.short_description || '');
    setActiveTab('new_course');
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCoursePrice('');
    setCourseOldPrice('');
    setCourseDesc('');
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact('heavy');
    setIsActionLoading('course_form');
    try {
      let res;
      if (editingCourseId) {
        res = await api.updateCourse(editingCourseId, {
          title: courseTitle,
          price: parseInt(coursePrice) || 0,
          old_price: courseOldPrice ? parseInt(courseOldPrice) : null,
          category: courseCategory,
          short_description: courseDesc
        });
      } else {
        const slugBase = courseTitle.toLowerCase()
          .replace(/['`]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .slice(0, 40) || 'kurs';
        const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;
        res = await api.createCourse({
          title: courseTitle,
          slug,
          price: parseInt(coursePrice) || 0,
          old_price: courseOldPrice ? parseInt(courseOldPrice) : null,
          category: courseCategory,
          description: courseDesc || courseTitle,
          short_description: courseDesc,
          cover_url: '/images/hero_seal.webp',
          level: "Boshlang'ich va Professional",
          duration: '10 soat',
          lesson_count: 10,
          instructor_name: 'Yaxshi Bola',
          instructor_title: 'Ustoz'
        } as Partial<Course>);
      }
      showNotification(res.message || 'Kurs saqlandi!');
      resetCourseForm();
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Kursni saqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Rostan ham bu kursni o‘chirmoqchimisiz?')) return;
    haptic.impact('heavy');
    setIsActionLoading(`del_${courseId}`);
    try {
      const res = await api.deleteCourse(courseId);
      showNotification(res.message || 'Kurs o‘chirildi');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'O‘chirishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    haptic.impact('heavy');
    setIsActionLoading('broadcast');
    try {
      const res = await api.sendBroadcast(broadcastText.trim());
      showNotification(res.message || `Xabar ${res.sent_count} ta foydalanuvchiga yuborildi!`);
      setBroadcastText('');
    } catch (e: any) {
      showError(e?.message || 'Broadcast yuborishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleManualEnroll = async (studentId: string, courseId: string) => {
    if (!courseId) {
      showError('Iltimos, avval kursni tanlang!');
      return;
    }
    haptic.impact('heavy');
    setIsActionLoading(`enroll_${studentId}`);
    try {
      const res = await api.manualEnroll(studentId, courseId);
      showNotification(res.message || 'Kurs muvaffaqiyatli ochildi!');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Kursni ochishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact('heavy');
    setIsActionLoading('card_form');
    try {
      await api.savePaymentSettings(cardNumber, cardHolder, bankName);
      showNotification('Karta rekvizitlari saqlandi!');
    } catch (e: any) {
      showError(e?.message || 'Rekvizitlarni saqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in">
      <div className="w-full max-w-lg glass-deep !rounded-t-[28px] sm:!rounded-[28px] text-ink shadow-2xl max-h-[94vh] overflow-y-auto no-scrollbar animate-sheet">

        {/* Header */}
        <div className="sticky top-0 z-20 glass-deep !rounded-t-[28px] flex items-center justify-between p-4 pb-3 border-b border-white/[0.07]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan/10 border border-cyan/25 text-cyan flex items-center justify-center shadow-cyanGlowSm">
              <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-[13px] font-extrabold text-ink">Superadmin Panel</h3>
                <span className="bg-cyan/10 border border-cyan/25 text-cyan text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-wider">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-ink-muted">
                <strong className="text-cyan/90">{stats?.admin_name || adminName}</strong>
                {stats && <> · {stats.storage_backend}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => { haptic.selection(); loadData(); }}
              className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-cyan"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                haptic.impact('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full glass-chip flex items-center justify-center text-ink-secondary hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation — sirg'aluvchi indikator */}
        <div className="sticky top-[69px] z-10 px-3 py-2.5 glass-deep">
          <div className="flex space-x-1.5 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { haptic.selection(); setActiveTab(tab.id); }}
                  className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                    active ? 'text-[#05070A]' : 'glass-chip text-ink-secondary hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-tab"
                      className="absolute inset-0 rounded-xl bg-cyan shadow-cyanGlowSm"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                  {tab.id === 'receipts' && pendingCount > 0 && (
                    <span className="relative z-10 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="px-4 pt-1 space-y-2.5">
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="p-3 bg-cyan/10 border border-cyan/25 text-cyan rounded-2xl text-[11px] flex items-center space-x-2 overflow-hidden"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold">{successMsg}</span>
              </motion.div>
            )}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/25 text-red-300 rounded-2xl text-[11px] flex items-center space-x-2 overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-ink-muted">
              <InlineLoader variant="orbit" size={24} color="#22D3EE" />
              <span className="text-[11px]">Ma'lumotlar yuklanmoqda...</span>
            </div>
          )}

          {/* ===== TAB CONTENTS ===== */}
          {!isLoading && (
            <div className="space-y-3 pb-5">

              {/* RECEIPTS */}
              {activeTab === 'receipts' && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="eyebrow">To‘lov cheklari · {receipts.length}</h4>
                    {pendingCount > 0 && (
                      <span className="text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/25 font-bold px-2 py-0.5 rounded-full">
                        {pendingCount} ta kutilmoqda
                      </span>
                    )}
                  </div>

                  {receipts.length === 0 ? (
                    <div className="p-8 text-center glass-chip rounded-[22px] space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-cyan mx-auto" strokeWidth={1.8} />
                      <p className="text-xs text-ink font-bold">Barcha cheklar ko‘rib chiqilgan</p>
                      <p className="text-[10px] text-ink-muted">Yangi to‘lovlar bu yerda paydo bo‘ladi</p>
                    </div>
                  ) : (
                    receipts.map((receipt) => (
                      <div key={receipt.order_id} className="glass !rounded-[20px] p-3 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-ink text-xs block">{receipt.student_name}</strong>
                            <span className="text-[10px] text-ink-muted">
                              @{receipt.username} · <code className="text-cyan/80">{receipt.telegram_id}</code>
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                                receipt.status === 'approved'
                                  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/25'
                                  : receipt.status === 'rejected'
                                  ? 'bg-red-500/10 text-red-300 border border-red-500/25'
                                  : 'bg-amber-400/10 text-amber-300 border border-amber-400/25 animate-pulse'
                              }`}
                            >
                              {receipt.status === 'approved' ? 'Tasdiqlangan' : receipt.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                            </span>
                            <p className="text-[9px] text-ink-muted mt-1">{formatDate(receipt.created_at)}</p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-black/30 rounded-xl space-y-1 border border-white/[0.05]">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-ink-muted">Kurs:</span>
                            <strong className="text-ink text-right max-w-[210px] truncate">{receipt.course_title}</strong>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-ink-muted">Summa:</span>
                            <strong className="text-cyan">{formatPrice(receipt.amount)}</strong>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-ink-muted">To‘lov tizimi:</span>
                            <span className="text-ink-secondary uppercase font-bold tracking-wide">{receipt.payment_method}</span>
                          </div>
                        </div>

                        {receipt.receipt_image && (
                          <a
                            href={receipt.receipt_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative rounded-xl overflow-hidden border border-white/[0.08] max-h-48 bg-black group"
                          >
                            <img
                              src={receipt.receipt_image}
                              alt="To'lov cheki"
                              className="w-full object-contain max-h-48"
                            />
                            <span className="absolute bottom-2 right-2 text-[9px] font-bold bg-black/70 backdrop-blur-md text-cyan px-2 py-1 rounded-md border border-cyan/25 opacity-0 group-hover:opacity-100 transition-opacity">
                              Kattalashtirish
                            </span>
                          </a>
                        )}

                        {receipt.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              onClick={() => handleApprove(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="py-2.5 bg-cyan text-[#05070A] rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 active:scale-95 transition-all disabled:opacity-60 shadow-cyanGlowSm"
                            >
                              {isActionLoading === receipt.order_id ? (
                                <InlineLoader variant="orbit" size={14} color="#05070A" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Tasdiqlash</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="py-2.5 bg-red-500/12 text-red-300 border border-red-500/25 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-60"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Rad etish</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* STATS */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Jami tushum', value: formatMln(stats.total_revenue), unit: "so'm", icon: Wallet, accent: 'cyan' },
                      { label: 'Shu oy tushum', value: formatMln(stats.monthly_revenue), unit: "so'm", icon: TrendingUp, accent: 'violet' },
                      { label: 'Jami o‘quvchilar', value: formatNumber(stats.total_students), unit: 'talaba', icon: GraduationCap, accent: 'gold' },
                      { label: 'Faol kurslar', value: String(stats.active_courses_count), unit: 'kurs', icon: BookOpen, accent: 'cyan' },
                    ].map((s) => {
                      const Icon = s.icon;
                      const colorCls =
                        s.accent === 'cyan' ? 'text-cyan bg-cyan/10 border-cyan/20'
                        : s.accent === 'violet' ? 'text-violet-light bg-violet/10 border-violet/20'
                        : 'text-gold bg-gold/10 border-gold/20';
                      return (
                        <div key={s.label} className="glass !rounded-[20px] p-3.5">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${colorCls}`}>
                            <Icon className="w-4 h-4" strokeWidth={2.2} />
                          </div>
                          <span className="text-[9px] text-ink-muted font-extrabold uppercase tracking-[0.12em] block">
                            {s.label}
                          </span>
                          <div className="flex items-baseline space-x-1 mt-0.5">
                            <span className="text-[17px] font-black text-ink tabular-nums">{s.value}</span>
                            <span className="text-[9px] text-ink-muted">{s.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <h4 className="eyebrow">Oxirgi savdolar</h4>
                    {stats.recent_sales.length === 0 ? (
                      <p className="text-[11px] text-ink-muted py-3 text-center">Hozircha savdo yo‘q</p>
                    ) : (
                      stats.recent_sales.map((sale) => (
                        <div key={sale.id} className="glass-chip !rounded-2xl p-3 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-ink block truncate">{sale.student_name}</span>
                            <span className="text-[10px] text-ink-muted truncate block max-w-[180px]">{sale.course_title}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-black text-cyan block tabular-nums">+{formatMln(sale.amount)}</span>
                            <span className="text-[9px] text-ink-muted uppercase">
                              {sale.payment_method} · {formatDate(sale.date)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* COURSES */}
              {activeTab === 'new_course' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="eyebrow flex items-center justify-between">
                      <span>Mavjud kurslar</span>
                      <span className="text-cyan">{courses.length} ta</span>
                    </h4>

                    {courses.map((c) => (
                      <div key={c.id} className="glass !rounded-[20px] p-3 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2 flex items-center space-x-2.5">
                          <img src={c.cover_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                          <div className="min-w-0">
                            <strong className="text-ink block truncate">{c.title}</strong>
                            <span className="text-[10px] text-ink-muted">
                              <strong className="text-cyan/90">{c.instructor_name}</strong> · {formatPrice(c.price)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCourse(c)}
                            className="w-8 h-8 rounded-xl glass-chip text-cyan flex items-center justify-center hover:border-cyan/40 transition-all"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            disabled={isActionLoading === `del_${c.id}`}
                            className="w-8 h-8 rounded-xl bg-red-500/12 text-red-300 border border-red-500/25 flex items-center justify-center hover:bg-red-500/20 transition-all disabled:opacity-50"
                            title="O‘chirish"
                          >
                            {isActionLoading === `del_${c.id}` ? (
                              <InlineLoader variant="orbit" size={12} color="#f87171" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSaveCourse} className="space-y-2.5 pt-3 border-t border-white/[0.07]">
                    <h4 className="eyebrow">
                      {editingCourseId ? 'Kursni tahrirlash' : 'Yangi kurs yaratish'}
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-ink-secondary">Kurs nomi</label>
                      <input
                        type="text"
                        required
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        placeholder="Masalan: Sun'iy Intellekt va Prompt Engineering"
                        className="field"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-ink-secondary">Kategoriya</label>
                        <select
                          value={courseCategory}
                          onChange={(e) => setCourseCategory(e.target.value)}
                          className="field !py-2.5 font-bold"
                        >
                          {['AI', 'Dizayn', 'Dasturlash', 'Marketing', 'Biznes'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-ink-secondary">Kirish muddati</label>
                        <input type="text" disabled value="1 yil (365 kun)" className="field !py-2.5 !text-cyan font-bold opacity-80" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-ink-secondary">Narxi (so'm)</label>
                        <input
                          type="number"
                          required
                          value={coursePrice}
                          onChange={(e) => setCoursePrice(e.target.value)}
                          placeholder="490000"
                          className="field"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-ink-secondary">Eski narxi</label>
                        <input
                          type="number"
                          value={courseOldPrice}
                          onChange={(e) => setCourseOldPrice(e.target.value)}
                          placeholder="890000"
                          className="field"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-ink-secondary">Qisqa tavsif</label>
                      <input
                        type="text"
                        value={courseDesc}
                        onChange={(e) => setCourseDesc(e.target.value)}
                        placeholder="Kurs haqida 1-2 jumla"
                        className="field"
                      />
                    </div>

                    <div className="flex space-x-2 pt-1">
                      {editingCourseId && (
                        <button
                          type="button"
                          onClick={resetCourseForm}
                          className="px-4 py-3 glass-chip text-ink-secondary rounded-2xl font-bold text-xs hover:text-ink transition-colors"
                        >
                          Bekor qilish
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isActionLoading === 'course_form'}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl shadow-cyanGlowSm active:scale-[0.98] transition-transform text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                      >
                        {isActionLoading === 'course_form' ? (
                          <InlineLoader variant="orbit" size={14} color="#05070A" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{editingCourseId ? 'Saqlash' : 'Kursni yaratish'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STUDENTS */}
              {activeTab === 'students' && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="eyebrow">Talabalar</h4>
                    <span className="text-[10px] text-cyan font-bold">{students.length} ta</span>
                  </div>

                  <div className="glass !rounded-[20px] p-3 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-cyan uppercase tracking-[0.14em] block">
                      Grant uchun kurs tanlang:
                    </label>
                    <select
                      value={enrollCourseId}
                      onChange={(e) => setEnrollCourseId(e.target.value)}
                      className="field !py-2.5 font-bold"
                    >
                      <option value="">— Kurs tanlanmagan —</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {students.length === 0 ? (
                    <p className="text-[11px] text-ink-muted py-6 text-center">Hozircha talaba yo‘q</p>
                  ) : (
                    students.map((st) => {
                      const progress = parseInt(st.overall_progress) || 0;
                      return (
                        <div key={st.id} className="glass !rounded-[20px] p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-ink block text-xs">{st.name}</strong>
                              <span className="text-[10px] text-ink-muted">
                                @{st.username} · <code className="text-cyan/80">{st.telegram_id}</code>
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-extrabold text-cyan block tabular-nums">{st.overall_progress || '0%'}</span>
                              <span className="text-[9px] text-ink-muted">{formatDate(st.joined_date)}</span>
                            </div>
                          </div>

                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan to-violet-light transition-all duration-700"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-ink-muted truncate">
                              Kursi: <strong className="text-ink-secondary">{st.enrolled_courses || '— yangi'}</strong>
                            </span>
                            <button
                              onClick={() => handleManualEnroll(st.id, enrollCourseId)}
                              disabled={isActionLoading === `enroll_${st.id}`}
                              className="px-3 py-1.5 bg-cyan text-[#05070A] font-extrabold rounded-xl text-[10px] active:scale-95 transition-all disabled:opacity-50 shadow-cyanGlowSm flex items-center gap-1 flex-shrink-0"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                              {isActionLoading === `enroll_${st.id}` ? '...' : 'Grant'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* BROADCAST */}
              {activeTab === 'broadcast' && (
                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="eyebrow">Hammaga xabar (broadcast)</h4>
                    <p className="text-[10px] text-ink-muted leading-relaxed">
                      Xabar Telegram bot orqali barcha ro‘yxatdan o‘tgan talabalarga yetkaziladi.
                    </p>
                  </div>

                  <textarea
                    rows={5}
                    required
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Masalan: Yangi kurslar va e'lonlar..."
                    className="field !rounded-2xl resize-none leading-relaxed"
                  />

                  <button
                    type="submit"
                    disabled={isActionLoading === 'broadcast'}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl shadow-cyanGlowSm active:scale-[0.98] transition-transform text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                  >
                    {isActionLoading === 'broadcast' ? (
                      <InlineLoader variant="orbit" size={14} color="#05070A" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Yuborish</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveCard} className="space-y-3">
                  <h4 className="eyebrow">To‘lov rekvizitlari</h4>
                  <p className="text-[10px] text-ink-muted leading-relaxed -mt-1.5">
                    Bu karta raqami o‘quvchilarga to‘lov oynasida ko‘rinadi.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink-secondary">Karta raqami</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="field font-mono tracking-widest"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink-secondary">Karta egasi</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="field"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink-secondary">Bank nomi (ixtiyoriy)</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Masalan: Uzumbank"
                      className="field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isActionLoading === 'card_form'}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan to-cyan-light text-[#05070A] font-extrabold rounded-2xl shadow-cyanGlowSm active:scale-[0.98] transition-transform text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                  >
                    {isActionLoading === 'card_form' ? (
                      <InlineLoader variant="orbit" size={14} color="#05070A" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Saqlash</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
