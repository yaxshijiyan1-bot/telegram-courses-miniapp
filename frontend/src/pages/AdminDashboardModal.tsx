import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  TrendingUp,
  Users,
  Plus,
  Video,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Check,
  Ban,
  Send,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';
import { AdminStats, PendingReceipt, AdminStudent, Course } from '../types';
import { InlineLoader } from 'generative-loaders';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminName
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'receipts' | 'new_course' | 'students' | 'broadcast' | 'settings'>('receipts');
  const { haptic } = useTelegram();

  // Yuklanish holatlari
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Real ma'lumotlar (backend'dan)
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [receipts, setReceipts] = useState<PendingReceipt[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Forma holatlari
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseOldPrice, setCourseOldPrice] = useState('');
  const [courseCategory, setCourseCategory] = useState('AI');
  const [courseDesc, setCourseDesc] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [cardNumber, setCardNumber] = useState('8600 5304 1234 5678');
  const [cardHolder, setCardHolder] = useState('Yaxshi Bola / Zuhra Olimova');
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

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const pendingCount = receipts.filter(r => r.status === 'pending').length;

  const handleApproveReceipt = async (orderId: string) => {
    haptic.impact('medium');
    setIsActionLoading(orderId);
    try {
      const res = await api.approveReceipt(orderId);
      showNotification(res.message || "To'lov tasdiqlandi va talabaga kurs ochildi! 🚀");
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Tasdiqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleRejectReceipt = async (orderId: string) => {
    haptic.impact('medium');
    setIsActionLoading(orderId);
    try {
      const res = await api.rejectReceipt(orderId);
      showNotification(res.message || 'To\'lov cheki rad etildi.');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Rad etishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const startEditCourse = (c: Course) => {
    haptic.selection();
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
          cover_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
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
    if (!confirm('Rostan ham bu kursni o\'chirmoqchimisiz?')) return;
    haptic.impact('heavy');
    setIsActionLoading(`del_${courseId}`);
    try {
      const res = await api.deleteCourse(courseId);
      showNotification(res.message || 'Kurs o\'chirildi');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'O\'chirishda xatolik');
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
      showNotification(res.message || `Xabar ${res.sent_count} ta foydalanuvchiga yuborildi! 📢`);
      setBroadcastText('');
    } catch (e: any) {
      showError(e?.message || 'Broadcast yuborishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact('medium');
    setIsActionLoading('settings');
    try {
      await api.savePaymentSettings(cardNumber, cardHolder, 'Uzcard / Humo');
      showNotification("To'lov rekvizitlari muvaffaqiyatli saqlandi! 💳");
    } catch (e: any) {
      showError(e?.message || 'Saqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleManualEnroll = async (student: AdminStudent) => {
    if (!enrollCourseId) {
      showError('Avval yuqoridan kurs tanlang, so\'ngra talabaga bering.');
      return;
    }
    haptic.impact('light');
    setIsActionLoading(`enroll_${student.id}`);
    try {
      const res = await api.manualEnroll(String(student.telegram_id || student.id), enrollCourseId);
      showNotification(res.message || `${student.name} ga kurs biriktirildi!`);
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Biriktirishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const fmtAmount = (n: number) => n?.toLocaleString?.('uz-UZ') ?? String(n);
  const fmtMln = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} mln` : fmtAmount(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-brand-border space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-forest text-brand-gold flex items-center justify-center shadow-soft">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-bold text-brand-dark">Superadmin Dashboard</h3>
                <span className="bg-brand-mint text-brand-emerald text-[9px] font-bold px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-brand-secondary">
                Admin: <strong className="text-brand-emerald">{stats?.admin_name || adminName}</strong>
                {stats && <span> • Baza: <strong>{stats.storage_backend}</strong></span>}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => { haptic.selection(); loadData(); }}
              className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center text-brand-secondary hover:text-brand-emerald"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-brand-surface p-1 rounded-2xl border border-brand-border text-[11px] font-bold">
          <button
            onClick={() => { haptic.selection(); setActiveTab('receipts'); }}
            className={`py-2 rounded-xl transition-all relative flex items-center justify-center space-x-1 ${
              activeTab === 'receipts' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cheklar</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-2 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('stats'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'stats' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Statistika</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('new_course'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'new_course' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kurslar</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('students'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'students' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Talabalar</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('broadcast'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'broadcast' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('settings'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'settings' ? 'bg-brand-emerald text-white shadow-sm' : 'text-brand-secondary'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Karta</span>
          </button>
        </div>

        {/* Global Notification Banner */}
        {isSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <InlineLoader variant="orbit" size={32} color="#159A6B" />
            <span className="text-xs text-brand-secondary font-semibold">Admin ma'lumotlari yuklanmoqda...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: PENDING RECEIPTS */}
            {activeTab === 'receipts' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    Tasdiq Kutayotgan To'lov Cheklari
                  </h4>
                  <span className="text-[10px] text-brand-secondary">
                    {pendingCount} ta yangi
                  </span>
                </div>

                {receipts.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-brand-emerald/40 mx-auto" />
                    <p className="text-xs text-brand-secondary">
                      Hozircha kutilayotgan chek yo'q — barchasi ko'rib chiqilgan ✨
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receipts.map((receipt) => (
                      <div
                        key={receipt.order_id}
                        className="p-3.5 bg-brand-surface rounded-2xl border border-brand-border/80 space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-brand-dark">{receipt.student_name}</span>
                              {receipt.username && (
                                <a
                                  href={`https://t.me/${receipt.username}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-brand-emerald hover:underline"
                                >
                                  @{receipt.username}
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] text-brand-secondary">ID: {receipt.telegram_id} • {receipt.order_id}</span>
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                            receipt.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            receipt.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700 animate-pulse'
                          }`}>
                            {receipt.status === 'approved' ? 'Tasdiqlangan' :
                             receipt.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-brand-border/60 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-brand-secondary">Kurs:</span>
                            <strong className="text-brand-dark text-right">{receipt.course_title}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-brand-secondary">Summa & Tizim:</span>
                            <strong className="text-brand-emerald">{fmtAmount(receipt.amount)} so'm ({receipt.payment_method.toUpperCase()})</strong>
                          </div>
                          {receipt.comment && (
                            <div className="text-[11px] text-brand-muted italic pt-1 border-t border-brand-border/40">
                              "{receipt.comment}"
                            </div>
                          )}
                        </div>

                        {/* Chek rasmi */}
                        {receipt.receipt_image && (
                          <a href={receipt.receipt_image} target="_blank" rel="noreferrer" className="block relative rounded-xl overflow-hidden border border-brand-border max-h-36">
                            <img
                              src={receipt.receipt_image}
                              alt="To'lov cheki"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        )}

                        {/* Actions */}
                        {receipt.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleApproveReceipt(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="py-2 bg-brand-emerald text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-sm hover:bg-brand-deep active:scale-95 transition-all disabled:opacity-60"
                            >
                              {isActionLoading === receipt.order_id ? (
                                <InlineLoader variant="orbit" size={14} color="#ffffff" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tasdiqlash</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectReceipt(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-60"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Rad etish</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STATS */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-gradient-to-br from-brand-mint to-brand-surface rounded-2xl border border-brand-border/60">
                    <span className="text-[10px] text-brand-secondary font-semibold uppercase block">
                      Jami Tushum
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-base font-bold font-serif text-brand-emerald">
                        {fmtMln(stats.total_revenue)}
                      </span>
                      <span className="text-[10px] text-brand-dark">so'm</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-amber-50 to-brand-surface rounded-2xl border border-brand-border/60">
                    <span className="text-[10px] text-brand-secondary font-semibold uppercase block">
                      Shu Oydagi Tushum
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-base font-bold font-serif text-amber-700">
                        {fmtMln(stats.monthly_revenue)}
                      </span>
                      <span className="text-[10px] text-brand-dark">so'm</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-brand-mint to-brand-surface rounded-2xl border border-brand-border/60">
                    <span className="text-[10px] text-brand-secondary font-semibold uppercase block">
                      Jami O'quvchilar
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-base font-bold font-serif text-brand-emerald">
                        {fmtAmount(stats.total_students)}
                      </span>
                      <span className="text-[10px] text-brand-dark">talaba</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-amber-50 to-brand-surface rounded-2xl border border-brand-border/60">
                    <span className="text-[10px] text-brand-secondary font-semibold uppercase block">
                      Faol Kurslar
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-base font-bold font-serif text-amber-700">
                        {stats.active_courses_count}
                      </span>
                      <span className="text-[10px] text-brand-dark">kurs</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    Oxirgi Savdolar
                  </h4>
                  {stats.recent_sales.length === 0 ? (
                    <p className="text-xs text-brand-secondary py-3 text-center">Hozircha savdo yo'q</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recent_sales.map((sale) => (
                        <div key={sale.id} className="p-2.5 bg-brand-surface rounded-xl border border-brand-border/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-brand-dark block">{sale.student_name}</span>
                            <span className="text-[10px] text-brand-secondary">{sale.course_title}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-brand-emerald block">+{fmtAmount(sale.amount)} so'm</span>
                            <span className="text-[9px] text-brand-muted">
                              {sale.payment_method.toUpperCase()} • {sale.status} • {String(sale.date).slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COURSES MANAGEMENT & EDITING */}
            {activeTab === 'new_course' && (
              <div className="space-y-4">
                {/* Existing Courses */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center justify-between">
                    <span>Mavjud Kurslar (Jonli Baza)</span>
                    <span className="text-[10px] text-brand-emerald font-normal">{courses.length} ta</span>
                  </h4>

                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div key={c.id} className="p-3 bg-brand-surface rounded-2xl border border-brand-border/80 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <strong className="text-brand-dark block truncate">{c.title}</strong>
                          <span className="text-[10px] text-brand-secondary">
                            Ustoz: <strong className="text-brand-emerald">{c.instructor_name}</strong> • {fmtAmount(c.price)} so'm
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCourse(c)}
                            className="px-2.5 py-1.5 bg-brand-emerald text-white rounded-xl text-[10px] font-bold hover:bg-brand-deep transition-all"
                          >
                            Tahrirlash
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            disabled={isActionLoading === `del_${c.id}`}
                            className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                          >
                            O'chirish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit / Create Form */}
                <form onSubmit={handleSaveCourse} className="space-y-2.5 pt-2 border-t border-brand-border/60">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    {editingCourseId ? 'Kursni Tahrirlash' : 'Yangi Kurs Yaratish'}
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-dark">Kurs nomi</label>
                    <input
                      type="text"
                      required
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Masalan: Sun'iy Intellekt va Prompt Engineering Pro"
                      className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-dark">Kategoriya</label>
                      <select
                        value={courseCategory}
                        onChange={(e) => setCourseCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald font-bold"
                      >
                        <option value="AI">AI</option>
                        <option value="Dizayn">Dizayn</option>
                        <option value="Dasturlash">Dasturlash</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Biznes">Biznes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-dark">Kirish Muddati</label>
                      <input
                        type="text"
                        disabled
                        value="1 yil (365 kun)"
                        className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-secondary font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-dark">Narxi (so'm)</label>
                      <input
                        type="number"
                        required
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                        placeholder="490000"
                        className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-dark">Eski narxi (so'm)</label>
                      <input
                        type="number"
                        value={courseOldPrice}
                        onChange={(e) => setCourseOldPrice(e.target.value)}
                        placeholder="890000"
                        className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-dark">Qisqa tavsif</label>
                    <input
                      type="text"
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Kurs haqida 1-2 jumla"
                      className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                    />
                  </div>

                  {/* R2 Media Upload Indicator */}
                  <div className="p-3 bg-brand-mint/30 rounded-2xl border border-brand-emerald/30 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                      <span className="flex items-center space-x-1">
                        <Video className="w-4 h-4 text-brand-emerald" />
                        <span>Cloudflare R2 Video / Media</span>
                      </span>
                      <span className="text-[10px] text-brand-emerald bg-brand-mint px-2 py-0.5 rounded-full font-bold">
                        Zero Egress
                      </span>
                    </div>
                    <p className="text-[10px] text-brand-secondary">
                      Dars videolari Cloudflare R2 ga xavfsiz yuklanadi, ma'lumotlar esa bazaga saqlanadi.
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={resetCourseForm}
                        className="px-4 py-3 bg-brand-surface text-brand-secondary border border-brand-border rounded-2xl font-bold text-xs"
                      >
                        Bekor qilish
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isActionLoading === 'course_form'}
                      className="flex-1 py-3 bg-brand-emerald text-white font-bold rounded-2xl shadow-soft hover:bg-brand-deep active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                    >
                      {isActionLoading === 'course_form' ? (
                        <InlineLoader variant="orbit" size={14} color="#ffffff" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{editingCourseId ? 'O\'zgarishlarni Saqlash' : 'Kursni Yaratish'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: STUDENTS CRM */}
            {activeTab === 'students' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    Ro'yxatdan O'tgan Talabalar
                  </h4>
                  <span className="text-[10px] text-brand-secondary">{students.length} ta</span>
                </div>

                {/* Grant kurs tanlash */}
                <div className="p-2.5 bg-brand-mint/30 rounded-2xl border border-brand-emerald/30 space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dark uppercase">
                    Grant uchun kurs tanlang:
                  </label>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald font-bold"
                  >
                    <option value="">— Kurs tanlanmagan —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {students.length === 0 ? (
                  <p className="text-xs text-brand-secondary py-6 text-center">Hozircha talaba yo'q</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 bg-brand-surface rounded-2xl border border-brand-border/80 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-brand-dark block">
                              {st.name}
                              {st.role === 'superadmin' && (
                                <span className="ml-1.5 text-[9px] bg-brand-forest text-brand-gold px-1.5 py-0.5 rounded-full">ADMIN</span>
                              )}
                            </strong>
                            <span className="text-[10px] text-brand-secondary">
                              {st.username ? `@${st.username} • ` : ''}ID: {st.telegram_id}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-brand-emerald bg-brand-mint px-2 py-0.5 rounded-full">
                            {st.overall_progress}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-brand-border/40 text-[11px]">
                          <span className="text-brand-secondary">
                            Kursi: {st.enrolled_courses || '—'} • {st.status}
                          </span>
                          <button
                            onClick={() => handleManualEnroll(st)}
                            disabled={isActionLoading === `enroll_${st.id}`}
                            className="px-2 py-1 bg-brand-emerald/20 text-brand-emerald font-bold rounded-lg hover:bg-brand-emerald hover:text-white transition-all text-[10px] disabled:opacity-50"
                          >
                            {isActionLoading === `enroll_${st.id}` ? '...' : '+ Grant Kurs'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: BROADCAST */}
            {activeTab === 'broadcast' && (
              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    Barcha Talabalarga Xabar Yuborish (Broadcast)
                  </h4>
                  <p className="text-[11px] text-brand-secondary mt-0.5">
                    Xabar @kurslarimizbot orqali barcha ro'yxatdan o'tgan foydalanuvchilarga yetkaziladi.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">Xabar matni</label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Assalomu alaykum hurmatli talabalar! Bugun yangi bonus modul..."
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isActionLoading === 'broadcast'}
                  className="w-full py-3 bg-brand-emerald text-white font-bold rounded-2xl shadow-soft hover:bg-brand-deep active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  {isActionLoading === 'broadcast' ? (
                    <InlineLoader variant="orbit" size={14} color="#ffffff" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Ommaviy Xabarni Yuborish</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 6: PAYMENT SETTINGS */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSavePaymentSettings} className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                    To'lov Karta Rekvizitlari
                  </h4>
                  <p className="text-[11px] text-brand-secondary mt-0.5">
                    Talabalar to'lov qilganda ko'rinadigan karta raqami va karta egasi.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">Karta Raqami</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs font-mono text-brand-text focus:outline-none focus:border-brand-emerald"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">Karta Egasi Ism-Familiyasi</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-brand-emerald"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isActionLoading === 'settings'}
                  className="w-full py-3 bg-brand-emerald text-white font-bold rounded-2xl shadow-soft hover:bg-brand-deep active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  {isActionLoading === 'settings' ? (
                    <InlineLoader variant="orbit" size={14} color="#ffffff" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Rekvizitlarni Saqlash</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
