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
  Star,
  MessageSquare,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Link2,
  EyeOff
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { api, toMediaUrl } from '../services/api';
import { AdminStats, PendingReceipt, AdminStudent, Course, CourseTestimonial, CourseCustomInfo, Banner, BannerActionType } from '../types';
import { InlineLoader } from 'generative-loaders';
import { formatPrice } from '../utils/format';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
}

type AdminTab = 'receipts' | 'courses' | 'banners' | 'stats' | 'students' | 'broadcast' | 'settings';

const TABS: { id: AdminTab; label: string; icon: typeof Clock }[] = [
  { id: 'receipts', label: 'Cheklar', icon: ReceiptText },
  { id: 'courses', label: 'Kurslar', icon: BookOpen },
  { id: 'banners', label: 'Bannerlar', icon: ImageIcon },
  { id: 'stats', label: 'Statistika', icon: TrendingUp },
  { id: 'students', label: 'Talabalar', icon: Users },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'settings', label: 'Karta', icon: CreditCard },
];

const PRESET_COVERS = [
  { url: '/images/hero_books.jpg', label: '3D Kitoblar & Muhr' },
  { url: '/images/hero_seal.webp', label: '3D Gradient Muhr' },
];

// Platformadagi real ustozlar — kurs muallifini tanlash uchun
const INSTRUCTOR_PRESETS: { key: string; id: string; name: string; title: string; avatar: string }[] = [
  { key: 'zuhra', id: 'zuhra-olimova', name: 'Zuhra Olimova', title: 'SMM & AI Kontent', avatar: '/images/ustoz_zuhra_olimova.webp' },
  { key: 'yaxshi', id: 'yaxshi-bola', name: 'Yaxshi Bola', title: 'Dasturlash & Dizayn', avatar: '/images/ustoz_yaxshi_bola.webp' },
];

