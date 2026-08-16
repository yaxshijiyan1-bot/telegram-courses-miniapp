-- ==============================================================================
-- TELEGRAM MINI APP — PREMIUM KURSLAR PLATFORMASI DATABASE SCHEMA
-- Supabase / PostgreSQL Schema
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    cover_url TEXT NOT NULL,
    preview_video_url TEXT,
    price BIGINT NOT NULL,
    old_price BIGINT,
    discount_percent INT,
    duration VARCHAR(50),
    lesson_count INT DEFAULT 0,
    level VARCHAR(50) DEFAULT 'Boshlang''ich va Professional',
    instructor_name VARCHAR(255) NOT NULL,
    instructor_title VARCHAR(255) NOT NULL,
    instructor_avatar TEXT,
    instructor_bio TEXT,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    student_count INT DEFAULT 0,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MODULES TABLE
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration VARCHAR(50) NOT NULL,
    "order" INT NOT NULL DEFAULT 1,
    is_preview BOOLEAN DEFAULT false,
    resources JSONB DEFAULT '[]'::jsonb,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PURCHASES / ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    payment_method VARCHAR(50) DEFAULT 'payme',
    transaction_id VARCHAR(255),
    telegram_id BIGINT,
    student_name VARCHAR(255),
    username VARCHAR(255),
    course_title VARCHAR(255),
    receipt_image_url TEXT,
    comment TEXT,
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction ON public.purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- 7. ENROLLMENTS (SOTIB OLINGAN KURSLAR HUQUQI)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- 8. LESSON PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_position INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- 9. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    certificate_code VARCHAR(100) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    course_title VARCHAR(255) NOT NULL,
    certificate_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);

-- ENABLE RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (anon & authenticated)
CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (published = true);
CREATE POLICY "Public modules are viewable by everyone" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Public lessons basic info viewable by everyone" ON public.lessons FOR SELECT USING (published = true);
CREATE POLICY "Users can view their own data" ON public.users FOR ALL USING (true);
CREATE POLICY "Enrollments viewable by enrolled user" ON public.enrollments FOR ALL USING (true);
CREATE POLICY "Progress viewable by user" ON public.lesson_progress FOR ALL USING (true);
CREATE POLICY "Certificates viewable by user" ON public.certificates FOR ALL USING (true);
CREATE POLICY "Notifications viewable by user" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Purchases viewable by user" ON public.purchases FOR ALL USING (true);
