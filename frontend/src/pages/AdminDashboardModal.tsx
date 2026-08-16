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
          cover_url: '/images/ai_course.jpg',
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

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    haptic.notification('success');
    showNotification('Karta rekvizitlari saqlandi!');
  };

  const fmtAmount = (n: number) => n.toLocaleString('uz-UZ');
  const fmtMln = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln';
    return fmtAmount(n);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1117] text-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/[0.08] max-h-[92vh] overflow-y-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#11161D] border border-cyan/30 text-cyan flex items-center justify-center shadow-cyanGlowSm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-bold text-white">Superadmin Panel</h3>
                <span className="bg-cyan/15 border border-cyan/30 text-cyan text-[9px] font-black px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Admin: <strong className="text-cyan">{stats?.admin_name || adminName}</strong>
                {stats && <span> • Baza: <strong className="text-slate-300">{stats.storage_backend}</strong></span>}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => { haptic.selection(); loadData(); }}
              className="w-8 h-8 rounded-full bg-[#11161D] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-cyan"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                haptic.impact('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#11161D] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-[#11161D] p-1 rounded-2xl border border-white/[0.06] text-[11px] font-bold">
          <button
            onClick={() => { haptic.selection(); setActiveTab('receipts'); }}
            className={`py-2 rounded-xl transition-all relative flex items-center justify-center space-x-1 ${
              activeTab === 'receipts' ? 'bg-cyan text-black shadow-cyanGlowSm' : 'text-slate-400 hover:text-white'
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
              activeTab === 'stats' ? 'bg-cyan text-black shadow-cyanGlowSm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Statistika</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('new_course'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'new_course' ? 'bg-cyan text-black shadow-cyanGlowSm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kurslar</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('students'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'students' ? 'bg-cyan text-black shadow-cyanGlowSm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Talabalar</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('broadcast'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'broadcast' ? 'bg-cyan text-black shadow-cyanGlowSm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast</span>
          </button>

          <button
            onClick={() => { haptic.selection(); setActiveTab('settings'); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'settings' ? 'bg-cyan text-black shadow-cyanGlowSm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Karta</span>
          </button>
        </div>

        {/* Global Notification Banner */}
        {isSuccess && (
          <div className="p-3 bg-cyan/15 border border-cyan/30 text-cyan rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <InlineLoader variant="orbit" size={24} color="#22D3EE" />
            <span className="text-xs">Ma'lumotlar yuklanmoqda...</span>
          </div>
        )}

        {/* TAB CONTENTS */}
        {!isLoading && (
          <div className="space-y-4">
            
            {/* TAB 1: RECEIPTS */}
            {activeTab === 'receipts' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    To‘lov Cheklari ({receipts.length})
                  </h4>
                  {pendingCount > 0 && (
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-bold px-2 py-0.5 rounded-full">
                      {pendingCount} ta kutilmoqda
                    </span>
                  )}
                </div>

                {receipts.length === 0 ? (
                  <div className="p-8 text-center bg-[#11161D] rounded-2xl border border-white/[0.06] space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-cyan mx-auto" />
                    <p className="text-xs text-white font-bold">Barcha cheklar ko‘rib chiqilgan</p>
                    <p className="text-[10px] text-slate-400">Yangi to‘lovlar bu yerda paydo bo‘ladi</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {receipts.map((receipt) => (
                      <div
                        key={receipt.order_id}
                        className="p-3 bg-[#11161D] rounded-2xl border border-white/[0.06] space-y-2.5 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-white text-xs block">{receipt.student_name}</strong>
                            <span className="text-[10px] text-slate-400">
                              @{receipt.username} • ID: <code className="text-cyan">{receipt.telegram_id}</code>
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              receipt.status === 'approved'
                                ? 'bg-cyan/15 text-cyan'
                                : receipt.status === 'rejected'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300 animate-pulse'
                            }`}
                          >
                            {receipt.status === 'approved' ? 'Tasdiqlangan' : receipt.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#0D1117] rounded-xl space-y-1 border border-white/[0.04]">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Kurs:</span>
                            <strong className="text-white text-right max-w-[200px] truncate">{receipt.course_title}</strong>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Summa:</span>
                            <strong className="text-cyan">{fmtAmount(receipt.amount)} so'm</strong>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">To‘lov:</span>
                            <span className="text-slate-300 uppercase">{receipt.payment_method}</span>
                          </div>
                        </div>

                        {/* Receipt Image Preview */}
                        {receipt.receipt_image && (
                          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] max-h-48 bg-black">
                            <img
                              src={receipt.receipt_image}
                              alt="To'lov cheki"
                              className="w-full object-contain max-h-48"
                            />
                          </div>
                        )}

                        {receipt.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleApprove(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="py-2.5 bg-cyan text-black rounded-xl text-xs font-black flex items-center justify-center space-x-1 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-cyanGlowSm"
                            >
                              {isActionLoading === receipt.order_id ? (
                                <InlineLoader variant="orbit" size={14} color="#000000" />
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
                              className="py-2.5 bg-red-500/15 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 hover:bg-red-500/25 active:scale-95 transition-all disabled:opacity-60"
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
                  <div className="p-3.5 bg-[#11161D] rounded-2xl border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Jami Tushum
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-lg font-black text-cyan">
                        {fmtMln(stats.total_revenue)}
                      </span>
                      <span className="text-[10px] text-slate-300">so'm</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#11161D] rounded-2xl border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Shu Oydagi Tushum
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-lg font-black text-cyan">
                        {fmtMln(stats.monthly_revenue)}
                      </span>
                      <span className="text-[10px] text-slate-300">so'm</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#11161D] rounded-2xl border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Jami O‘quvchilar
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-lg font-black text-white">
                        {fmtAmount(stats.total_students)}
                      </span>
                      <span className="text-[10px] text-slate-300">talaba</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#11161D] rounded-2xl border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Faol Kurslar
                    </span>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-lg font-black text-white">
                        {stats.active_courses_count}
                      </span>
                      <span className="text-[10px] text-slate-300">kurs</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Oxirgi Savdolar
                  </h4>
                  {stats.recent_sales.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">Hozircha savdo yo‘q</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recent_sales.map((sale) => (
                        <div key={sale.id} className="p-3 bg-[#11161D] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{sale.student_name}</span>
                            <span className="text-[10px] text-slate-400">{sale.course_title}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-cyan block">+{fmtAmount(sale.amount)} so'm</span>
                            <span className="text-[9px] text-slate-500">
                              {sale.payment_method.toUpperCase()} • {String(sale.date).slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COURSES MANAGEMENT */}
            {activeTab === 'new_course' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Mavjud Kurslar</span>
                    <span className="text-[10px] text-cyan">{courses.length} ta</span>
                  </h4>

                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div key={c.id} className="p-3 bg-[#11161D] rounded-2xl border border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <strong className="text-white block truncate">{c.title}</strong>
                          <span className="text-[10px] text-slate-400">
                            Ustoz: <strong className="text-cyan">{c.instructor_name}</strong> • {fmtAmount(c.price)} so'm
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCourse(c)}
                            className="px-3 py-1.5 bg-cyan text-black rounded-xl text-[10px] font-bold hover:opacity-90 transition-all shadow-cyanGlowSm"
                          >
                            Tahrirlash
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            disabled={isActionLoading === `del_${c.id}`}
                            className="px-2 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-[10px] font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            O‘chirish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit / Create Form */}
                <form onSubmit={handleSaveCourse} className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {editingCourseId ? 'Kursni Tahrirlash' : 'Yangi Kurs Yaratish'}
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white">Kurs nomi</label>
                    <input
                      type="text"
                      required
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Masalan: Sun'iy Intellekt va Prompt Engineering Pro"
                      className="w-full px-3 py-2.5 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white">Kategoriya</label>
                      <select
                        value={courseCategory}
                        onChange={(e) => setCourseCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-cyan font-bold"
                      >
                        <option value="AI" className="bg-[#11161D]">AI</option>
                        <option value="Dizayn" className="bg-[#11161D]">Dizayn</option>
                        <option value="Dasturlash" className="bg-[#11161D]">Dasturlash</option>
                        <option value="Marketing" className="bg-[#11161D]">Marketing</option>
                        <option value="Biznes" className="bg-[#11161D]">Biznes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white">Kirish Muddati</label>
                      <input
                        type="text"
                        disabled
                        value="1 yil (365 kun)"
                        className="w-full px-3 py-2 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-cyan font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white">Narxi (so'm)</label>
                      <input
                        type="number"
                        required
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                        placeholder="490000"
                        className="w-full px-3 py-2 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white">Eski narxi (so'm)</label>
                      <input
                        type="number"
                        value={courseOldPrice}
                        onChange={(e) => setCourseOldPrice(e.target.value)}
                        placeholder="890000"
                        className="w-full px-3 py-2 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white">Qisqa tavsif</label>
                    <input
                      type="text"
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Kurs haqida 1-2 jumla"
                      className="w-full px-3 py-2 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div className="flex space-x-2 pt-1">
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={resetCourseForm}
                        className="px-4 py-3 bg-[#11161D] text-slate-400 border border-white/[0.08] rounded-2xl font-bold text-xs hover:text-white"
                      >
                        Bekor qilish
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isActionLoading === 'course_form'}
                      className="flex-1 py-3 bg-cyan text-black font-black rounded-2xl shadow-cyanGlowSm hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                    >
                      {isActionLoading === 'course_form' ? (
                        <InlineLoader variant="orbit" size={14} color="#000000" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{editingCourseId ? 'O‘zgarishlarni Saqlash' : 'Kursni Yaratish'}</span>
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
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ro‘yxatdan O‘tgan Talabalar
                  </h4>
                  <span className="text-[10px] text-cyan">{students.length} ta</span>
                </div>

                {/* Grant kurs tanlash */}
                <div className="p-3 bg-[#11161D] rounded-2xl border border-white/[0.08] space-y-1.5">
                  <label className="text-[10px] font-bold text-cyan uppercase tracking-wider block">
                    Grant uchun kurs tanlang:
                  </label>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-cyan font-bold"
                  >
                    <option value="" className="bg-[#0D1117]">— Kurs tanlanmagan —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0D1117]">{c.title}</option>
                    ))}
                  </select>
                </div>

                {students.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Hozircha talaba yo‘q</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 bg-[#11161D] rounded-2xl border border-white/[0.06] space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-white block">{st.name}</strong>
                            <span className="text-[10px] text-slate-400">
                              @{st.username} • ID: <code className="text-cyan">{st.telegram_id}</code>
                            </span>
                          </div>
                          <span className="text-[10px] bg-[#0D1117] text-cyan font-bold px-2 py-0.5 rounded-full border border-white/[0.06]">
                            {st.overall_progress || '0%'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                          <span className="text-[10px] text-slate-400">
                            Kursi: <strong className="text-white">{st.enrolled_courses || '— Yangi'}</strong>
                          </span>
                          <button
                            onClick={() => handleManualEnroll(st.id, enrollCourseId)}
                            disabled={isActionLoading === `enroll_${st.id}`}
                            className="px-2.5 py-1 bg-cyan text-black font-bold rounded-lg text-[10px] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                          >
                            + Grant Kurs
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
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Barcha Foydalanuvchilarga Xabar (Broadcast)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Xabar Telegram Bot orqali barcha talabalarga yetkaziladi.
                  </p>
                </div>

                <textarea
                  rows={5}
                  required
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Xabarni kiriting: Masalan, Yangi kurslar yoki e'lon..."
                  className="w-full p-3 bg-[#11161D] border border-white/[0.08] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan resize-none leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={isActionLoading === 'broadcast'}
                  className="w-full py-3.5 bg-cyan text-black font-black rounded-2xl shadow-cyanGlowSm hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  {isActionLoading === 'broadcast' ? (
                    <InlineLoader variant="orbit" size={14} color="#000000" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>Xabarni Hamma Talabalarga Yuborish</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 6: SETTINGS (Karta) */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveCard} className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  To‘lov Rekvizitlari
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white">Karta raqami</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-cyan font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-white">Karta egasi</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#11161D] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-cyan"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-cyan text-black font-black rounded-2xl shadow-cyanGlowSm hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Rekvizitlarni Saqlash</span>
                </button>
              </form>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
