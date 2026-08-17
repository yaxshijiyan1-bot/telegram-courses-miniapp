import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DesktopWrapper } from './components/DesktopWrapper';
import { SplashPage } from './pages/SplashPage';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { PurchaseSuccessPage } from './pages/PurchaseSuccessPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { LessonPlayerPage } from './pages/LessonPlayerPage';
import { ProfilePage } from './pages/ProfilePage';
import { CheckoutModal } from './components/CheckoutModal';
import { NotificationsPanel } from './components/NotificationsPanel';

import { useAuth } from './context/AuthContext';
import { useTelegram } from './context/TelegramContext';
import { api, MOCK_COURSES } from './services/api';
import { Course, Lesson, Certificate, NotificationItem } from './types';
import { AdminDashboardModal } from './pages/AdminDashboardModal';

export const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showBackButton, hideBackButton } = useTelegram();

  // Navigation State
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ course: Course; lesson: Lesson; moduleTitle: string; prev: string | null; next: string | null } | null>(null);
  const [purchasedCourse, setPurchasedCourse] = useState<Course | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  // ---- ORTQA QAYTISH HIMOYASI ----
  // Ichki sahifa ochilganda browser tarixiga yozuv qo'shamiz. Shunda Telegram/Android
  // "orqaga" tugmasi ilovani YOPMASDAN shu yozuvni oladi va biz ichki navigatsiyani
  // bir qadam orqaga qaytaramiz (popstate orqali).
  const navStateRef = useRef({ selectedCourse, selectedLesson, purchasedCourse });
  navStateRef.current = { selectedCourse, selectedLesson, purchasedCourse };
  const historyDepthRef = useRef(0);

  const isInnerPage = !!(selectedCourse || selectedLesson || purchasedCourse);

  // Ichki sahifaga kirilganda tarix yozuvini qo'shish
  useEffect(() => {
    if (isInnerPage && historyDepthRef.current === 0) {
      window.history.pushState({ appInner: true }, '');
      historyDepthRef.current = 1;
    }
  }, [isInnerPage]);

  const closeTopLevel = useCallback(() => {
    const s = navStateRef.current;
    if (s.selectedLesson) setSelectedLesson(null);
    else if (s.purchasedCourse) setPurchasedCourse(null);
    else if (s.selectedCourse) setSelectedCourse(null);
  }, []);

  // OS/Telegram orqaga -> popstate
  useEffect(() => {
    const onPopState = () => {
      closeTopLevel();
      // Agar hali ichki sahifadamiz bo'lsa — keyingi "orqaga" uchun yana yozuv qo'shamiz
      setTimeout(() => {
        const s = navStateRef.current;
        if (s.selectedCourse || s.selectedLesson || s.purchasedCourse) {
          window.history.pushState({ appInner: true }, '');
        } else {
          historyDepthRef.current = 0;
        }
      }, 60);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeTopLevel]);

  // Barcha "orqaga" harakatlari uchun yagona funksiya
  const goBack = useCallback(() => {
    if (historyDepthRef.current > 0 && navStateRef.current.selectedCourse) {
      // popstate handler ishlashi uchun tarix orqali qaytaramiz
      window.history.back();
    } else {
      closeTopLevel();
    }
  }, [closeTopLevel]);

  // #admin hash — bot'dagi "Superadmin Dashboard" tugmasi shu yerga ochiladi
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (user?.role === 'superadmin') {
          setIsAdminOpen(true);
        }
        // Hashni tozalaymiz (sticky bo'lib qolmasin)
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [user?.role]);

  // Data states
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const cList = await api.getCourses();
        setCourses(cList);
        const dash = await api.getDashboard();
        setDashboardData(dash);
        const certs = await api.getCertificates();
        setCertificates(certs);
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch {}
    };
    loadData();
  }, [isAuthenticated]);

  // Bildirishnomalarni yangilash + ochilganda o'qilgan deb belgilash
  const refreshNotifications = useCallback(async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch {}
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setIsNotifsOpen(true);
    // Ochilgach o'qilgan deb belgilaymiz va ro'yxatni yangilaymiz
    api.markNotificationsRead().then(() => refreshNotifications()).catch(() => {});
  }, [refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Har safar sahifa yoki kurs o'zgarganda eng yuqoriga skroll qilish
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedCourse, selectedLesson, purchasedCourse, activeTab]);

  // Telegram BackButton — ichki sahifalarda
  useEffect(() => {
    if (selectedLesson || selectedCourse || purchasedCourse) {
      showBackButton(() => goBack());
    } else {
      hideBackButton();
    }
  }, [selectedLesson, selectedCourse, purchasedCourse, goBack]);

  // Handle Play Lesson
  const handlePlayLesson = async (course: Course, lesson: Lesson) => {
    try {
      const data = await api.getProtectedLesson(course.id, lesson.id);
      setSelectedLesson({
        course,
        lesson: data.lesson,
        moduleTitle: data.module_title,
        prev: data.prev_lesson_id,
        next: data.next_lesson_id
      });
    } catch {
      setSelectedLesson({
        course,
        lesson,
        moduleTitle: course.modules?.[0]?.title || '01. Kirish',
        prev: null,
        next: null
      });
    }
  };

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
            next: lData.next_lesson_id
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
        onStartLearning={() => {
          const targetCourse = purchasedCourse;
          setPurchasedCourse(null);
          if (targetCourse.modules?.[0]?.lessons?.[0]) {
            handlePlayLesson(targetCourse, targetCourse.modules[0].lessons[0]);
          } else {
            setActiveTab('learning');
          }
        }}
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a] relative">
      {/* Scrollable Container with Bottom Padding for Floating Navbar */}
      <div className="app-scroll">
        {/* Top App Header */}
        <Header
          onOpenNotifications={handleOpenNotifications}
          onOpenSearch={() => setActiveTab('courses')}
          onOpenProfile={() => setActiveTab('profile')}
          hasUnreadNotifications={unreadCount > 0}
        />

        {/* Main Tab Screen Switcher */}
        <main className="flex-1 flex flex-col relative">
          {activeTab === 'home' && (
            <HomePage
              courses={courses}
              continueData={dashboardData?.continue_learning || null}
              onSelectCourse={(c) => setSelectedCourse(c)}
              onNavigateToCatalog={() => setActiveTab('courses')}
              onNavigateToLearning={() => setActiveTab('learning')}
            />
          )}

          {activeTab === 'courses' && (
            <CatalogPage
              courses={courses}
              onSelectCourse={(c) => setSelectedCourse(c)}
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
      </div>

      {/* Persistent Floating Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        isAuthenticated={isAuthenticated}
      />

      {/* Bildirishnomalar Paneli */}
      <NotificationsPanel
        isOpen={isNotifsOpen}
        notifications={notifications}
        onClose={() => setIsNotifsOpen(false)}
      />

      {/* Superadmin Dashboard (bot tugmasi yoki profil orqali) */}
      {isAdminOpen && (user?.role === 'superadmin' || user?.telegram_id === 8544023815 || user?.telegram_id === 8112688757) && (
        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          adminName={user?.name || 'Yaxshi Bola'}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <DesktopWrapper>
      <AppContent />
    </DesktopWrapper>
  );
}
