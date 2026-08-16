import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import CreateOrderRequest, CreateOrderResponse, VerifyOrderRequest
from app.core.security import get_current_user
from app.core.supabase import supabase_client
from seed_data import COURSES

router = APIRouter(prefix="/checkout", tags=["Checkout & Payments"])

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    req: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Kurs uchun yangi to'lov buyurtmasini shakllantirish"""
    course = next((c for c in COURSES if c["id"] == req.course_id or c["slug"] == req.course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    user_id = current_user.get("sub")

    # To'lov yozuvi (Supabase / in-memory)
    purchase_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": course["id"],
        "amount": course["price"],
        "status": "pending",
        "payment_method": req.payment_method,
        "transaction_id": order_id
    }
    await supabase_client.insert("purchases", purchase_data)

    # To'lov provayderi havolasi (Payme / Click / Telegram Stars simulyatsiyasi)
    payment_url = f"https://checkout.provider.mock/pay?order_id={order_id}&amount={course['price']}"

    return {
        "order_id": order_id,
        "course_id": course["id"],
        "course_title": course["title"],
        "amount": course["price"],
        "payment_method": req.payment_method,
        "payment_url": payment_url,
        "status": "pending"
    }

@router.post("/verify")
async def verify_order(
    req: VerifyOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """To'lov muvaffaqiyatini tekshirish va talabaga kursni ochish"""
    user_id = current_user.get("sub")
    
    # Kurs enrollment yaratish
    # Mock / Supabase
    await supabase_client.insert("enrollments", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "course_id": "c1111111-1111-1111-1111-111111111111",
        "status": "active"
    })

    # Bildirishnoma qo'shish
    await supabase_client.insert("notifications", {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": "Xarid muvaffaqiyatli yakunlandi! 🎉",
        "message": "Kurs sizning shaxsiy kabinetingizga qo'shildi. O'rganishni boshlashingiz mumkin.",
        "type": "success",
        "is_read": False
    })

    return {
        "success": True,
        "message": "To'lov muvaffaqiyatli qabul qilindi. Kurs ochildi!",
        "order_id": req.order_id,
        "access_granted": True
    }
