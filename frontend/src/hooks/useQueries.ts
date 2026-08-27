import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Course, EnrolledCourse, Certificate, NotificationItem, PaymentInfo } from '../types';

/**
 * 2026 TanStack Query Hooks for Telegram Mini App
 */

// 1. Kurslar katalogi hook
export const useCoursesQuery = () => {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.getCourses(),
    staleTime: 0, // Har safar yangisini tortish
  });
};

// 2. Yagona kurs ma'lumotlari hook
export const useCourseDetailQuery = (courseIdOrSlug: string | undefined) => {
  return useQuery<Course | null>({
    queryKey: ['course', courseIdOrSlug],
    queryFn: () => {
      if (!courseIdOrSlug) return null;
      return api.getCourseDetail(courseIdOrSlug);
    },
    enabled: !!courseIdOrSlug,
    staleTime: 0,
  });
};

// 3. Talabaning dashboard ma'lumotlari hook
export const useStudentDashboardQuery = () => {
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 1000 * 60 * 2,
  });
};

// 4. Sertifikatlar hook
export const useCertificatesQuery = () => {
  return useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn: () => api.getCertificates(),
    staleTime: 1000 * 60 * 15,
  });
};

// 5. Bildirishnomalar hook
export const useNotificationsQuery = () => {
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

// 6. To'lov rekvizitlari hook
export const usePaymentInfoQuery = () => {
  return useQuery<PaymentInfo | null>({
    queryKey: ['payment-info'],
    queryFn: () => api.getPaymentInfo(),
    staleTime: 1000 * 60 * 30,
  });
};