const BANNER_TAG_COLORS = [
  { id: 'cyan', label: 'Moviy', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'violet', label: 'Binafsha', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 'gold', label: 'Oltin', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'emerald', label: 'Yashil', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
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

  // Gallery, Testimonials & Custom Info States
  const [courseGallery, setCourseGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [courseTestimonials, setCourseTestimonials] = useState<CourseTestimonial[]>([]);
  const [newTestimonialName, setNewTestimonialName] = useState('');
  const [newTestimonialRole, setNewTestimonialRole] = useState('Talaba');
  const [newTestimonialText, setNewTestimonialText] = useState('');
  const [newTestimonialRating, setNewTestimonialRating] = useState(5);
  const [courseCustomInfo, setCourseCustomInfo] = useState<CourseCustomInfo[]>([]);
  const [newInfoTitle, setNewInfoTitle] = useState('');
  const [newInfoContent, setNewInfoContent] = useState('');

  // Instructor & Learning Outcomes Section States
  const [courseInstructorId, setCourseInstructorId] = useState('yaxshi');
  const [courseInstructorName, setCourseInstructorName] = useState('Kreativ AI');
  const [courseInstructorTitle, setCourseInstructorTitle] = useState('Katta Ekspert');
  const [courseInstructorAvatar, setCourseInstructorAvatar] = useState('/images/ustoz_yaxshi_bola.webp');
  const [showInstructor, setShowInstructor] = useState(true);
  const [showOutcomes, setShowOutcomes] = useState(true);
  const [courseLearningOutcomes, setCourseLearningOutcomes] = useState<string[]>([]);
  const [newOutcomeText, setNewOutcomeText] = useState('');


  // Delete Confirmation State
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<AdminStudent | null>(null);

  // Banner States
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerTag, setBannerTag] = useState('');
  const [bannerTagColor, setBannerTagColor] = useState('cyan');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerImagePosition, setBannerImagePosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [bannerActionType, setBannerActionType] = useState<BannerActionType>('none');
  const [bannerActionValue, setBannerActionValue] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);

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
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

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
      const [s, r, st, c, bn] = await Promise.all([
        api.getAdminStats(),
        api.getPendingReceipts(),
        api.getAdminStudents(),
        api.getAdminCourses(),
        api.getAdminBanners()
      ]);
      setStats(s);
      setReceipts(r);
      setStudents(st);
      setCourses(c);
      setBanners(bn);
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

  // AI Bilan Kurs Yaratish Funksiyasi (OpenRouter Qwen)
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
        
        setCourseCoverUrl('/images/hero_books.jpg');

        showNotification(`✨ Qwen kurs tuzilmasini yaratdi! Quyida tekshirib saqlang.`);
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
    setCourseGallery(Array.isArray(c.gallery_urls) ? c.gallery_urls : []);
    setCourseTestimonials(Array.isArray(c.testimonials) ? c.testimonials : []);
    setCourseCustomInfo(Array.isArray(c.custom_info) ? c.custom_info : []);
    setCourseInstructorName(c.instructor_name || 'Kreativ AI');
    setCourseInstructorTitle(c.instructor_title || 'Katta Ekspert');
    setCourseInstructorAvatar(c.instructor_avatar || '/images/ustoz_yaxshi_bola.webp');
    {
      const preset = INSTRUCTOR_PRESETS.find(p => p.id === c.instructor_id || p.name === c.instructor_name);
      setCourseInstructorId(preset ? preset.key : 'custom');
    }
    setShowInstructor(c.show_instructor !== false);
    setShowOutcomes(c.show_outcomes !== false);
    setCourseLearningOutcomes(Array.isArray(c.learning_outcomes) ? c.learning_outcomes : []);
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
    setCourseGallery([]);
    setCourseTestimonials([]);
    setCourseCustomInfo([]);
    setCourseInstructorName('Kreativ AI');
    setCourseInstructorTitle('Katta Ekspert');
    setCourseInstructorAvatar('/images/ustoz_yaxshi_bola.webp');
    setCourseInstructorId('yaxshi');
    setShowInstructor(true);
    setShowOutcomes(true);
    setCourseLearningOutcomes([]);
    setNewGalleryUrl('');
    setNewTestimonialName('');
    setNewTestimonialText('');
    setNewInfoTitle('');
    setNewInfoContent('');
    setNewOutcomeText('');
  };

  // Nimalarni o'rganasiz bandi qo'shish
  const handleAddOutcome = () => {
    if (!newOutcomeText.trim()) return;
    setCourseLearningOutcomes([...courseLearningOutcomes, newOutcomeText.trim()]);
    setNewOutcomeText('');
    haptic?.selection?.();
  };

  const handleRemoveOutcome = (index: number) => {
    setCourseLearningOutcomes(courseLearningOutcomes.filter((_, i) => i !== index));
    haptic?.selection?.();
  };

  // Galereya rasmi qo'shish
  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setCourseGallery([...courseGallery, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
    haptic?.selection?.();
  };

  const handleRemoveGalleryImage = (index: number) => {
    setCourseGallery(courseGallery.filter((_, i) => i !== index));
    haptic?.selection?.();
  };

  // Testimonial qo'shish
  const handleAddTestimonial = () => {
    if (!newTestimonialName.trim() || !newTestimonialText.trim()) {
      showError('Iltimos, talaba ismi va fikr matnini kiriting!');
      return;
    }
    const newT: CourseTestimonial = {
      id: String(Date.now()),
      name: newTestimonialName.trim(),
      role: newTestimonialRole.trim() || 'Talaba',
      text: newTestimonialText.trim(),
      rating: newTestimonialRating
    };
    setCourseTestimonials([...courseTestimonials, newT]);
    setNewTestimonialName('');
    setNewTestimonialText('');
    haptic?.selection?.();
  };

  const handleRemoveTestimonial = (index: number) => {
    setCourseTestimonials(courseTestimonials.filter((_, i) => i !== index));
    haptic?.selection?.();
  };

  // Custom Info blok qo'shish
  const handleAddCustomInfo = () => {
    if (!newInfoTitle.trim() || !newInfoContent.trim()) {
      showError('Iltimos, sarlavha va matnni kiriting!');
      return;
    }
    const newI: CourseCustomInfo = {
      id: String(Date.now()),
      title: newInfoTitle.trim(),
      content: newInfoContent.trim()
    };
    setCourseCustomInfo([...courseCustomInfo, newI]);
    setNewInfoTitle('');
    setNewInfoContent('');
    haptic?.selection?.();
  };

  const handleRemoveCustomInfo = (index: number) => {
    setCourseCustomInfo(courseCustomInfo.filter((_, i) => i !== index));
    haptic?.selection?.();
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic?.impact?.('heavy');
    setIsActionLoading('course_form');
    const priceNum = parseInt(coursePrice) || 0;
    const oldPriceNum = courseOldPrice ? parseInt(courseOldPrice) : null;
    // Chegirma foizini narx va eski narxdan avtomatik hisoblaymiz
    const discountPercent = oldPriceNum && priceNum > 0 && oldPriceNum > priceNum
      ? Math.round((1 - priceNum / oldPriceNum) * 100)
      : null;
    const instructorPreset = INSTRUCTOR_PRESETS.find(p => p.key === courseInstructorId);
    const instructorId = instructorPreset ? instructorPreset.id : null;
    try {
      let res;
      if (editingCourseId) {
        res = await api.updateCourse(editingCourseId, {
          title: courseTitle,
          price: priceNum,
          old_price: oldPriceNum ?? null,
          discount_percent: discountPercent,
          category: courseCategory,
          duration: courseDuration,
          lesson_count: parseInt(courseLessonsCount) || 12,
          level: courseLevel,
          cover_url: courseCoverUrl,
          description: courseDesc,
          short_description: courseDesc.slice(0, 120),
          telegram_channel_id: courseChannelId.trim() || null,
          gallery_urls: courseGallery,
          testimonials: courseTestimonials,
          custom_info: courseCustomInfo,
          instructor_name: courseInstructorName || 'Kreativ AI',
          instructor_title: courseInstructorTitle || 'Katta Ekspert',
          instructor_avatar: courseInstructorAvatar || '/images/ustoz_yaxshi_bola.webp',
          instructor_id: instructorId,
          show_instructor: showInstructor,
          show_outcomes: showOutcomes,
          learning_outcomes: courseLearningOutcomes
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
          price: priceNum,
          old_price: oldPriceNum ?? null,
          discount_percent: discountPercent,
          category: courseCategory,
          duration: courseDuration,
          lesson_count: parseInt(courseLessonsCount) || 12,
          level: courseLevel,
          cover_url: courseCoverUrl,
          description: courseDesc || courseTitle,
          short_description: courseDesc.slice(0, 120) || courseTitle,
          instructor_name: courseInstructorName || 'Kreativ AI',
          instructor_title: courseInstructorTitle || 'Katta Ekspert',
          instructor_avatar: courseInstructorAvatar || '/images/ustoz_yaxshi_bola.webp',
          instructor_id: instructorId,
          show_instructor: showInstructor,
          show_outcomes: showOutcomes,
          learning_outcomes: courseLearningOutcomes,
          telegram_channel_id: courseChannelId.trim() || undefined,
          gallery_urls: courseGallery,
          testimonials: courseTestimonials,
          custom_info: courseCustomInfo
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


  const executeDeleteCourse = async (courseId: string) => {
    haptic?.impact?.('heavy');
    setIsActionLoading(`del_${courseId}`);
    try {
      const res = await api.deleteCourse(courseId);
      showNotification(res.message || 'Kurs o‘chirildi');
      setCourseToDelete(null);
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'O‘chirishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingCover(true);
      haptic?.impact?.('light');
      try {
        const compressed = await compressImage(file, 1000, 1000, 0.8);
        const res = await api.uploadBase64ToR2(compressed, file.name || 'cover.jpg', 'courses/covers');
        if (res && res.url) {
          setCourseCoverUrl(res.url);
          showNotification('✨ Muqova rasmi Cloudflare R2 ga muvaffaqiyatli yuklandi!');
          haptic?.notification?.('success');
        } else {
          showError('R2 ga yuklashda xatolik yuz berdi');
        }
      } catch (error: any) {
        showError(error?.message || 'Muqova rasmini yuklashda xatolik yuz berdi');
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const handleCustomGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingGallery(true);
      haptic?.impact?.('light');
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.8);
        const res = await api.uploadBase64ToR2(compressed, file.name || 'gallery.jpg', 'courses/gallery');
        if (res && res.url) {
          setCourseGallery(prev => [...prev, res.url]);
          showNotification('📸 Lavha rasmi Cloudflare R2 ga muvaffaqiyatli yuklandi!');
          haptic?.notification?.('success');
        } else {
          showError('R2 ga yuklashda xatolik yuz berdi');
        }
      } catch (error: any) {
        showError(error?.message || 'Lavha rasmini yuklashda xatolik yuz berdi');
      } finally {
        setIsUploadingGallery(false);
      }
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
      showNotification(res.message || 'Talabaga kurs ochildi!');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Kursni ochishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleToggleBlock = async (st: AdminStudent) => {
    haptic?.impact?.('heavy');
    setIsActionLoading(`block_${st.id}`);
    try {
      const res = await api.setStudentBlocked(st.id, !st.is_blocked);
      showNotification(res.message || (st.is_blocked ? 'Talaba blokdan chiqarildi!' : 'Talaba bloklandi!'));
      setStudents(prev => prev.map(s => s.id === st.id ? { ...s, is_blocked: !st.is_blocked } : s));
    } catch (e: any) {
      showError(e?.message || 'Bloklashda xatolik yuz berdi');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteStudent = async (st: AdminStudent) => {
    haptic?.impact?.('heavy');
    setIsActionLoading(`delstudent_${st.id}`);
    try {
      const res = await api.deleteStudent(st.id);
      showNotification(res.message || 'Talaba tizimdan o\'chirildi!');
      setStudentToDelete(null);
      setStudents(prev => prev.filter(s => s.id !== st.id));
    } catch (e: any) {
      showError(e?.message || 'Talabani o\'chirishda xatolik yuz berdi');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleRevokeCourse = async (st: AdminStudent, courseId: string) => {
    haptic?.impact?.('heavy');
    setIsActionLoading(`revoke_${st.id}_${courseId}`);
    try {
      const res = await api.revokeStudentCourse(st.id, courseId);
      showNotification(res.message || 'Kursga kirish cheklandi!');
      await loadData(true);
    } catch (e: any) {
      showError(e?.message || 'Kursga kirishni cheklashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSaveCardSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic?.impact?.('heavy');
    setIsActionLoading('settings');
    try {
      const res = await api.savePaymentSettings(cardNumber.trim(), cardHolder.trim(), bankName.trim());
      showNotification(res.message || 'Karta rekvizitlari muvaffaqiyatli saqlandi!');
    } catch (e: any) {
      showError(e?.message || 'Karta ma\'lumotlarini saqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const filteredStudents = students.filter(st => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase();
    return (
      (st.name || '').toLowerCase().includes(q) ||
      (st.username || '').toLowerCase().includes(q) ||
      String(st.telegram_id || '').includes(q)
    );
  });

  // ===== BANNER BOSHQARUVI =====

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerTag('');
    setBannerTagColor('cyan');
    setBannerImageUrl('');
    setBannerImagePosition('center');
    setBannerActionType('none');
    setBannerActionValue('');
  };

  const startEditBanner = (b: Banner) => {
    setEditingBannerId(b.id);
    setBannerTitle(b.title || '');
    setBannerSubtitle(b.subtitle || '');
    setBannerTag(b.tag || '');
    setBannerTagColor(b.tag_color || 'cyan');
    setBannerImageUrl(b.image_url || '');
    setBannerImagePosition(b.image_position || 'center');
    setBannerActionType(b.action_type || 'none');
    setBannerActionValue(b.action_value || '');
    haptic?.selection?.();
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBanner(true);
      haptic?.impact?.('light');
      try {
        const compressed = await compressImage(file, 1600, 900, 0.85);
        const res = await api.uploadBase64ToR2(compressed, file.name || 'banner.jpg', 'banners');
        if (res && res.url) {
          setBannerImageUrl(res.url);
          showNotification('🖼️ Banner rasmi Cloudflare R2 ga yuklandi!');
        } else {
          showError('Banner rasmini yuklashda xatolik yuz berdi');
        }
      } catch (error: any) {
        showError(error?.message || 'Banner rasmini yuklashda xatolik yuz berdi');
      } finally {
        setIsUploadingBanner(false);
      }
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl.trim()) {
      showError('Iltimos, avval banner rasmini yuklang!');
      return;
    }
    if (bannerActionType !== 'none' && !bannerActionValue.trim()) {
      showError(bannerActionType === 'link'
        ? 'Iltimos, banner bosilganda ochiladigan havolani kiriting!'
        : 'Iltimos, bannerga biriktiriladigan kursni tanlang!');
      return;
    }
    haptic?.impact?.('heavy');
    setIsActionLoading('banner_form');
    try {
      const payload = {
        title: bannerTitle.trim() || null,
        subtitle: bannerSubtitle.trim() || null,
        tag: bannerTag.trim() || null,
        tag_color: bannerTagColor,
        image_url: bannerImageUrl.trim(),
        image_position: bannerImagePosition,
        action_type: bannerActionType,
        action_value: bannerActionType === 'none' ? '' : bannerActionValue.trim(),
        order_index: editingBannerId
          ? banners.find(b => b.id === editingBannerId)?.order_index ?? banners.length
          : banners.length,
        is_active: editingBannerId
          ? banners.find(b => b.id === editingBannerId)?.is_active ?? true
          : true,
      };
      let res;
      if (editingBannerId) {
        res = await api.updateBanner(editingBannerId, payload);
      } else {
        res = await api.createBanner(payload);
      }
      showNotification(res.message || 'Banner saqlandi!');
      resetBannerForm();
      const bn = await api.getAdminBanners();
      setBanners(bn);
    } catch (err: any) {
      showError(err?.message || 'Bannerni saqlashda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleToggleBannerActive = async (b: Banner) => {
    haptic?.impact?.('medium');
    setIsActionLoading(`banner_toggle_${b.id}`);
    try {
      await api.updateBanner(b.id, { ...b, is_active: !b.is_active });
      const bn = await api.getAdminBanners();
      setBanners(bn);
      showNotification(b.is_active ? 'Banner vaqtincha yashirildi' : 'Banner qayta yoqildi');
    } catch (err: any) {
      showError(err?.message || 'Banner holatini o\'zgartirishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  const executeDeleteBanner = async (bannerId: string) => {
    haptic?.impact?.('heavy');
    setIsActionLoading(`del_banner_${bannerId}`);
    try {
      const res = await api.deleteBanner(bannerId);
      showNotification(res.message || 'Banner o‘chirildi');
      setBannerToDelete(null);
      if (editingBannerId === bannerId) resetBannerForm();
      const bn = await api.getAdminBanners();
      setBanners(bn);
    } catch (err: any) {
      showError(err?.message || 'Bannerni o‘chirishda xatolik');
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden animate-fade-in force-light">
      {/* 1. Header with glass styling */}
      <div className="pt-safe px-4 py-3 bg-white border-b border-slate-200/90 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600/10 border border-sky-600/25 flex items-center justify-center text-sky-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-sm font-extrabold text-slate-900">Kreativ AI Admin Panel</h2>
              <span className="badge-cyan text-[9px] py-0 px-1.5 font-bold">2026</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{adminName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 flex items-center justify-center transition-all"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 flex items-center justify-center transition-all"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Tabs */}
      <div className="px-4 py-2 bg-white/95 border-b border-slate-200 flex items-center space-x-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
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

      {/* 4. Main Scrollable Content with large bottom padding (pb-36) so navbar never covers buttons */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">
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
                              className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1 border border-red-200"
                            >
                              {isActionLoading === receipt.order_id ? (
                                <InlineLoader variant="orbit" size={14} color="#DC2626" />
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Rad etish</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: COURSES MANAGEMENT & AI GENERATOR */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                {/* 1. AI Assistant Course Generator */}
                <div className="bg-gradient-to-br from-sky-50 via-indigo-50/50 to-white border border-sky-200/80 p-4 rounded-3xl space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">AI Bilan Kurs Generatsiya Qilish</h4>
                      <span className="text-[10px] text-slate-500 font-mono">OpenRouter Qwen 3.8 Flash</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Mavzu: masalan 'Figma UI/UX Masterclass' yoki 'Python Telegram Bot'"
                      className="glass-input w-full text-xs"
                    />

                    <div className="flex space-x-2">
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        className="glass-input text-xs flex-1"
                      >
                        <option value="AI">AI & Neyrotarmoqlar</option>
                        <option value="Dizayn">UI/UX & Grafik Dizayn</option>
                        <option value="Dasturlash">Dasturlash & Web</option>
                        <option value="Biznes">Biznes & Startap</option>
                        <option value="Marketing">Marketing & SMM</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleGenerateCourseWithAI}
                        disabled={isAiGenerating}
                        className="btn-primary py-2.5 px-4 text-xs font-extrabold flex items-center justify-center space-x-1.5 flex-shrink-0"
                      >
                        {isAiGenerating ? (
                          <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                        ) : (
                          <>
                            <Bot className="w-4 h-4" />
                            <span>AI Tuzsin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Course Add/Edit Form */}
                <form onSubmit={handleSaveCourse} className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-600" />
                      <span>{editingCourseId ? 'Kursni Tahrirlash' : 'Yangi Kurs Qo‘shish'}</span>
                    </h4>
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={resetCourseForm}
                        className="text-[11px] text-slate-500 hover:text-slate-900 font-bold"
                      >
                        Bekor qilish ✕
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
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-sky-600" />
                        <span>Kurs Asosiy Muqovasi (3D Rasm)</span>
                      </label>
                      <label className={`text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-opacity ${isUploadingCover ? 'text-amber-600 opacity-80 cursor-wait' : 'text-sky-600 hover:underline'}`}>
                        {isUploadingCover ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                            <span>R2 ga yuklanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>R2 ga yuklash</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingCover}
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
                        <span className="text-[10px] text-slate-500 block">Joriy rasm manzili (R2 / URL):</span>
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

                  {/* 3. Kursdan Lavhalar (Ko'p rasmli galereya) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Kursdan Lavhalar & Skrinshotlar ({courseGallery.length})</span>
                      </label>
                      <label className={`text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-opacity ${isUploadingGallery ? 'text-amber-600 opacity-80 cursor-wait' : 'text-sky-600 hover:underline'}`}>
                        {isUploadingGallery ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                            <span>R2 ga yuklanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>R2 ga yuklash</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingGallery}
                          onChange={handleCustomGalleryUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        placeholder="Rasm URL manzili: masalan /images/hero_books.jpg yoki https://..."
                        className="glass-input flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddGalleryImage}
                        className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Qo'shish</span>
                      </button>
                    </div>

                    {courseGallery.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {courseGallery.map((url, index) => (
                          <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200 group aspect-video bg-slate-100">
                            <img
                              src={url}
                              alt={`Lavha ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                const fixed = toMediaUrl(target.src);
                                if (fixed !== target.src) target.src = fixed;
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] opacity-80 hover:opacity-100 shadow"
                              title="O'chirish"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. O'quvchilar va Ekspertlar Sharhlari (Testimonials) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Fikrlar & Sharhlar ({courseTestimonials.length})</span>
                    </label>

                    <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newTestimonialName}
                          onChange={(e) => setNewTestimonialName(e.target.value)}
                          placeholder="Talaba ismi (masalan: Jasur Aliyev)"
                          className="glass-input text-xs w-full bg-white"
                        />
                        <input
                          type="text"
                          value={newTestimonialRole}
                          onChange={(e) => setNewTestimonialRole(e.target.value)}
                          placeholder="Kasbi / Natijasi (masalan: Frontend Dev)"
                          className="glass-input text-xs w-full bg-white"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-white px-2 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-600">Baho:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewTestimonialRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  star <= newTestimonialRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={newTestimonialText}
                        onChange={(e) => setNewTestimonialText(e.target.value)}
                        placeholder="Kurs haqidagi sharh va taassurot..."
                        className="glass-input text-xs w-full bg-white leading-relaxed"
                      />

                      <button
                        type="button"
                        onClick={handleAddTestimonial}
                        className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fikrni Qo'shish</span>
                      </button>
                    </div>

                    {courseTestimonials.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {courseTestimonials.map((t, idx) => (
                          <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-start justify-between space-x-2">
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-900">{t.name}</span>
                                <span className="text-[10px] text-slate-500">({t.role || 'Talaba'})</span>
                                <span className="text-[10px] text-amber-500 font-bold">★ {t.rating}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{t.text}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTestimonial(idx)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Qo'shimcha Erkin Ma'lumot Bloklari */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Qo'shimcha Ma'lumot Bloklari ({courseCustomInfo.length})</span>
                    </label>

                    <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-200">
                      <input
                        type="text"
                        value={newInfoTitle}
                        onChange={(e) => setNewInfoTitle(e.target.value)}
                        placeholder="Blok Sarlavhasi (masalan: Kurs kimlar uchun? yoki Nimalar o'rgatiladi?)"
                        className="glass-input text-xs w-full bg-white"
                      />
                      <textarea
                        rows={2}
                        value={newInfoContent}
                        onChange={(e) => setNewInfoContent(e.target.value)}
                        placeholder="Blok matni yoki bandlar..."
                        className="glass-input text-xs w-full bg-white leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomInfo}
                        className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Blokni Qo'shish</span>
                      </button>
                    </div>

                    {courseCustomInfo.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {courseCustomInfo.map((info, idx) => (
                          <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-start justify-between space-x-2">
                            <div className="min-w-0">
                              <b className="text-xs font-bold text-slate-900 block">{info.title}</b>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{info.content}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomInfo(idx)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 6. Kursda Nimalarni O'rganasiz? (Tahrirlash va Yoqish/O'chirish) */}

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Kursda Nimalarni O‘rganasiz? ({courseLearningOutcomes.length})</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={showOutcomes}
                          onChange={(e) => setShowOutcomes(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <span>Ko‘rsatilsin</span>
                      </label>
                    </div>

                    {showOutcomes && (
                      <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-200">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newOutcomeText}
                            onChange={(e) => setNewOutcomeText(e.target.value)}
                            placeholder="O'rganiladigan yangi ko'nikma yoki natija..."
                            className="glass-input text-xs flex-1 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddOutcome}
                            className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Qo'shish</span>
                          </button>
                        </div>

                        {courseLearningOutcomes.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            {courseLearningOutcomes.map((item, idx) => (
                              <div key={idx} className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between space-x-2">
                                <span className="text-xs text-slate-700 flex-1">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOutcome(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">
                            Band kiritilmasa, platformaning standart amaliy natijalari ko'rsatiladi.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 7. Kurs Muallifi (Tahrirlash va Yoqish/O'chirish) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-sky-600" />
                        <span>Kurs Muallifi Bo‘limi</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={showInstructor}
                          onChange={(e) => setShowInstructor(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <span>Ko‘rsatilsin</span>
                      </label>
                    </div>

                    {showInstructor && (
                      <div className="bg-slate-50 p-3 rounded-2xl space-y-2.5 border border-slate-200">
                        {/* Ustoz tanlash — bir bosishda ism/lavozim/rasm avtomatik to'ldiriladi */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-600 block">Kurs muallifi qaysi ustoz?</label>
                          <div className="grid grid-cols-3 gap-2">
                            {INSTRUCTOR_PRESETS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => {
                                  setCourseInstructorId(p.key);
                                  setCourseInstructorName(p.name);
                                  setCourseInstructorTitle(p.title);
                                  setCourseInstructorAvatar(p.avatar);
                                  haptic?.selection?.();
                                }}
                                className={`p-2 rounded-2xl border-2 flex flex-col items-center space-y-1 transition-all active:scale-95 ${
                                  courseInstructorId === p.key
                                    ? 'border-sky-500 bg-sky-50 shadow-sm shadow-sky-500/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                                <span className="text-[9px] font-bold text-slate-800 text-center leading-tight">{p.name}</span>
                                <span className="text-[8px] text-slate-400 text-center leading-tight">{p.title}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => { setCourseInstructorId('custom'); haptic?.selection?.(); }}
                              className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center space-y-1.5 transition-all active:scale-95 ${
                                courseInstructorId === 'custom'
                                  ? 'border-sky-500 bg-sky-50 shadow-sm shadow-sky-500/10'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <Pencil className="w-4 h-4 text-slate-400" />
                              <span className="text-[9px] font-bold text-slate-500 text-center leading-tight">Boshqa / qo'lda</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">Muallif Ismi</label>
                            <input
                              type="text"
                              value={courseInstructorName}
                              onChange={(e) => setCourseInstructorName(e.target.value)}
                              placeholder="Masalan: Kreativ AI yoki Yaxshi Bola"
                              className="glass-input text-xs w-full bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 block">Lavozimi / Kasbi</label>
                            <input
                              type="text"
                              value={courseInstructorTitle}
                              onChange={(e) => setCourseInstructorTitle(e.target.value)}
                              placeholder="Masalan: Katta Ekspert / Senior Designer"
                              className="glass-input text-xs w-full bg-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block">Muallif Rasmi (URL)</label>
                          <input
                            type="text"
                            value={courseInstructorAvatar}
                            onChange={(e) => setCourseInstructorAvatar(e.target.value)}
                            placeholder="/images/ustoz_yaxshi_bola.webp yoki https://..."
                            className="glass-input text-xs w-full bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Course Full Description */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">Kurs Asosiy Tavsifi</label>
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
                    className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-lg shadow-sky-500/20"
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
                        className="bg-white border border-slate-200/90 p-3 rounded-2xl flex items-center justify-between space-x-3 shadow-sm hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={toMediaUrl(c.cover_url)}
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
                            onClick={() => setCourseToDelete(c)}
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
                    placeholder="Talabani ism, @username yoki Telegram ID bo'yicha qidirish..."
                    className="glass-input w-full pl-9 text-xs"
                  />
                </div>

                {/* Manual Grant Course Selector */}
                <div className="p-3 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between space-x-2 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Ochiladigan Kurs:</span>
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="glass-input text-xs py-1.5 flex-1"
                  >
                    <option value="">-- Kursni tanlang --</option>
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
                    filteredStudents.map((st) => {
                      const isAdminAccount = st.role === 'superadmin';
                      return (
                        <div key={st.id} className={`p-3.5 rounded-2xl space-y-2 text-xs shadow-sm border ${st.is_blocked ? 'bg-red-50/60 border-red-200' : 'bg-white border-slate-200/90'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className="text-slate-900 font-bold">{st.name}</strong>
                                {st.is_blocked && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                                    <Ban className="w-2.5 h-2.5" /> Bloklangan
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                @{st.username || 'noma\'lum'} • ID: <code className="text-sky-600 font-bold">{st.telegram_id}</code>
                              </span>
                            </div>
                            <span className="badge-cyan text-[9px] py-0.5 px-2">{st.overall_progress || '0%'}</span>
                          </div>

                          {/* Kurslar — har birini cheklash (X) mumkin */}
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                            {st.courses && st.courses.length > 0 ? st.courses.map(c => (
                              <span key={c.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 rounded-lg px-2 py-1 text-[10px] font-semibold">
                                {c.title}
                                <button
                                  type="button"
                                  title="Kursga kirishni cheklash"
                                  onClick={() => handleRevokeCourse(st, c.id)}
                                  disabled={isActionLoading === `revoke_${st.id}_${c.id}`}
                                  className="text-slate-400 hover:text-red-600 active:scale-90 transition"
                                >
                                  {isActionLoading === `revoke_${st.id}_${c.id}` ? <InlineLoader variant="orbit" size={10} color="#94a3b8" /> : <X className="w-3 h-3" />}
                                </button>
                              </span>
                            )) : (
                              <span className="text-[10px] text-slate-400 italic py-1">Kurslari yo'q — Yangi talaba</span>
                            )}
                          </div>

                          {/* Amallar: Grant / Bloklash / O'chirish */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleManualEnroll(st.id, enrollCourseId)}
                              disabled={isActionLoading === `enroll_${st.id}`}
                              className="flex-1 px-2 py-1.5 bg-sky-600 text-white font-extrabold rounded-xl text-[10px] hover:bg-sky-700 active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center"
                            >
                              {isActionLoading === `enroll_${st.id}` ? <InlineLoader variant="orbit" size={11} color="#FFFFFF" /> : '+ Grant Ochish'}
                            </button>
                            {!isAdminAccount && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBlock(st)}
                                  disabled={isActionLoading === `block_${st.id}`}
                                  className={`flex-1 px-2 py-1.5 font-extrabold rounded-xl text-[10px] active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-1 ${st.is_blocked ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                >
                                  {isActionLoading === `block_${st.id}` ? (
                                    <InlineLoader variant="orbit" size={11} color={st.is_blocked ? '#FFFFFF' : '#b45309'} />
                                  ) : (
                                    <Ban className="w-3 h-3" />
                                  )}
                                  {st.is_blocked ? 'Blokdan chiqarish' : 'Bloklash'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentToDelete(st)}
                                  title="Talabani butunlay o'chirish"
                                  className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-extrabold rounded-xl text-[10px] active:scale-95 transition-transform"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
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
              <form onSubmit={handleSaveCardSettings} className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      To‘lov Rekvizitlari (Bazada Doimiy Saqlanadi)
                    </h4>
                    <span className="text-[10px] text-slate-500">Mijozlar to'lov qilganda aynan shu rekvizitlar chiqadi</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Karta Raqami</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="8600 5304 1234 5678"
                    className="glass-input w-full font-mono text-sm tracking-wider"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Karta Egasi (F.I.SH)</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="YAXSHI BOLA / ZUHRA OLIMOVA"
                    className="glass-input w-full uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Bank Nomi</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Kapitalbank / TBC / Milliy Bank"
                    className="glass-input w-full"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isActionLoading === 'settings'}
                  className="btn-primary w-full py-3.5 text-xs font-extrabold flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20"
                >
                  {isActionLoading === 'settings' ? (
                    <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Karta Rekvizitlarini Bazaga Saqlash</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 7: BANNERS (Bosh sahifa banner boshqaruvi) */}
            {activeTab === 'banners' && (
              <div className="space-y-4">
                {/* Banner yaratish/tahrirlash formasi */}
                <form onSubmit={handleSaveBanner} className="bg-white border border-slate-200/90 p-4 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                          {editingBannerId ? 'Bannerni Tahrirlash' : 'Yangi Banner Qo\'shish'}
                        </h4>
                        <span className="text-[10px] text-slate-500">Bosh sahifada ko'rinadigan reklama banneri</span>
                      </div>
                    </div>
                    {editingBannerId && (
                      <button
                        type="button"
                        onClick={resetBannerForm}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-xl bg-slate-100 active:scale-95 transition-all"
                      >
                        ✕ Bekor
                      </button>
                    )}
                  </div>

                  {/* Rasm yuklash */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Banner Rasmi (16:9 tavsiya etiladi)</label>
                    <div className="flex items-start space-x-3">
                      <div className="w-36 aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {bannerImageUrl ? (
                          <img
                            src={toMediaUrl(bannerImageUrl)}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: bannerImagePosition === 'top' ? '50% 0%' : bannerImagePosition === 'bottom' ? '50% 100%' : '50% 50%' }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-2xl text-xs font-bold cursor-pointer border border-sky-200 transition-colors active:scale-[0.98]">
                          {isUploadingBanner ? (
                            <InlineLoader variant="orbit" size={14} color="#0284C7" />
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>{bannerImageUrl ? 'Rasmni almashtirish' : 'Rasm yuklash'}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerImageUpload}
                            className="hidden"
                            disabled={isUploadingBanner}
                          />
                        </label>
                        <input
                          type="text"
                          value={bannerImageUrl.startsWith('data:') ? '' : bannerImageUrl}
                          onChange={(e) => setBannerImageUrl(e.target.value)}
                          placeholder="yoki rasm URL manzilini kiriting..."
                          className="glass-input w-full text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rasmning qaysi qismi ko'rinishi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Rasmning qaysi qismi ko'rinsin?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'top', label: '⬆️ Yuqori qismi' },
                        { id: 'center', label: '⏺ Markazi' },
                        { id: 'bottom', label: '⬇️ Pastki qismi' },
                      ] as const).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setBannerImagePosition(p.id); haptic?.selection?.(); }}
                          className={`py-2.5 rounded-2xl text-[11px] font-bold border transition-all active:scale-95 ${
                            bannerImagePosition === p.id
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">Banner qirqilmaydi — rasmda qaysi joy muhim bo'lsa, o'shani tanlang</p>
                  </div>

                  {/* Sarlavha (ixtiyoriy) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Sarlavha <span className="text-slate-400 font-normal">(ixtiyoriy)</span></label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder="Masalan: Yangi kurs — 50% chegirma!"
                      maxLength={300}
                      className="glass-input w-full text-xs"
                    />
                  </div>

                  {/* Pastki sarlavha (ixtiyoriy) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Pastki sarlavha <span className="text-slate-400 font-normal">(ixtiyoriy)</span></label>
                    <input
                      type="text"
                      value={bannerSubtitle}
                      onChange={(e) => setBannerSubtitle(e.target.value)}
                      placeholder="Masalan: AI bilan kontent yaratishni o'rganing"
                      maxLength={300}
                      className="glass-input w-full text-xs"
                    />
                  </div>

                  {/* Yorliq va rangi */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Yorliq <span className="text-slate-400 font-normal">(ixtiyoriy)</span></label>
                      <input
                        type="text"
                        value={bannerTag}
                        onChange={(e) => setBannerTag(e.target.value)}
                        placeholder="Yangi kurs / Chegirma / SMM"
                        maxLength={50}
                        className="glass-input w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Yorliq rangi</label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {BANNER_TAG_COLORS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            title={c.label}
                            onClick={() => { setBannerTagColor(c.id); haptic?.selection?.(); }}
                            className={`h-7 px-2 rounded-xl border text-[9px] font-bold transition-all active:scale-95 ${c.className} ${
                              bannerTagColor === c.id ? 'ring-2 ring-sky-400 ring-offset-1' : 'opacity-70'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Harakat turi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Bosilganda nima bo'lsin?</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => { setBannerActionType('link'); haptic?.selection?.(); }}
                        className={`py-2.5 rounded-2xl text-[11px] font-bold flex flex-col items-center space-y-1 border transition-all active:scale-95 ${
                          bannerActionType === 'link'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Havola</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBannerActionType('course'); haptic?.selection?.(); }}
                        className={`py-2.5 rounded-2xl text-[11px] font-bold flex flex-col items-center space-y-1 border transition-all active:scale-95 ${
                          bannerActionType === 'course'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Kurs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBannerActionType('none'); setBannerActionValue(''); haptic?.selection?.(); }}
                        className={`py-2.5 rounded-2xl text-[11px] font-bold flex flex-col items-center space-y-1 border transition-all active:scale-95 ${
                          bannerActionType === 'none'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Faqat rasm</span>
                      </button>
                    </div>

                    {bannerActionType === 'link' && (
                      <input
                        type="url"
                        required
                        value={bannerActionValue}
                        onChange={(e) => setBannerActionValue(e.target.value)}
                        placeholder="https://t.me/kanal yoki tashqi havola..."
                        className="glass-input w-full text-xs mt-2"
                      />
                    )}
                    {bannerActionType === 'course' && (
                      <select
                        required
                        value={bannerActionValue}
                        onChange={(e) => setBannerActionValue(e.target.value)}
                        className="glass-input w-full text-xs mt-2"
                      >
                        <option value="">— Kursni tanlang —</option>
                        {courses.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.title} ({formatPrice(c.price)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isActionLoading === 'banner_form'}
                    className="btn-primary w-full py-3.5 text-xs font-extrabold flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20"
                  >
                    {isActionLoading === 'banner_form' ? (
                      <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{editingBannerId ? 'Bannerni Saqlash' : 'Bannerni Qo\'shish'}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Mavjud bannerlar ro'yxati */}
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Mavjud Bannerlar ({banners.length})
                  </h3>
                </div>

                {banners.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200/90 rounded-3xl space-y-2 shadow-sm">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <b className="text-xs text-slate-800 block font-bold">Hozircha banner yo'q</b>
                    <p className="text-[11px] text-slate-500">Yuqoridagi forma orqali birinchi bannerni qo'shing.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {banners.map((b) => (
                      <div key={b.id} className="bg-white border border-slate-200/90 p-3 rounded-3xl shadow-sm">
                        <div className="flex space-x-3">
                          <div className="w-28 aspect-video rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                            <img src={toMediaUrl(b.image_url)} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <b className="text-xs font-bold text-slate-900 truncate">
                                {b.title || '(sarlavhasiz)'}
                              </b>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              {b.tag && (
                                <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-lg border ${BANNER_TAG_COLORS.find(c => c.id === (b.tag_color || 'cyan'))?.className || ''}`}>
                                  {b.tag}
                                </span>
                              )}
                              {b.action_type === 'course' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-lg">
                                  <BookOpen className="w-2.5 h-2.5" />
                                  {courses.find(c => String(c.id) === b.action_value || c.slug === b.action_value)?.title?.slice(0, 22) || 'Kurs'}
                                </span>
                              ) : b.action_type === 'link' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-lg max-w-[160px]">
                                  <Link2 className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate">{b.action_value}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg">
                                  <EyeOff className="w-2.5 h-2.5" /> Faqat rasm
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 block">Tartib raqami: {b.order_index}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => startEditBanner(b)}
                            className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center space-x-1 active:scale-95 transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Tahrirlash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBannerActive(b)}
                            disabled={isActionLoading === `banner_toggle_${b.id}`}
                            className={`py-2 rounded-xl text-[10px] font-bold flex items-center justify-center space-x-1 active:scale-95 transition-all ${
                              b.is_active
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isActionLoading === `banner_toggle_${b.id}` ? (
                              <InlineLoader variant="orbit" size={12} color="#64748B" />
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>{b.is_active ? 'Yashirish' : 'Yoqish'}</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setBannerToDelete(b); haptic?.impact?.('medium'); }}
                            className="py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center space-x-1 active:scale-95 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>O'chirish</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Delete Course Confirmation Dialog */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 animate-fade-up">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">Kursni o'chirishni tasdiqlaysizmi?</h4>
              <p className="text-xs text-slate-500">
                <b className="text-slate-800">{courseToDelete.title}</b> kursi va uning barcha sozlamalari tizimdan butunlay o'chiriladi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => executeDeleteCourse(courseToDelete.id)}
                disabled={isActionLoading === `del_${courseToDelete.id}`}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center"
              >
                {isActionLoading === `del_${courseToDelete.id}` ? (
                  <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                ) : (
                  'Ha, O‘chirish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.1 Delete Student Confirmation Dialog */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 animate-fade-up">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">Talabani o'chirishni tasdiqlaysizmi?</h4>
              <p className="text-xs text-slate-500">
                <b className="text-slate-800">{studentToDelete.name}</b> (@{studentToDelete.username || 'noma\'lum'}) tizimdan butunlay o'chiriladi — barcha kurslari, progressi va xarid tarixi yo'qoladi. Bu amalni ortga qaytarib bo'lmaydi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudent(studentToDelete)}
                disabled={isActionLoading === `delstudent_${studentToDelete.id}`}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center"
              >
                {isActionLoading === `delstudent_${studentToDelete.id}` ? (
                  <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                ) : (
                  'Ha, O‘chirish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 Delete Banner Confirmation Dialog */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 animate-fade-up">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">Bannerni o'chirishni tasdiqlaysizmi?</h4>
              <p className="text-xs text-slate-500">
                <b className="text-slate-800">{bannerToDelete.title || '(sarlavhasiz)'}</b> banneri bosh sahifadan butunlay olib tashlanadi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => executeDeleteBanner(bannerToDelete.id)}
                disabled={isActionLoading === `del_banner_${bannerToDelete.id}`}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center"
              >
                {isActionLoading === `del_banner_${bannerToDelete.id}` ? (
                  <InlineLoader variant="orbit" size={14} color="#FFFFFF" />
                ) : (
                  'Ha, O‘chirish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Receipt Zoom Modal */}
      {zoomedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 animate-fade-up">
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
