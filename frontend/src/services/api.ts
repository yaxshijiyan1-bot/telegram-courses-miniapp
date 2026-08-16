import { Course, EnrolledCourse, ContinueLearningData, Certificate, NotificationItem, User, Lesson } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kurslar-backend-api.onrender.com/api';

// Boshlang'ich Offline/Fallback ma'lumotlar
export const MOCK_COURSES: Course[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    title: "Sun'iy Intellekt va Prompt Engineering Pro",
    slug: 'ai-prompt-engineering-pro',
    category: 'AI',
    short_description: "Gemini 3.7, Claude va ChatGPT orqali biznes, dasturlash va avtomatizatsiyani 10x tezlashtirish.",
    description: "Ushbu keng qamrovli kursda siz zamonaviy LLM modellari, Antigravity agentlar tizimi, Nano Banana vizual generatsiyasi va AI orqali real loyihalarni noldan professional darajada boshqarishni o'rganasiz.",
    cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    price: 490000,
    old_price: 890000,
    discount_percent: 45,
    duration: '24 soat',
    lesson_count: 28,
    level: "Boshlang'ichdan Yuqori darajagacha",
    instructor_name: 'Yaxshi Bola',
    instructor_title: 'AI Architect & Senior Software Engineer',
    instructor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    instructor_bio: 'AI Agentlar, LLM arxitekturasi va murakkab dasturiy ta\'minotlar bo\'yicha yetakchi mutaxassis.',
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
          },
          {
            id: 'l103',
            title: 'Zero-shot, Few-shot va Chain-of-Thought texnikalari',
            duration: '15:10',
            order: 3,
            is_preview: false,
            completed: false,
            description: "Murakkab masalalarni AI ga bosqichma-bosqich yechtirish va xatolarni 90% ga kamaytirish usullari.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            resources: [{ name: 'CoT_Amaliy_Topshiriqlar.pdf', size: '3.1 MB', url: '#' }]
          }
        ]
      },
      {
        id: 'm2',
        title: '02. Amaliy AI Dasturlash va Agentlar',
        order: 2,
        lessons: [
          {
            id: 'l104',
            title: 'Antigravity & Gemini 3.7 bilan kod yozish',
            duration: '22:15',
            order: 1,
            is_preview: false,
            completed: false,
            description: "Katta kod bazalarini tahlil qilish, avtonom agentlarni boshqarish va to'liq loyiha yaratish.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            resources: [{ name: 'Agent_Workflows_Config.json', size: '540 KB', url: '#' }]
          },
          {
            id: 'l105',
            title: 'Avtomatik QA va Refinement strategiyasi',
            duration: '19:40',
            order: 2,
            is_preview: false,
            completed: false,
            description: "Koddagi xatolarni avtomatik test qilish va xavfsiz deployga tayyorlash.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
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
            id: 'l106',
            title: 'AI SaaS startupni 1 kunda ishga tushirish',
            duration: '28:50',
            order: 1,
            is_preview: false,
            completed: false,
            description: "Landing page, API, to'lov va foydalanuvchilar qabulini noldan oxirigacha qurish.",
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
            resources: [{ name: 'Startup_Blueprint.pdf', size: '5.6 MB', url: '#' }]
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
    cover_url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    price: 550000,
    old_price: 950000,
    discount_percent: 42,
    duration: '30 soat',
    lesson_count: 35,
    level: "Amaliyotga yo'naltirilgan",
    instructor_name: 'Zuhra Olimova',
    instructor_title: 'Lead Product Designer & Art Director',
    instructor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    instructor_bio: "Fintech, EdTech va Telegram Mini App interfeyslari bo'yicha yetakchi Art Director.",
    rating: 5.0,
    student_count: 980
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    title: "Telegram Bot & Mini App Fullstack Dasturlash",
    slug: "telegram-miniapp-fullstack",
    category: "Dasturlash",
    short_description: "FastAPI, React, TypeScript va Telegram WebApp SDK orqali real Mini Applar va to'lov tizimlarini qurish.",
    description: "Telegram platformasida Click, Payme, Supabase va Cloudflare R2 bilan ishlovchi to'liq tijoriy Mini Applarni ishlab chiqish, serverga deploy qilish va yuritish bo'yicha eng sara kurs.",
    cover_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    preview_video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    price: 690000,
    old_price: 1200000,
    discount_percent: 43,
    duration: "42 soat",
    lesson_count: 45,
    level: "O'rta va Professional",
    instructor_name: "Yaxshi Bola",
    instructor_title: "Telegram Fullstack Architect",
    instructor_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    instructor_bio: "High-load tizimlar va Telegram ekotizimi bo'yicha yetakchi dasturchi va arxitektor.",
    rating: 4.9,
    student_count: 1850
  },
  {
    id: "c4444444-4444-4444-4444-444444444444",
    title: "High-Ticket SMM va Kontent Monetizatsiya",
    slug: "high-ticket-smm-monetization",
    category: "Marketing",
    short_description: "Telegram va Instagram kanallardan yuqori chekli mijozlarni jalb qilish va sotuv voronkalari.",
    description: "Kontent reja, auditoriyani isitish (lead warming), video reels skriptlari, psixologik triggerlar va to'g'ri narxlash orqali oyiga barqaror daromad qilish sirlari.",
    cover_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    price: 390000,
    old_price: 700000,
    discount_percent: 44,
    duration: '16 soat',
    lesson_count: 20,
    level: "Boshlang'ich va Amaliyotchi",
    instructor_name: 'Zuhra Olimova',
    instructor_title: 'Marketing & Growth Strategist',
    instructor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    instructor_bio: "100+ dan ortiq brendlar va shaxsiy bloglar uchun million dollarlik sotuv voronkalari muallifi.",
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
    try {
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
    } catch {
      // Fallback local auth
    }

    const mockUser: User = {
      id: 'u1111111-1111-1111-1111-111111111111',
      name: login.charAt(0).toUpperCase() + login.slice(1),
      username: login.toLowerCase(),
      role: 'student'
    };
    const mockToken = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { token: mockToken, user: mockUser };
  }

  async telegramAuth(initData: string, tgUser?: any): Promise<{ token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ init_data: initData, telegram_user: tgUser })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { token: data.access_token, user: data.user };
      }
    } catch {
      // Fallback
    }

    const name = tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : 'Abdurahmon Fayzullayev';
    const mockUser: User = {
      id: 'u1111111-1111-1111-1111-111111111111',
      telegram_id: tgUser?.id || 123456789,
      name: name || 'Talaba',
      username: tgUser?.username || 'abdurahmon_dev',
      role: 'student'
    };
    const mockToken = 'mock_jwt_token_tg_' + Date.now();
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { token: mockToken, user: mockUser };
  }

  async getDashboard(): Promise<{
    user_name: string;
    overall_progress_percent: number;
    completed_lessons_count: number;
    total_lessons_count: number;
    continue_learning: ContinueLearningData;
    enrolled_courses: EnrolledCourse[];
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/dashboard`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    return {
      user_name: 'Abdurahmon',
      overall_progress_percent: 68,
      completed_lessons_count: 24,
      total_lessons_count: 35,
      continue_learning: {
        course_id: MOCK_COURSES[0].id,
        course_title: MOCK_COURSES[0].title,
        course_cover: MOCK_COURSES[0].cover_url,
        lesson_id: 'l102',
        lesson_title: 'Master Prompt Arxitekturasi: Rol, Kontekst, Cheklovlar',
        lesson_duration: '18:20',
        progress_percent: 68,
        progress_text: '24 / 35 dars'
      },
      enrolled_courses: [
        {
          id: MOCK_COURSES[0].id,
          title: MOCK_COURSES[0].title,
          slug: MOCK_COURSES[0].slug,
          cover_url: MOCK_COURSES[0].cover_url,
          instructor_name: MOCK_COURSES[0].instructor_name,
          progress_percent: 68,
          completed_lessons: 24,
          total_lessons: 35,
          last_lesson_title: 'Master Prompt Arxitekturasi: Rol, Kontekst, Cheklovlar',
          status: 'in_progress'
        }
      ]
    };
  }

  async getProtectedLesson(courseId: string, lessonId: string): Promise<{
    lesson: Lesson;
    module_title: string;
    prev_lesson_id: string | null;
    next_lesson_id: string | null;
    completed: boolean;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/courses/${courseId}/lessons/${lessonId}`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const course = MOCK_COURSES.find(c => c.id === courseId) || MOCK_COURSES[0];
    let foundLesson: Lesson | null = null;
    let moduleTitle = '01. Kirish va LLM Asoslari';
    let allLessons: Lesson[] = [];

    course.modules?.forEach(m => {
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

    return {
      lesson: foundLesson || {
        id: lessonId,
        title: "Sun'iy Intellekt Asoslari",
        duration: '14:20',
        order: 1,
        description: "Ushbu darsda zamonaviy sun'iy intellekt texnologiyalari va ularning ishlash mexanizmi o'rganiladi.",
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        resources: [{ name: 'Dars_slaydlari.pdf', size: '2.8 MB', url: '#' }]
      },
      module_title: moduleTitle,
      prev_lesson_id: prev,
      next_lesson_id: next,
      completed: true
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

  async getCertificates(): Promise<Certificate[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/student/certificates`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    return [
      {
        id: 'cert-1',
        course_id: MOCK_COURSES[0].id,
        course_title: "Sun'iy Intellekt va Prompt Engineering Pro",
        student_name: 'Abdurahmon Fayzullayev',
        certificate_code: 'CERT-AI-2026-8942',
        issued_at: '15-Avgust, 2026',
        certificate_url: '#'
      }
    ];
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

    return [
      {
        id: 'notif-1',
        title: 'Tabriklaymiz! 🎉',
        message: "Siz 'AI Prompt Engineering' kursining 1-modulini muvaffaqiyatli yakunladingiz.",
        type: 'success',
        is_read: false,
        created_at: 'Bugun, 14:30'
      },
      {
        id: 'notif-2',
        title: 'Yangi bonus material yuklandi',
        message: "Figma design tokenlari va master shablonlar PDF fayli darsga biriktirildi.",
        type: 'info',
        is_read: true,
        created_at: 'Kecha, 18:00'
      }
    ];
  }
}

export const api = new ApiService();
