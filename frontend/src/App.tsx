import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DesktopWrapper } from './components/DesktopWrapper';
import { SplashPage } from './pages/SplashPage';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { PurchaseSuccessPage } from './pages/PurchaseSuccessPage';
import { LoginPage } from './pages/LoginPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { LessonPlayerPage } from './pages/LessonPlayerPage';
import { ProfilePage } from './pages/ProfilePage';
import { CheckoutModal } from './components/CheckoutModal';
import { NotificationsPanel } from './components/NotificationsPanel';

import { useAuth } from './context/AuthContext';
import { useTelegram } from './context/TelegramContext';
import { api, MOCK_COURSES, toMediaUrl } from './services/api';
import { Course, Lesson, Certificate, NotificationItem, Banner } from './types';
import { AdminDashboardModal } from './pages/AdminDashboardModal';
import { TelegramGate } from './components/TelegramGate';
import { useSecurityShield } from './hooks/useSecurityShield';
import { ShieldAlert } from 'lucide-react';

// Sotib olingan kurslar ID'larining lokal keshi — ilova ochilishi bilanoq sotuv
// ro'yxati to'g'ri filtrlanadi: kurslar avval ko'rinib, keyin yo'qolib qolmaydi.
const PURCHASED_IDS_KEY = 'purchased_course_ids';
const readPurchasedCache = (): string[] => {
  try {
    const raw = localStorage.getItem(PURCHASED_IDS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
const writePurchasedCache = (ids: string[]) => {
  try {
    localStorage.setItem(PURCHASED_IDS_KEY, JSON.stringify([...new Set(ids)]));
  } catch {}
};

// Bannerlar keshi — admin qo'ygan bannerlar qurilmada saqlanadi: ilova
// ochilishida darhol ko'rsatiladi, tab almashtirganda qayta yuklanib
// flicker qilmaydi. Backend'dan kelgan yangi ro'yxat keshni yangilaydi.
const BANNERS_CACHE_KEY = 'banners_cache_v1';
const readBannersCache = (): Banner[] => {
  try {
    const arr = JSON.parse(localStorage.getItem(BANNERS_CACHE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const writeBannersCache = (banners: Banner[]) => {
  try {
    localStorage.setItem(BANNERS_CACHE_KEY, JSON.stringify(banners));
  } catch {}
};

export const AppContent: React.FC = () => {
  const { isAuthenticated, user, authVersion } = useAuth();
  const { showBackButton, hideBackButton } = useTelegram();
  const { securityWarning } = useSecurityShield();

  // Navigation State
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{
    course: Course;
    lesson: Lesson;
    moduleTitle: string;
    prev: string | null;
    next: string | null;
  } | null>(null);
  const [purchasedCourse, setPurchasedCourse] = useState<Course | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  // Sotib olingan kurslar: localStorage kesh (ochilishdayoq filtrlaydi) + joriy
  // sessiyada chek orqali qo'shilganlari. Dashboard yuklanishi bilan kesh yangilanadi.
  const [cachedPurchasedIds, setCachedPurchasedIds] = useState<string[]>(readPurchasedCache);
  const [sessionPurchasedIds, setSessionPurchasedIds] = useState<string[]>([]);

  // ---- ORTQA QAYTISH (telefonning "Nazad" tugmasi) ----
  // Android Telegram'da tizim "nazad" tugmasi Telegram BackButton'i ko'rinib
  // turganda bosilsa — backButtonClicked hodisasi orqali app ichida qaytaradi,
  // BackButton yashirin bo'lsa — miniapp'ni darhol yopib yuboradi. Shuning
  // uchun qaytish mumkin bo'lgan HAR QANDAY holatda (ichki sahifa, modal,
  // home'dan boshqa tab) BackButton ko'rsatiladi. Eski mijozlar uchun zaxira:
  // tarixda doim kamida bitta yozuv (sentinel) saqlanadi — back bosilganda
  // chiqib ketmaydi, popstate orqali bir qatlam yopiladi.
  const navStateRef = useRef({
    selectedCourse, selectedLesson, purchasedCourse,
    isCheckoutOpen, isAdminOpen, isNotifsOpen, activeTab,
  });
  navStateRef.current = {
    selectedCourse, selectedLesson, purchasedCourse,
    isCheckoutOpen, isAdminOpen, isNotifsOpen, activeTab,
  };

  const canGoBack = !!(
    selectedCourse || selectedLesson || purchasedCourse ||
    isCheckoutOpen || isAdminOpen || isNotifsOpen
  ) || activeTab !== 'home';

  const ensureSentinel = useCallback(() => {
    try {
      if (window.history.length < 2) {
        window.history.pushState({ appNav: true }, '');
      }
    } catch {}
  }, []);

  useEffect(() => {
    ensureSentinel();
    // Sug'urta: Telegram ayrim versiyalarda WebView tarixini tozalab qo'yishi
    // mumkin — sentinel yo'qolib qolsa, birinchi back'dayoq app yopiladi.
    const reEnsure = () => setTimeout(ensureSentinel, 50);
    const onVisible = () => { if (!document.hidden) reEnsure(); };
    const timer = window.setInterval(ensureSentinel, 2000);
    window.addEventListener('pageshow', reEnsure);
    window.addEventListener('focus', reEnsure);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pageshow', reEnsure);
      window.removeEventListener('focus', reEnsure);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ensureSentinel]);

  // Bir bosishda faqat bitta eng ustki qatlamni yopadi
  const closeTopLevel = useCallback((): boolean => {
    const s = navStateRef.current;
    if (s.isCheckoutOpen) setIsCheckoutOpen(false);
    else if (s.isNotifsOpen) setIsNotifsOpen(false);
    else if (s.isAdminOpen) setIsAdminOpen(false);
    else if (s.selectedLesson) setSelectedLesson(null);
    else if (s.purchasedCourse) setPurchasedCourse(null);
    else if (s.selectedCourse) setSelectedCourse(null);
    else if (s.activeTab !== 'home') setActiveTab('home');
    else return false;
    return true;
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const closed = closeTopLevel();
      if (closed) {
        // Tarix chuqurligi yo'qolmasin: keyingi back ham chiqish emas,
        // yana bir qadam orqaga bo'lsin
        try { window.history.pushState({ appNav: true }, ''); } catch {}
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeTopLevel]);

  const goBack = useCallback(() => {
    closeTopLevel();
  }, [closeTopLevel]);

  // #admin hash — bot'dagi "Superadmin Dashboard" tugmasi shu yerga ochiladi
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (user?.role === 'superadmin' || user?.telegram_id === 8544023815 || user?.telegram_id === 8112688757) {
          setIsAdminOpen(true);
        }
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [user?.role, user?.telegram_id]);

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  // Bannerlar App darajasida saqlanadi — HomePage har tab almashtirganda
  // qayta mount bo'lsa ham ro'yxat yo'qolmaydi, fallback chiqmaydi
  const [banners, setBanners] = useState<Banner[]>(readBannersCache);
  const [bannersReady, setBannersReady] = useState(false);

  // Kurslarni yuklash (Offline fallback bilan)
  const refreshCourses = useCallback(async () => {
    try {
      const data = await api.getCourses();
      if (Array.isArray(data) && data.length > 0) {
        setCourses(data);
      }
    } catch {
      // Offline fallback: MOCK_COURSES
    }
  }, []);

  // Dashboard ma'lumotlarini yuklash. Sotib olingan kurslar ID'lari darhol
  // localStorage'ga yoziladi — keyingi ochilishda sotuv ro'yxati flicker qilmaydi.
  const refreshDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
      const enrolledIds = (data?.enrolled_courses || [])
        .map((c: any) => (c?.id ? String(c.id) : ''))
        .filter(Boolean);
      setCachedPurchasedIds(enrolledIds);
      writePurchasedCache([...enrolledIds, ...sessionPurchasedIds]);
    } catch {
      // Offline
    }
  }, [isAuthenticated, sessionPurchasedIds]);

  // Bildirishnomalarni yuklash
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch {
      // Offline
    }
  }, [isAuthenticated]);

  // Sertifikatlarni yuklash
  const refreshCertificates = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const certs = await api.getCertificates();
      setCertificates(certs);
    } catch {
      // Offline
    }
  }, [isAuthenticated]);

  // Bannerlarni yuklash: avval kesh ko'rsatiladi, keyin backend'dan yangi
  // ro'yxat keladi. Tarmoq xatosida kesh o'chirilmaydi (offline banner qoladi).
  const refreshBanners = useCallback(async () => {
    try {
      const bn = await api.getBanners();
      setBanners(bn);
      writeBannersCache(bn);
      // Rasm baytlarini oldindan isitamiz: slayd almashganda yoki tab qaytganda
      // WebView keshdan oladi, R2 ga qayta murojaat qilmaydi
      bn.forEach((b) => {
        if (b.image_url) {
          const img = new Image();
          img.src = toMediaUrl(b.image_url);
        }
      });
    } catch {
      // Offline — keshdagi bannerlar qoladi
    } finally {
      setBannersReady(true);
    }
  }, []);

  useEffect(() => {
    refreshCourses();
    refreshBanners();
  }, [refreshCourses, refreshBanners]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshDashboard();
      refreshNotifications();
      refreshCertificates();
    }
    // authVersion: yangi token olinganda dashboard qayta yuklanadi,
    // sotib olishlar tasdig'i iloji boricha tez aniqlanadi
  }, [isAuthenticated, authVersion, refreshDashboard, refreshNotifications, refreshCertificates]);

  // Telegram BackButton boshqaruvi: qaytish bor har qanday holatda ko'rinadi —
  // Android tizim "nazad" tugmasi aynan shu tugma ko'rsatilganda app ichida
  // qaytaradi (yashirin bo'lsa miniapp'ni yopadi)
  useEffect(() => {
    if (canGoBack) {
      showBackButton(goBack);
    } else {
      hideBackButton();
    }
  }, [canGoBack, showBackButton, hideBackButton, goBack]);

  const handlePlayLesson = async (course: Course, lesson: Lesson) => {
    try {
      const lData = await api.getProtectedLesson(course.id, lesson.id);
      setSelectedLesson({
        course,
        lesson: lData.lesson || lesson,
        moduleTitle: lData.module_title || 'Dars',
        prev: lData.prev_lesson_id || null,
        next: lData.next_lesson_id || null,
      });
    } catch {
      setSelectedLesson({
        course,
        lesson,
        moduleTitle: 'Dars',
        prev: null,
        next: null,
      });
    }
  };

  // Sotib olingan kurslar ID'lari — sotuv bo'limlarida ko'rsatilmaydi
  const purchasedCourseIds = useMemo(() => {
    const ids = new Set<string>(cachedPurchasedIds);
    sessionPurchasedIds.forEach((id) => ids.add(id));
    return ids;
  }, [cachedPurchasedIds, sessionPurchasedIds]);

  // Sotib olishlar hali aniqlanmagan (kesh yo'q va dashboard yuklanmoqda) —
  // bu holatda sotuv ro'yxati o'rniga skeleton ko'rsatiladi, flicker bo'lmaydi
  const purchasesLoading = isAuthenticated && !dashboardData && purchasedCourseIds.size === 0;

  // Splash Ekrani
  if (showSplash) {
    return <SplashPage onStart={() => setShowSplash(false)} />;
  }

  // 1. Lesson Player View
  if (selectedLesson) {
    return (
      <LessonPlayerPage
        course={selectedLesson.course}
        lesson={selectedLesson.lesson}
        moduleTitle={selectedLesson.moduleTitle}
        prevLessonId={selectedLesson.prev}
        nextLessonId={selectedLesson.next}
        onBack={goBack}
        onSelectLesson={async (c, lId) => {
          const lData = await api.getProtectedLesson(c.id, lId);
          setSelectedLesson({
            course: c,
            lesson: lData.lesson,
            moduleTitle: lData.module_title,
            prev: lData.prev_lesson_id,
            next: lData.next_lesson_id,
          });
        }}
      />
    );
  }

  // 2. Purchase Success View
  if (purchasedCourse) {
    return (
      <PurchaseSuccessPage
        course={purchasedCourse}
        onGoHome={() => {
          setPurchasedCourse(null);
          setSelectedCourse(null);
          setActiveTab('home');
        }}
      />
    );
  }

  // 3. Course Detail View
  if (selectedCourse) {
    return (
      <>
        <CourseDetailPage
          course={selectedCourse}
          onBack={goBack}
          onPurchase={(c) => {
            setCheckoutCourse(c);
            setIsCheckoutOpen(true);
          }}
          onPlayLesson={(c, l) => handlePlayLesson(c, l)}
        />

        {checkoutCourse && (
          <CheckoutModal
            course={checkoutCourse}
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={(c) => {
              setIsCheckoutOpen(false);
              setSessionPurchasedIds((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
              writePurchasedCache([...readPurchasedCache(), c.id]);
              setPurchasedCourse(c);
            }}
          />
        )}
        <NotificationsPanel
          isOpen={isNotifsOpen}
          notifications={notifications}
          onClose={() => setIsNotifsOpen(false)}
        />
      </>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // MAIN TAB LAYOUT (Rock-Solid Viewport & Unbreakable BottomNav)
  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-white text-[#0F172A] relative overflow-hidden">
      {/* Background Glow */}
      <div className="aurora pointer-events-none" />

      {/* Top Header */}
      <div className="flex-shrink-0 z-30 relative">
        <Header
          onOpenNotifications={() => setIsNotifsOpen(true)}
          onOpenSearch={() => setActiveTab('courses')}
          onOpenProfile={() => setActiveTab('profile')}
          unreadCount={unreadCount}
        />
      </div>

      {/* Scrollable Main Body — pastki bo'shliq nav balandligiga bog'liq emas, nav flow'da turadi */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pb-4 no-scrollbar">
        {activeTab === 'home' && (
          <HomePage
            courses={courses}
            banners={banners}
            bannersReady={bannersReady}
            purchasedCourseIds={purchasedCourseIds}
            purchasesLoading={purchasesLoading}
            continueData={dashboardData?.continue_learning || null}
            stats={dashboardData ? {
              completed_lessons_count: dashboardData.completed_lessons_count ?? 0,
              overall_progress_percent: dashboardData.overall_progress_percent ?? 0,
              enrolled_count: dashboardData.enrolled_courses?.length ?? 0,
            } : null}
            onSelectCourse={(c) => setSelectedCourse(c)}
            onNavigateToCatalog={() => setActiveTab('courses')}
            onNavigateToLearning={() => setActiveTab('learning')}
          />
        )}

        {activeTab === 'courses' && (
          <CatalogPage
            courses={courses}
            purchasedCourseIds={purchasedCourseIds}
            purchasesLoading={purchasesLoading}
            onSelectCourse={(c) => setSelectedCourse(c)}
            onNavigateToLearning={() => setActiveTab('learning')}
          />
        )}

        {activeTab === 'learning' && (
          isAuthenticated && dashboardData ? (
            <MyCoursesPage
              enrolledCourses={dashboardData.enrolled_courses}
              courses={courses}
              onSelectCourse={(c) => setSelectedCourse(c)}
              onExploreCourses={() => setActiveTab('courses')}
            />
          ) : (
            <LoginPage
              onSuccess={() => setActiveTab('learning')}
              onExploreCourses={() => setActiveTab('courses')}
            />
          )
        )}

        {activeTab === 'profile' && (
          isAuthenticated ? (
            <ProfilePage
              certificates={certificates}
              notifications={notifications}
              dashboardData={dashboardData}
              onNotificationsRead={refreshNotifications}
              onNavigateToCourses={() => setActiveTab('courses')}
            />
          ) : (
            <LoginPage
              onSuccess={() => setActiveTab('profile')}
              onExploreCourses={() => setActiveTab('courses')}
            />
          )
        )}
      </main>

      {/* Bottom Navigation — flex flow'da: scroll zona aynan nav ustida tugaydi, hech narsa to'silmaydi */}
      {!isNotifsOpen && !isAdminOpen && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Global Security Toast Alert */}
      {securityWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/95 backdrop-blur-lg text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-2 border border-red-400/50 animate-bounce max-w-[90vw] text-center">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{securityWarning}</span>
        </div>
      )}

      {/* Global Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotifsOpen}
        notifications={notifications}
        onClose={() => setIsNotifsOpen(false)}
      />

      {/* Full-Screen Superadmin Modal */}
      {isAdminOpen && (user?.role === 'superadmin' || user?.telegram_id === 8544023815 || user?.telegram_id === 8112688757) && (
        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          adminName={user?.name || 'Admin'}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <TelegramGate>
      <DesktopWrapper>
        <AppContent />
      </DesktopWrapper>
    </TelegramGate>
  );
}
