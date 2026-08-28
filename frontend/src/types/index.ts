export interface User {
  id: string;
  telegram_id?: number;
  name: string;
  username?: string;
  phone?: string;
  role: string;
}

export interface LessonResource {
  name: string;
  size?: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  order: number;
  is_preview?: boolean;
  description?: string;
  video_url?: string;
  resources?: LessonResource[];
  completed?: boolean;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseTestimonial {
  id?: string;
  name: string;
  role?: string;
  text: string;
  rating: number;
  avatar?: string;
}

export interface CourseCustomInfo {
  id?: string;
  title: string;
  content: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description?: string;
  description: string;
  cover_url: string;
  preview_video_url?: string;
  price: number;
  old_price?: number;
  discount_percent?: number;
  duration: string;
  lesson_count: number;
  level: string;
  instructor_name: string;
  instructor_title: string;
  instructor_avatar?: string;
  instructor_id?: string;
  instructor_bio?: string;
  /** Yopiq dars kanali IDsi, masalan: -1001234567890 */
  telegram_channel_id?: number | string;
  rating: number;
  student_count: number;
  modules?: Module[];
  is_enrolled?: boolean;
  progress_percent?: number;
  /** Kursdan lavhalar / galereya rasmlari */
  gallery_urls?: string[];
  /** O'quvchilar va mutaxassislar fikrlari */
  testimonials?: CourseTestimonial[];
  /** Qo'shimcha erkin ma'lumot bloklari */
  custom_info?: CourseCustomInfo[];
  /** Kursda nimalarni o'rganasiz bandlari */
  learning_outcomes?: string[];
  /** Bo'limlarni yoqish/o'chirish sozlamalari */
  show_instructor?: boolean;
  show_outcomes?: boolean;
}


export interface ContinueLearningData {
  course_id: string;
  course_title: string;
  course_cover: string;
  lesson_id: string;
  lesson_title: string;
  lesson_duration: string;
  progress_percent: number;
  progress_text: string;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  instructor_name?: string;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  last_lesson_title: string;
  status: 'in_progress' | 'completed';
}

export interface Certificate {
  id: string;
  certificate_code: string;
  student_name: string;
  course_title: string;
  course_cover?: string;
  instructor_name?: string;
  issue_date: string;
  grade?: string;
  qr_code_url?: string;
  verification_url?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent' | 'announcement';
  created_at: string;
  is_read: boolean;
  link?: string;
}

export interface StudentDashboardData {
  user_name: string;
  overall_progress_percent: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  continue_learning: ContinueLearningData | null;
  enrolled_courses: EnrolledCourse[];
}

export interface AdminStats {
  total_revenue: number;
  monthly_revenue: number;
  total_students: number;
  active_courses_count: number;
}

export interface PendingReceipt {
  order_id: string;
  student_name: string;
  username: string;
  telegram_id: number;
  course_title: string;
  amount: number;
  payment_method: string;
  receipt_image: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  username?: string;
  telegram_id?: number;
  role?: string;
  overall_progress?: string;
  enrolled_courses?: string;
  enrolled_courses_count?: number;
  courses?: { id: string; title: string }[];
  joined_date?: string;
  status?: string;
  is_blocked?: boolean;
  created_at: string;
}

export type BannerActionType = 'link' | 'course' | 'none';

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  tag_color?: string;
  image_url: string;
  action_type: BannerActionType;
  action_value?: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
}

export interface PaymentInfoAdmin {
  name: string;
  username: string;
  telegram_url: string;
  role: string;
}

export interface PaymentInfo {
  card_number: string;
  card_holder: string;
  bank_name: string;
  admins: PaymentInfoAdmin[];
  bot_username: string;
  bot_url: string;
}

