from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Menu ──────────────────────────────────────────────
class MenuItemBase(BaseModel):
    category: str
    name: str
    description: Optional[str] = None
    price: float
    tag: Optional[str] = None
    available: bool = True
    sort_order: int = 0


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    tag: Optional[str] = None
    available: Optional[bool] = None
    sort_order: Optional[int] = None


class MenuItem(MenuItemBase):
    id: str

    class Config:
        from_attributes = True


# ── Orders ────────────────────────────────────────────
class OrderItem(BaseModel):
    id: str
    name: str
    price: float
    qty: int


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    items: List[OrderItem]
    total: float
    pickup_time: str


class OrderStatusUpdate(BaseModel):
    status: str  # confirmed | preparing | ready | collected


class Order(BaseModel):
    id: str
    stripe_payment_id: str
    customer_name: str
    customer_phone: str
    customer_email: str
    items: list
    total: float
    pickup_time: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Reservations ──────────────────────────────────────
class ReservationCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[EmailStr] = None
    date: str          # YYYY-MM-DD
    time: str          # e.g. "12:30 PM"
    guests: int
    notes: Optional[str] = None


class ReservationStatusUpdate(BaseModel):
    status: str        # pending | confirmed | cancelled


class Reservation(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    date: str
    time: str
    guests: int
    notes: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Auth ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Push Notifications ────────────────────────────────
class PushSubscription(BaseModel):
    endpoint: str
    keys: dict   # { p256dh: str, auth: str }


# ── Stripe ────────────────────────────────────────────
class CreatePaymentIntent(BaseModel):
    order: OrderCreate