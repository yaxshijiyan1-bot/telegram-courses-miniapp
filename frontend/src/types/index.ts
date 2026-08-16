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
  instructor_bio?: string;
  rating: number;
  student_count: number;
  modules?: Module[];
  is_enrolled?: boolean;
  progress_percent?: number;
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
  course_id: string;
  course_title: string;
  student_name: string;
  certificate_code: string;
  issued_at: string;
  certificate_url?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'course' | 'system' | 'success';
  is_read: boolean;
  created_at: string;
}

// ===== ADMIN TURLARI =====

export interface AdminStats {
  admin_name: string;
  admin_username: string;
  role: string;
  storage_backend: string;
  total_revenue: number;
  monthly_revenue: number;
  total_students: number;
  active_courses_count: number;
  pending_receipts_count: number;
  recent_sales: {
    id: string;
    student_name: string;
    course_title: string;
    amount: number;
    payment_method: string;
    status: string;
    date: string;
  }[];
}

export interface PendingReceipt {
  order_id: string;
  student_name: string;
  username: string;
  telegram_id: number;
  course_id: string;
  course_title: string;
  amount: number;
  payment_method: string;
  receipt_image: string | null;
  comment: string | null;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminStudent {
  id: string;
  name: string;
  username: string;
  telegram_id: number;
  role: string;
  enrolled_courses_count: number;
  enrolled_courses: string;
  overall_progress: string;
  joined_date: string;
  status: string;
}

export interface PaymentInfo {
  card_number: string;
  card_holder: string;
  bank_name: string;
  bot_username: string;
  bot_url: string;
}
