import { z } from 'zod';

/**
 * Zod validation schemas for 2026 Mini App
 */

// User profile schema
export const UserSchema = z.object({
  id: z.string().uuid().or(z.string()),
  telegram_id: z.number().int().positive(),
  first_name: z.string().min(1, 'Ism kiritilishi shart'),
  last_name: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  coins: z.number().int().nonnegative().default(0),
  streak: z.number().int().nonnegative().default(0),
  role: z.enum(['student', 'admin']).default('student'),
  created_at: z.string().optional(),
});

export type UserType = z.infer<typeof UserSchema>;

// Course schema
export const CourseSchema = z.object({
  id: z.string().uuid().or(z.string()),
  title: z.string().min(3, 'Kurs nomi kamida 3 belgidan iborat bo‘lishi kerak'),
  description: z.string().min(10, 'Kurs tavsifi batafsilroq bo‘lishi kerak'),
  thumbnail_url: z.string().url(),
  price: z.number().nonnegative(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().min(1),
  lessons_count: z.number().int().nonnegative().default(0),
  duration_minutes: z.number().int().nonnegative().default(0),
  rating: z.number().min(0).max(5).default(5.0),
  is_published: z.boolean().default(true),
});

export type CourseType = z.infer<typeof CourseSchema>;

// Purchase order schema
export const OrderSchema = z.object({
  course_id: z.string().min(1, 'Kurs tanlanishi shart'),
  payment_method: z.enum(['payme', 'click', 'stars', 'crypto']),
  promocode: z.string().optional().nullable(),
});

export type OrderType = z.infer<typeof OrderSchema>;

// Review submit schema
export const ReviewSchema = z.object({
  course_id: z.string().min(1),
  rating: z.number().int().min(1).max(5, 'Baho 1 dan 5 gacha bo‘lishi kerak'),
  comment: z.string().min(3, 'Fikr kamida 3 belgidan iborat bo‘lishi kerak').max(500),
});

export type ReviewType = z.infer<typeof ReviewSchema>;
