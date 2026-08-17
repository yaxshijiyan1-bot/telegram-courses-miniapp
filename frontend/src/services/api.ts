import { Course, EnrolledCourse, ContinueLearningData, Certificate, NotificationItem, User, Lesson, AdminStats, PendingReceipt, AdminStudent, PaymentInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kurslar-backend-api.onrender.com/api';
const IS_DEV = import.meta.env.DEV;

// Boshlang'ich Offline/Fallback ma'lumotlar
export const MOCK_COURSES: Course[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    title: "Sun'iy Intellekt va Prompt Engineering Pro",
    slug: 'ai-prompt-engineering-pro',
    category: 'AI',
    short_description: "Gemini 3.7, Claude va ChatGPT orqali biznes, dasturlash va avtomatizatsiyani 10x tezlashtirish.",
    description: "Ushbu keng qamrovli kursda siz zamonaviy LLM modellari, Antigravity agentlar tizimi, vizual generatsiya va AI orqali real loyihalarni noldan professional darajada boshqarishni o'rganasiz.",
    cover_url: '/images/ai_course.jpg',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    price: 490000,
    old_price: 890000,
    discount_percent: 45,
    duration: '24 soat',
    lesson_count: 28,
    level: "Boshlang'ichdan Yuqori darajagacha",
    instructor_name: 'Yaxshi Bola',
    instructor_title: 'AI Architect & Senior Software Engineer',
    instructor_avatar: '/images/yaxshi_bola.jpg',
    instructor_bio: "AI Agentlar, LLM arxitekturasi va murakkab dasturiy ta'minotlar bo'yicha yetakchi mutaxassis.",
    rating: 5.0,
    student_count: 1420,
    is_enrolled: true,
    progress_percent: 68,
    modules: [
      {
        id: 'm1',
        title: '01. Kirish va LLM Asoslari',
        order: 1,
        lessons: [
          {
            id: 'l101',
            title: 'AI inqilobi va Prompt Engineering qanday ishlaydi?',
            duration: '12:45',
            order: 1,
            is_preview: true,
            completed: true,
            description: "Sun'iy intellektning hozirgi imkoniyatlari, kontekst oynasi, tokenlar va to'g'ri fikrlash modeli.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            resources: [{ name: 'AI_Asoslari_Qollanma.pdf', size: '2.4 MB', url: '#' }]
          },
          {
            id: 'l102',
            title: 'Master Prompt Arxitekturasi: Rol, Kontekst, Cheklovlar',
            duration: '18:20',
            order: 2,
            is_preview: true,
            completed: true,
            description: "Dasturlash, tahlil va matn generatsiyasida eng aniq natijaga erishish formulasini o'rganamiz.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            resources: [{ name: 'Prompt_Templates_Cheatsheet.pdf', size: '1.8 MB', url: '#' }]
          }
        ]
      },
      {
        id: 'm2',
        title: '02. Amaliy AI Dasturlash va Agentlar',
        order: 2,
        lessons: [
          {
            id: 'l103',
            title: 'Antigravity & Gemini 3.7 bilan kod yozish',
            duration: '22:15',
            order: 1,
            is_preview: false,
            completed: false,
            description: "Katta kod bazalarini tahlil qilish, avtonom agentlarni boshqarish va to'liq loyiha yaratish.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            resources: []
          }
        ]
      },
      {
        id: 'm3',
        title: '03. Real Biznes Loyiha va Yakuniy Imtihon',
        order: 3,
        lessons: [
          {
            id: 'l104',
            title: 'AI SaaS startupni 1 kunda ishga tushirish',
            duration: '28:50',
            order: 1,
            is_preview: false,
            completed: false,
            description: "Landing page, API, to'lov va foydalanuvchilar qabulini noldan oxirigacha qurish.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
            resources: []
          }
        ]
      }
    ]
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    title: 'Zamonaviy UI/UX va Mobile App Dizayn',
    slug: 'ui-ux-mobile-design',
    category: 'Dizayn',
    short_description: 'Figma, Design Systems va Apple Human Interface asosida mukammal mobil interfeyslar yaratish.',
    description: "Figma Masterclass, zamonaviy dizayn tokenlari, mikro-animatsiyalar, tipografiya va Telegram Mini App interfeyslarini xalqaro standartda yaratish bo'yicha to'liq amaliy qo'llanma.",
    cover_url: '/images/design_course.jpg',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    price: 550000,
    old_price: 950000,
    discount_percent: 42,
    duration: '30 soat',
    lesson_count: 35,
    level: "Amaliyotga yo'naltirilgan",
    instructor_name: 'Zuhra Olimova',
    instructor_title: 'Lead Product Designer & Art Director',
    instructor_avatar: '/images/zuhra_olimova.jpg',
    instructor_bio: "Fintech, EdTech va Telegram Mini App interfeyslari bo'yicha yetakchi Art Director.",
    rating: 5.0,
    student_count: 980
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    title: 'Telegram Bot & Mini App Fullstack Dasturlash',
    slug: 'telegram-miniapp-fullstack',
    category: 'Dasturlash',
    short_description: 'FastAPI, React, TypeScript va Telegram WebApp SDK orqali real Mini Applar va to‘lov tizimlarini qurish.',
    description: "Telegram platformasida Click, Payme, Supabase va Cloudflare R2 bilan ishlovchi to'liq tijoriy Mini Applarni ishlab chiqish, serverga deploy qilish va yuritish bo'yicha eng sara kurs.",
    cover_url: '/images/code_course.jpg',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    price: 690000,
    old_price: 1200000,
    discount_percent: 43,
    duration: '42 soat',
    lesson_count: 45,
    level: "O'rta va Professional",
    instructor_name: 'Yaxshi Bola',
    instructor_title: 'Telegram Fullstack Architect',
    instructor_avatar: '/images/yaxshi_bola.jpg',
    instructor_bio: "High-load tizimlar va Telegram ekotizimi bo'yicha yetakchi dasturchi va arxitektor.",
    rating: 4.9,
    student_count: 1850
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    title: 'High-Ticket SMM va Kontent Monetizatsiya',
    slug: 'high-ticket-smm-monetization',
    category: 'Marketing',
    short_description: 'Telegram va Instagram kanallardan yuqori chekli mijozlarni jalb qilish va sotuv voronkalari.',
    description: "Kontent reja, auditoriyani isitish (lead warming), video reels skriptlari, psixologik triggerlar va to'g'ri narxlash orqali barqaror daromad qilish sirlari.",
    cover_url: '/images/market_course.jpg',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    price: 390000,
    old_price: 700000,
    discount_percent: 44,
    duration: '16 soat',
    lesson_count: 20,
    level: "Boshlang'ich va Amaliyotchi",
    instructor_name: 'Zuhra Olimova',
    instructor_title: 'Marketing & Growth Strategist',
    instructor_avatar: '/images/zuhra_olimova.jpg',
    instructor_bio: "Yetakchi brendlar uchun sotuv voronkalari va o'sish strategiyalari muallifi.",
    rating: 4.9,
    student_count: 2100
  }
];

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async getCourses(category?: string, search?: string): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'Barchasi') params.append('category', category);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/courses?${params.toString()}`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let filtered = [...MOCK_COURSES];
    if (category && category !== 'Barchasi') {
      filtered = filtered.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(s) || c.instructor_name.toLowerCase().includes(s));
    }
    return filtered;
  }

  async getCourseDetail(slugOrId: string): Promise<Course> {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${slugOrId}`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const found = MOCK_COURSES.find(c => c.slug === slugOrId || c.id === slugOrId);
    if (!found) throw new Error('Kurs topilmadi');
    return found;
  }

  async login(login: string, password: string): Promise<{ token: string; user: User }> {
    // Backenddan kelgan xatolarni (noto'g'ri parol, taqiqlangan login) yashirmaymiz
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { token: data.access_token, user: data.user };
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login yoki parol noto\'g\'ri.');
  }

  async telegramAuth(initData: string, tgUser?: any): Promise<{ token: string; user: User }> {
    let res: Response | null = null;
    try {
      res = await fetch(`${API_BASE_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ init_data: initData, telegram_user: tgUser })
      });
    } catch {
      res = null;
    }

    if (res && res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { token: data.access_token, user: data.user };
    }

    // Backend aniq rad etdi (imzo yaroqsiz) — xatolikni qaytaramiz
    if (res) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Telegram autentifikatsiyasi xato.');
    }

    // Backendga ulanolmadi: faqat dev-rejimda (Telegram ichida bo'lmaganda) mock ishlatamiz
    if (!initData && IS_DEV && !tgUser) {
      const mockUser: User = { id: 'u1111111-1111-1111-1111-111111111111', name: 'Mehmon (Dev)', username: 'dev_user', role: 'student' };
      const mockToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { token: mockToken, user: mockUser };
    }
    if (!initData && !tgUser) {
      // Telegram ichida emas va initData yo'q — ochiq brauzerda
      throw new Error('Iltimos, Mini Appni Telegram ichidan oching.');
    }
    throw new Error('Serverga ulanib bo\'lmadi. Internetni tekshirib qayta urinib ko\'ring.');
  }

  async getDashboard(): Promise<{
    user_name: string;
    overall_progress_percent: number;
    completed_lessons_count: number;
    total_lessons_count: number;
    continue_learning: ContinueLearningData | null;
    enrolled_courses: EnrolledCourse[];
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/dashboard`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
      if (res.status === 401 || res.status === 403) {
        // Token yaroqsiz — soxta ma'lumot ko'rsatmaymiz
        return {
          user_name: 'Talaba',
          overall_progress_percent: 0,
          completed_lessons_count: 0,
          total_lessons_count: 0,
          continue_learning: null,
          enrolled_courses: []
        };
      }
    } catch {
      // Fallback
    }

    return {
      user_name: 'Talaba',
      overall_progress_percent: 0,
      completed_lessons_count: 0,
      total_lessons_count: 0,
      continue_learning: null,
      enrolled_courses: []
    };
  }

  async getProtectedLesson(courseId: string, lessonId: string): Promise<{
    lesson: Lesson;
    module_title: string;
    prev_lesson_id: string | null;
    next_lesson_id: string | null;
    completed: boolean;
  }> {
    let res: Response | null = null;
    try {
      res = await fetch(`${API_BASE_URL}/student/courses/${courseId}/lessons/${lessonId}`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      res = null; // tarmoq xatosi — offline fallback
    }

    // Server javob berdi lekin rad etdi (403 ruxsat yo'q / 404 topilmadi) — sun'iy ma'lumot ko'rsatmaymiz
    if (res) {
      throw new Error('Darsga kirish ruxsati yo‘q yoki dars topilmadi.');
    }

    // Faqat offline holatda kursning o'z ma'lumotiga qaytamiz
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course?.modules) {
      throw new Error('Internet aloqasi yo‘q. Keyinroq qayta urinib ko‘ring.');
    }

    let foundLesson: Lesson | null = null;
    let moduleTitle = '';
    const allLessons: Lesson[] = [];

    course.modules.forEach(m => {
      m.lessons.forEach(l => {
        allLessons.push(l);
        if (l.id === lessonId) {
          foundLesson = l;
          moduleTitle = m.title;
        }
      });
    });

    if (!foundLesson && allLessons.length > 0) foundLesson = allLessons[0];

    const currentIdx = allLessons.findIndex(l => l.id === foundLesson?.id);
    const prev = currentIdx > 0 ? allLessons[currentIdx - 1].id : null;
    const next = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1].id : null;

    if (!foundLesson) {
      throw new Error('Dars topilmadi.');
    }

    return {
      lesson: foundLesson,
      module_title: moduleTitle,
      prev_lesson_id: prev,
      next_lesson_id: next,
      completed: false
    };
  }

  async markLessonComplete(courseId: string, lessonId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/progress`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ course_id: courseId, lesson_id: lessonId, completed: true })
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    return true;
  }

  async createOrder(courseId: string, paymentMethod: string): Promise<{ order_id: string; amount: number; course_title: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/checkout/create-order`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ course_id: courseId, payment_method: paymentMethod })
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const course = MOCK_COURSES.find(c => c.id === courseId) || MOCK_COURSES[0];
    return {
      order_id: 'ord_' + Math.random().toString(36).substring(2, 10),
      amount: course.price,
      course_title: course.title
    };
  }

  async submitReceipt(payload: {
    course_id: string;
    course_title: string;
    amount: number;
    payment_method: string;
    receipt_image: string;
    student_name: string;
    username: string;
    telegram_id: number;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/checkout/submit-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'To‘lov chekini yuborishda xatolik');
    }
    return await res.json();
  }

  async getCertificates(): Promise<Certificate[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/certificates`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return [];
  }

  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return [];
  }

  async markNotificationsRead(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications/read-all`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ===== TO'LOV REKVIZITLARI =====

  async getPaymentInfo(): Promise<PaymentInfo | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/checkout/payment-info`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  // ===== SESSION TEKSHIRUVI =====

  async verifyToken(): Promise<'valid' | 'invalid' | 'offline'> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: this.getHeaders() });
      if (res.ok) return 'valid';
      if (res.status === 401 || res.status === 403) return 'invalid';
      return 'offline';
    } catch {
      return 'offline';
    }
  }

  clearCredentials() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ===== ADMIN API =====

  private async adminFetch(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        // Token yaroqsiz/eski — sessiyani tozalaymiz
        this.clearCredentials();
        throw new Error('Sessiya muddati tugagan. Iltimos, chiqib, qaytadan kiring.');
      }
      throw new Error(data.detail || `Xato: ${res.status}`);
    }
    return data;
  }

  async getAdminStats(): Promise<AdminStats> {
    return this.adminFetch('/admin/dashboard-stats');
  }

  async getPendingReceipts(): Promise<PendingReceipt[]> {
    return this.adminFetch('/admin/pending-receipts');
  }

  async approveReceipt(orderId: string): Promise<{ success: boolean; message: string }> {
    return this.adminFetch(`/admin/approve-receipt/${orderId}`, { method: 'POST' });
  }

  async rejectReceipt(orderId: string): Promise<{ success: boolean; message: string }> {
    return this.adminFetch(`/admin/reject-receipt/${orderId}`, { method: 'POST' });
  }

  async getAdminStudents(): Promise<AdminStudent[]> {
    return this.adminFetch('/admin/students');
  }

  async getAdminCourses(): Promise<Course[]> {
    return this.adminFetch('/admin/courses');
  }

  async createCourse(course: Partial<Course>): Promise<{ success: boolean; message: string }> {
    return this.adminFetch('/admin/courses', { method: 'POST', body: JSON.stringify(course) });
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<{ success: boolean; message: string }> {
    return this.adminFetch(`/admin/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(updates) });
  }

  async deleteCourse(courseId: string): Promise<{ success: boolean; message: string }> {
    return this.adminFetch(`/admin/courses/${courseId}`, { method: 'DELETE' });
  }

  async manualEnroll(userIdOrTgId: string, courseId: string): Promise<{ success: boolean; message: string }> {
    return this.adminFetch('/admin/manual-enroll', {
      method: 'POST',
      body: JSON.stringify({ user_id_or_tg_id: userIdOrTgId, course_id: courseId })
    });
  }

  async sendBroadcast(text: string, photoUrl?: string): Promise<{ success: boolean; sent_count: number; total_recipients: number; message: string }> {
    return this.adminFetch('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ text, photo_url: photoUrl || null })
    });
  }

  async savePaymentSettings(cardNumber: string, cardHolder: string, bankName: string): Promise<{ success: boolean }> {
    return this.adminFetch('/admin/payment-settings', {
      method: 'PUT',
      body: JSON.stringify({ card_number: cardNumber, card_holder: cardHolder, bank_name: bankName })
    });
  }
}

export const api = new ApiService();
