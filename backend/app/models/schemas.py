from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# USER SCHEMAS
class UserBase(BaseModel):
    name: str
    username: Optional[str] = None
    telegram_id: Optional[int] = None
    phone: Optional[str] = None
    role: str = "student"

class UserResponse(UserBase):
    id: str
    created_at: Optional[str] = None

# AUTH SCHEMAS
class TelegramAuthRequest(BaseModel):
    init_data: str
    telegram_user: Optional[Dict[str, Any]] = None

class DirectLoginRequest(BaseModel):
    login: str
    password: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# LESSON RESOURCE
class LessonResource(BaseModel):
    name: str
    size: Optional[str] = None
    url: str

# LESSON SCHEMA
class LessonBase(BaseModel):
    id: str
    title: str
    duration: str
    order: int
    is_preview: bool = False
    description: Optional[str] = None
    resources: List[LessonResource] = []

class LessonDetail(LessonBase):
    video_url: Optional[str] = None
    completed: bool = False
    last_position: int = 0

# MODULE SCHEMA
class ModuleWithLessons(BaseModel):
    id: str
    title: str
    order: int
    lessons: List[LessonBase] = []

# COURSE SCHEMAS
class CourseCard(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    short_description: Optional[str] = None
    cover_url: str
    price: int
    old_price: Optional[int] = None
    discount_percent: Optional[int] = None
    duration: str
    lesson_count: int
    level: str
    instructor_name: str
    instructor_title: str
    instructor_avatar: Optional[str] = None
    rating: float = 5.0
    student_count: int = 0

class CourseDetailResponse(CourseCard):
    description: str
    preview_video_url: Optional[str] = None
    instructor_bio: Optional[str] = None
    modules: List[ModuleWithLessons] = []
    is_enrolled: bool = False
    progress_percent: int = 0

# CHECKOUT SCHEMAS
class CreateOrderRequest(BaseModel):
    course_id: str
    payment_method: str = "payme" # payme, click, uzum, telegram_stars

class CreateOrderResponse(BaseModel):
    order_id: str
    course_id: str
    course_title: str
    amount: int
    payment_method: str
    payment_url: Optional[str] = None
    status: str = "pending"

class VerifyOrderRequest(BaseModel):
    order_id: str

# PROGRESS SCHEMA
class UpdateProgressRequest(BaseModel):
    course_id: str
    lesson_id: str
    completed: bool = True
    last_position: int = 0

# CERTIFICATE SCHEMA
class CertificateResponse(BaseModel):
    id: str
    course_id: str
    course_title: str
    student_name: str
    certificate_code: str
    issued_at: str
    certificate_url: Optional[str] = None

# NOTIFICATION SCHEMA
class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str
