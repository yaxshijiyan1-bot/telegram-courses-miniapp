import React, { useState, useEffect, useCallback } from 'react';
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
  BookOpen,
  ReceiptText,
  Megaphone,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Upload,
  Maximize2,
  ChevronRight,
  Sparkles,
  Bot,
  Search,
  Zap,
  CheckCheck
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { api } from '../services/api';
import { AdminStats, PendingReceipt, AdminStudent, Course } from '../types';
import { InlineLoader } from 'generative-loaders';
import { formatPrice } from '../utils/format';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
}

type AdminTab = 'receipts' | 'courses' | 'stats' | 'students' | 'broadcast' | 'settings';

const TABS: { id: AdminTab; label: string; icon: typeof Clock }[] = [
  { id: 'receipts', label: 'Cheklar', icon: ReceiptText },
  { id: 'courses', label: 'Kurslar', icon: BookOpen },
  { id: 'stats', label: 'Statistika', icon: TrendingUp },
  { id: 'students', label: 'Talabalar', icon: Users },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'settings', label: 'Karta', icon: CreditCard },
];

const PRESET_COVERS = [
  { url: '/images/hero_books.jpg', label: '3D Kitoblar & Muhr' },
  { url: '/images/course_design.jpg', label: '3D Dizayn & Lenta' },
  { url: '/images/course_biz.jpg', label: '3D Biznes & Yulduz' },
  { url: '/images/course_marketing.jpg', label: '3D Marketing Lamp' },
  { url: '/images/hero_seal.webp', label: '3D Gradient Muhr' },
  { url: '/images/hero_grad.webp', label: '3D Bitiruv' },
  { url: '/images/ai_course.jpg', label: '3D AI & Data' },
  { url: '/images/code_course.jpg', label: '3D Kod Terminal' },
  { url: '/images/market_course.jpg', label: '3D Growth Chart' },
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

  // AI Course Generator States
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('AI');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Student Search Filter
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Course Form States
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('AI');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseOldPrice, setCourseOldPrice] = useState('');
  const [courseDuration, setCourseDuration] = useState('20 soat');
  const [courseLessonsCount, setCourseLessonsCount] = useState('24');
  const [courseLevel, setCourseLevel] = useState("Boshlang'ich va Professional");
  const [courseChannelId, setCourseChannelId] = useState('');
  const [courseCoverUrl, setCourseCoverUrl] = useState('/images/hero_books.jpg');
  const [courseDesc, setCourseDesc] = useState('');

  // Other States
  const [broadcastText, setBroadcastText] = useState('');
  const [cardNumber, setCardNumber] = useState('8600 5304 1234 5678');
  const [cardHolder, setCardHolder] = useState('Yaxshi Bola / Zuhra Olimova');
  const [bankName, setBankName] = useState('Kapitalbank / TBC');
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [zoomedReceipt, setZoomedReceipt] = useState<PendingReceipt | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setIsSuccess(true);
    setErrorMsg('');
    haptic?.notification?.('success');
    setTimeout(() => {
      setIsSuccess(false);
      setSuccessMsg('');
    }, 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setIsSuccess(false);
    haptic?.notification?.('error');
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
      api.getPaymentInfo().then(info => {
        if (info) {
          if (info.card_number) setCardNumber(info.card_number);
          if (info.card_holder) setCardHolder(info.card_holder);
          if (info.bank_name) setBankName(info.bank_name);
        }
      }).catch(() => {});
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const pendingCount = receipts.filter(r => r.status === 'pending').length;

  const handleApprove = async (orderId: string) => {
    haptic?.impact?.('heavy');
    setIsActionLoading(orderId);
    try {
      const res = await api.approveReceipt(orderId);
      showNotification(res.message || 'Chek tasdiqlandi va talabaga darslar ochildi!');
      if (zoomedReceipt?.order_id === orderId) setZoomedReceipt(null);
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Tasdiqlashda xatolik yuz berdi');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    haptic?.impact?.('medium');
    setIsActionLoading(orderId);
    try {
      const res = await api.rejectReceipt(orderId);
      showNotification(res.message || 'Chek rad etildi');
      if (zoomedReceipt?.order_id === orderId) setZoomedReceipt(null);
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Rad etishda xatolik yuz berdi');
    } finally {
      setIsActionLoading(null);
    }
  };

  // AI Bilan Kurs Yaratish Funksiyasi (OpenRouter stealth/ox-alpha)
  const handleGenerateCourseWithAI = async () => {
    if (!aiTopic.trim()) {
      showError('Iltimos, yaratmoqchi bo‘lgan kurs mavzusini kiriting!');
      return;
    }

    haptic?.impact?.('heavy');
    setIsAiGenerating(true);
    try {
      const result = await api.generateCourseWithAI(aiTopic.trim(), aiCategory);
      if (result && result.data) {
        const d = result.data;
        setCourseTitle(d.title || aiTopic);
        setCourseCategory(d.category || aiCategory);
        setCoursePrice(String(d.price || 490000));
        setCourseOldPrice(String(d.old_price || 890000));
        setCourseDuration(d.duration || '24 soat');
        setCourseLessonsCount(String(d.lesson_count || 18));
        setCourseLevel(d.level || "Boshlang'ich va Professional");
        setCourseDesc(d.description || d.short_description || '');
        
        // Category bo'yicha muqova tanlaymiz
        if (d.category === 'Dizayn') setCourseCoverUrl('/images/course_design.jpg');
        else if (d.category === 'Biznes') setCourseCoverUrl('/images/course_biz.jpg');
        else if (d.category === 'Marketing') setCourseCoverUrl('/images/course_marketing.jpg');
        else if (d.category === 'Dasturlash') setCourseCoverUrl('/images/code_course.jpg');
        else setCourseCoverUrl('/images/ai_course.jpg');

        showNotification(`✨ stealth/ox-alpha kurs tuzilmasini yaratdi! Quyida tekshirib saqlang.`);
        setAiTopic('');
      }
    } catch (e: any) {
      showError(e?.message || 'AI orqali yaratishda xatolik');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const startEditCourse = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseTitle(c.title);
    setCoursePrice(String(c.price));
    setCourseOldPrice(c.old_price ? String(c.old_price) : '');
    setCourseCategory(c.category || 'AI');
    setCourseDuration(c.duration || '20 soat');
    setCourseLessonsCount(String(c.lesson_count || 24));
    setCourseLevel(c.level || "Boshlang'ich va Professional");
    setCourseChannelId(c.telegram_channel_id ? String(c.telegram_channel_id) : '');
    setCourseCoverUrl(c.cover_url || '/images/hero_books.jpg');
    setCourseDesc(c.description || c.short_description || '');
    setActiveTab('courses');
    haptic?.selection?.();
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCoursePrice('');
    setCourseOldPrice('');
    setCourseDuration('20 soat');
    setCourseLessonsCount('24');
    setCourseChannelId('');
    setCourseCoverUrl('/images/hero_books.jpg');
    setCourseDesc('');
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic?.impact?.('heavy');
    setIsActionLoading('course_form');
    try {
      let res;
      if (editingCourseId) {
        res = await api.updateCourse(editingCourseId, {
          title: courseTitle,
          price: parseInt(coursePrice) || 0,
          old_price: courseOldPrice ? parseInt(courseOldPrice) : null,
          category: courseCategory,
          duration: courseDuration,
          lesson_count: parseInt(courseLessonsCount) || 12,
          level: courseLevel,
          cover_url: courseCoverUrl,
          description: courseDesc,
          short_description: courseDesc.slice(0, 120),
          telegram_channel_id: courseChannelId.trim() || null
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
          duration: courseDuration,
          lesson_count: parseInt(courseLessonsCount) || 12,
          level: courseLevel,
          cover_url: courseCoverUrl,
          description: courseDesc || courseTitle,
          short_description: courseDesc.slice(0, 120) || courseTitle,
          instructor_name: 'Course Academy',
          instructor_title: 'Katta Ekspert',
          telegram_channel_id: courseChannelId.trim() || undefined
        } as Partial<Course>);
      }
      showNotification(res.message || 'Kurs muvaffaqiyatli saqlandi!');
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
    haptic?.impact?.('heavy');
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

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCourseCoverUrl(reader.result as string);
        haptic?.notification?.('success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    haptic?.impact?.('heavy');
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
      showError('Iltimos, avval ochiladigan kursni tanlang!');
      return;
    }
    haptic?.impact?.('heavy');
    setIsActionLoading(`enroll_${studentId}`);
    try {
      const res = await api.manualEnroll(studentId, courseId);
      showNotification(res.message || 'Kurs ochildi!');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Kursni ochishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSaveCardSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic?.impact?.('heavy');
    setIsActionLoading('settings');
    try {
      await api.savePaymentSettings(cardNumber, cardHolder, bankName);
      showNotification('To‘lov rekvizitlari muvaffaqiyatli saqlandi!');
    } catch (e: any) {
      showError(e?.message || 'Saqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const filteredStudents = students.filter(st => {
    const q = studentSearchQuery.toLowerCase();
    return (
      (st.name || '').toLowerCase().includes(q) ||
      (st.username || '').toLowerCase().includes(q) ||
      String(st.telegram_id || '').includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col w-full h-full min-h-screen overflow-hidden animate-fade-up">
      {/* 1. iOS 27 Top Header */}
      <header className="px-4 py-3 bg-white/95 backdrop-blur-2xl border-b border-slate-200/90 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-sm font-extrabold text-slate-900">Superadmin Paneli</h2>
              <span className="badge-cyan text-[9px] py-0.5 px-2 font-black">2026 LIVE</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Admin: <b className="text-sky-600">{stats?.admin_name || adminName}</b>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => { haptic?.selection?.(); loadData(); }}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              haptic?.impact?.('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Horizontal Navigation Tabs */}
      <div className="px-3 py-2 bg-white border-b border-slate-200/80 flex space-x-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic?.selection?.();
                setActiveTab(tab.id);
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25 border-sky-600'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'receipts' && pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 ml-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Global Toast Notifications */}
      {isSuccess && (
        <div className="mx-4 mt-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 flex-shrink-0 animate-fade-up shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center space-x-2 flex-shrink-0 animate-fade-up shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <InlineLoader variant="orbit" size={28} color="#0284C7" />
            <span className="text-xs font-medium">Ma'lumotlar yuklanmoqda...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: RECEIPTS */}
            {activeTab === 'receipts' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    To‘lov Cheklari ({receipts.length})
                  </h3>
                  {pendingCount > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-0.5 rounded-full">
                      {pendingCount} ta kutilmoqda
                    </span>
                  )}
                </div>

                {receipts.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200/90 rounded-3xl space-y-2 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-sky-500 mx-auto" />
                    <b className="text-xs text-slate-800 block font-bold">Barcha cheklar ko‘rib chiqilgan</b>
                    <p className="text-[11px] text-slate-500">Yangi to‘lovlar shu yerda paydo bo‘ladi.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receipts.map((receipt) => (
                      <div
                        key={receipt.order_id}
                        className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-3 text-xs shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-slate-900 text-xs block font-bold">{receipt.student_name}</strong>
                            <span className="text-[11px] text-slate-500">
                              @{receipt.username} • ID: <code className="text-sky-600 font-bold">{receipt.telegram_id}</code>
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              receipt.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : receipt.status === 'rejected'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {receipt.status === 'approved' ? 'Tasdiqlangan' : receipt.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-[11px] border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Kurs:</span>
                            <b className="text-slate-900 truncate max-w-[200px]">{receipt.course_title}</b>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Summa:</span>
                            <b className="text-sky-600">{formatPrice(receipt.amount)}</b>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">To‘lov usuli:</span>
                            <span className="text-slate-900 uppercase font-mono">{receipt.payment_method}</span>
                          </div>
                        </div>

                        {/* Receipt Screenshot Preview */}
                        {receipt.receipt_image && (
                          <div
                            onClick={() => setZoomedReceipt(receipt)}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-36 bg-slate-100 cursor-pointer group"
                          >
                            <img
                              src={receipt.receipt_image}
                              alt="To'lov cheki"
                              className="w-full object-contain max-h-36 transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold space-x-1">
                              <Maximize2 className="w-4 h-4" />
                              <span>Kattalashtirish</span>
                            </div>
                          </div>
                        )}

                        {receipt.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleApprove(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center space-x-1"
                            >
                              {isActionLoading === receipt.order_id ? (
                                <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Tasdiqlash</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(receipt.order_id)}
                              disabled={isActionLoading === receipt.order_id}
                              className="py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1 hover:bg-red-100 active:scale-95 transition-all"
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

            {/* TAB 2: COURSES MANAGEMENT & AI BUILDER */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                {/* 1-Click AI Course Creator */}
                <div className="bg-gradient-to-br from-sky-50 via-cyan-50/50 to-blue-50 border border-sky-200/90 p-4 rounded-3xl space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>AI Bilan 1-Bosishda Kurs Yaratish</span>
                        <span className="text-[9px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold">stealth/ox-alpha</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">Mavzuni yozing, AI to'liq darslar rejasini tuzib beradi</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Masalan: Next.js 15 Fullstack Dasturlash yoki AI SMM..."
                      className="glass-input w-full bg-white text-xs"
                      disabled={isAiGenerating}
                    />

                    <div className="flex items-center space-x-2">
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        className="glass-input bg-white text-xs py-2"
                        disabled={isAiGenerating}
                      >
                        <option value="AI">AI</option>
                        <option value="Dasturlash">Dasturlash</option>
                        <option value="Dizayn">Dizayn</option>
                        <option value="Biznes">Biznes</option>
                        <option value="Marketing">Marketing</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleGenerateCourseWithAI}
                        disabled={isAiGenerating || !aiTopic.trim()}
                        className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        {isAiGenerating ? (
                          <div className="flex items-center space-x-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>ox-alpha o'ylamoqda...</span>
                          </div>
                        ) : (
                          <>
                            <Bot className="w-3.5 h-3.5" />
                            <span>AI Yordamida Yaratish</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Course Edit/Create Form */}
                <form onSubmit={handleSaveCourse} className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-3.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-600" />
                      <span>{editingCourseId ? 'Kursni Tahrirlash' : 'Kurs Tafsilotlari'}</span>
                    </h4>
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={resetCourseForm}
                        className="text-[11px] text-sky-600 font-bold hover:underline"
                      >
                        + Yangi forma
                      </button>
                    )}
                  </div>

                  {/* Course Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Kurs Nomi</label>
                    <input
                      type="text"
                      required
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Masalan: AI & Prompt Engineering Masterclass"
                      className="glass-input w-full"
                    />
                  </div>

                  {/* Category & Prices */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Kategoriya</label>
                      <select
                        value={courseCategory}
                        onChange={(e) => setCourseCategory(e.target.value)}
                        className="glass-input w-full text-xs"
                      >
                        <option value="AI">AI</option>
                        <option value="Dizayn">Dizayn</option>
                        <option value="Biznes">Biznes</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Dasturlash">Dasturlash</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Narxi (so'm)</label>
                      <input
                        type="number"
                        required
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                        placeholder="490000"
                        className="glass-input w-full font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Eski narxi</label>
                      <input
                        type="number"
                        value={courseOldPrice}
                        onChange={(e) => setCourseOldPrice(e.target.value)}
                        placeholder="890000"
                        className="glass-input w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Duration & Lessons Count & Level */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Davomiyligi</label>
                      <input
                        type="text"
                        value={courseDuration}
                        onChange={(e) => setCourseDuration(e.target.value)}
                        placeholder="24 soat"
                        className="glass-input w-full text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Darslar soni</label>
                      <input
                        type="number"
                        value={courseLessonsCount}
                        onChange={(e) => setCourseLessonsCount(e.target.value)}
                        placeholder="28"
                        className="glass-input w-full font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Daraja</label>
                      <input
                        type="text"
                        value={courseLevel}
                        onChange={(e) => setCourseLevel(e.target.value)}
                        placeholder="Boshlang'ich"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Yopiq kanal ID (ixtiyoriy)</label>
                    <input
                      type="text"
                      value={courseChannelId}
                      onChange={(e) => setCourseChannelId(e.target.value)}
                      placeholder="-1001234567890"
                      className="glass-input w-full font-mono text-xs"
                    />
                    <p className="text-[10px] leading-snug text-slate-500">
                      Bot kanalga admin bo‘lganda yuborgan ID ni kiriting. Xaridorlar faqat shu kanalga xavfsiz qo‘shiladi.
                    </p>
                  </div>

                  {/* 3D Cover Image Selector */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-sky-600" />
                        <span>Kurs Muqovasi (3D Rasm)</span>
                      </label>
                      <label className="text-[10px] text-sky-600 font-bold cursor-pointer hover:underline flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Fayl yuklash</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Active Selected Image Preview */}
                    <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-slate-200">
                        <img src={courseCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 block">Joriy rasm manzili:</span>
                        <input
                          type="text"
                          value={courseCoverUrl}
                          onChange={(e) => setCourseCoverUrl(e.target.value)}
                          className="w-full bg-transparent text-[11px] text-slate-900 font-mono outline-none truncate"
                        />
                      </div>
                    </div>

                    {/* Preset 3D Gallery Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block font-medium">
                        Tayyor 3D modellardan tanlang:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                        {PRESET_COVERS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              haptic?.selection?.();
                              setCourseCoverUrl(preset.url);
                            }}
                            className={`p-1.5 rounded-xl border text-left flex items-center space-x-1.5 transition-all ${
                              courseCoverUrl === preset.url
                                ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                            <span className="text-[9px] truncate font-medium">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Course Full Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Kurs Haqida To‘liq Ma'lumot</label>
                    <textarea
                      rows={3}
                      required
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Kursning maqsadi, amaliy loyihalar va o'quv rejasini batafsil yozing..."
                      className="glass-input w-full text-xs leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isActionLoading === 'course_form'}
                    className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center space-x-1.5"
                  >
                    {isActionLoading === 'course_form' ? (
                      <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{editingCourseId ? 'O‘zgarishlarni Saqlash' : 'Kursni Nashr Qilish'}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Existing Courses List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider px-1">
                    Mavjud Kurslar ({courses.length})
                  </h4>

                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white border border-slate-200/90 p-3 rounded-2xl flex items-center justify-between space-x-3 shadow-sm"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={c.cover_url}
                            alt={c.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="badge-cyan text-[8px] py-0 px-1.5 font-bold">{c.category}</span>
                            <h5 className="text-xs font-bold text-slate-900 truncate mt-0.5">{c.title}</h5>
                            <span className="text-[10px] text-sky-600 font-extrabold block">{formatPrice(c.price)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCourse(c)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition-colors"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            disabled={isActionLoading === `del_${c.id}`}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STATS */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Tushum</span>
                    <b className="text-lg font-extrabold text-sky-600 block">{formatPrice(stats.total_revenue)}</b>
                  </div>

                  <div className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Shu Oydagi Tushum</span>
                    <b className="text-lg font-extrabold text-sky-600 block">{formatPrice(stats.monthly_revenue)}</b>
                  </div>

                  <div className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Talabalar</span>
                    <b className="text-lg font-extrabold text-slate-900 block">{stats.total_students} ta</b>
                  </div>

                  <div className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-1 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Faol Kurslar</span>
                    <b className="text-lg font-extrabold text-slate-900 block">{stats.active_courses_count} ta</b>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STUDENTS CRM & SEARCH */}
            {activeTab === 'students' && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Talabani ism, @username yoki ID bo'yicha qidirish..."
                    className="glass-input w-full pl-9 bg-white text-xs"
                  />
                </div>

                {/* Grant Assignment Selector */}
                <div className="bg-white border border-slate-200/90 p-3 rounded-2xl space-y-1.5 shadow-sm">
                  <label className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                    Grant / Kurs biriktirish uchun kurs tanlang:
                  </label>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="glass-input w-full text-xs"
                  >
                    <option value="">— Kursni tanlang —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Students List */}
                <div className="space-y-2">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-500">
                      Talabalar topilmadi.
                    </div>
                  ) : (
                    filteredStudents.map((st) => (
                      <div key={st.id} className="bg-white border border-slate-200/90 p-3.5 rounded-2xl space-y-2 text-xs shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-slate-900 block font-bold">{st.name}</strong>
                            <span className="text-[10px] text-slate-500">
                              @{st.username || 'noma\'lum'} • ID: <code className="text-sky-600 font-bold">{st.telegram_id}</code>
                            </span>
                          </div>
                          <span className="badge-cyan text-[9px] py-0.5 px-2">{st.overall_progress || '0%'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500">
                            Kurs: <b className="text-slate-900">{st.enrolled_courses || '— Yangi'}</b>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleManualEnroll(st.id, enrollCourseId)}
                            disabled={isActionLoading === `enroll_${st.id}`}
                            className="px-3 py-1.5 bg-sky-600 text-white font-extrabold rounded-xl text-[10px] hover:bg-sky-700 active:scale-95 transition-transform"
                          >
                            + Grant Ochish
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: BROADCAST */}
            {activeTab === 'broadcast' && (
              <form onSubmit={handleSendBroadcast} className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Barcha Bot Talabalariga Xabar Yuborish
                </h4>
                <textarea
                  rows={4}
                  required
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Xabarni kiriting (yangi darslar, chegirma yoki e'lon)..."
                  className="glass-input w-full text-xs leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={isActionLoading === 'broadcast'}
                  className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Xabarni Hammaga Yuborish</span>
                </button>
              </form>
            )}

            {/* TAB 6: SETTINGS (PAYMENT CARDS) */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveCardSettings} className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  To‘lov Rekvizitlari Sozlamalari
                </h4>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Karta Raqami</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="glass-input w-full font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Karta Egasi</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Bank Nomi</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isActionLoading === 'settings'}
                  className="btn-primary w-full py-3 text-xs font-extrabold"
                >
                  <span>Rekvizitlarni Saqlash</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* 5. Receipt Zoom Modal */}
      {zoomedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-up">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{zoomedReceipt.student_name} cheki</span>
              <button
                type="button"
                onClick={() => setZoomedReceipt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-200">
              <img
                src={zoomedReceipt.receipt_image}
                alt="Chek Full"
                className="w-full object-contain"
              />
            </div>

            {zoomedReceipt.status === 'pending' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleApprove(zoomedReceipt.order_id)}
                  className="btn-primary py-2 text-xs font-bold"
                >
                  Tasdiqlash ✓
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(zoomedReceipt.order_id)}
                  className="py-2 bg-red-50 text-red-600 rounded-2xl text-xs font-bold"
                >
                  Rad etish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
