import { describe, it, expect } from 'vitest';
import { UserSchema, CourseSchema, OrderSchema } from './index';
import { cn } from '../lib/utils';

describe('Zod Validation Schemas', () => {
  it('should validate valid user object', () => {
    const validUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      telegram_id: 12345678,
      first_name: 'Alisher',
      username: 'alisher_dev',
      coins: 100,
      streak: 5,
      role: 'student' as const,
    };
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should reject invalid course with empty title', () => {
    const invalidCourse = {
      id: 'course-1',
      title: 'A', // too short
      description: 'Short',
      thumbnail_url: 'https://example.com/thumb.jpg',
      price: -10, // negative price
      level: 'beginner' as const,
      category: 'IT',
    };
    const result = CourseSchema.safeParse(invalidCourse);
    expect(result.success).toBe(false);
  });

  it('should validate order payload', () => {
    const validOrder = {
      course_id: 'course-101',
      payment_method: 'payme' as const,
      promocode: 'DISCOUNT2026',
    };
    const result = OrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });
});

describe('Utils cn helper', () => {
  it('should merge class names properly', () => {
    const className = cn('p-4 text-white', 'p-2'); // p-2 overrides p-4
    expect(className).toBe('text-white p-2');
  });
});
