import os
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from lib.supabase_client import supabase
from schemas import Order, OrderCreate, OrderStatusUpdate, CreatePaymentIntent
from api.auth import verify_admin_token
import stripe
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


# ── PUBLIC: Create Stripe checkout session ────────────
@router.post("/orders/checkout")
def create_checkout_session(body: CreatePaymentIntent):
    """
    Customer submits their cart.
    We create a Stripe Checkout session and return the URL.
    Customer is redirected to Stripe to pay.
    After payment, Stripe redirects back and fires the webhook.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    try:
        # Build line items for Stripe
        line_items = [
            {
                "price_data": {
                    "currency": "aud",
                    "product_data": {
                        "name": item.name,
                    },
                    "unit_amount": int(item.price * 100),  # cents
                },
                "quantity": item.qty,
            }
            for item in body.order.items
        ]

        # Store order details in metadata so webhook can retrieve them
        metadata = {
            "customer_name":  body.order.customer_name,
            "customer_phone": body.order.customer_phone,
            "customer_email": body.order.customer_email,
            "pickup_time":    body.order.pickup_time,
            "items":          str([i.model_dump() for i in body.order.items]),
            "total":          str(body.order.total),
        }

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            customer_email=body.order.customer_email,
            metadata=metadata,
            success_url=f"{FRONTEND_URL}/order-confirmation.html?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/menu.html?cancelled=true",
        )

        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── PUBLIC: Stripe webhook ────────────────────────────
@router.post("/orders/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe calls this after payment succeeds.
    We save the order to Supabase and fire notifications.
    This MUST use the raw request body for signature verification.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        # Only proceed if payment was successful
        if session["payment_status"] != "paid":
            return {"status": "ignored"}

        metadata = session.get("metadata", {})

        # Save order to Supabase
        try:
            import ast
            order_data = {
                "stripe_payment_id": session["id"],
                "customer_name":     metadata.get("customer_name"),
                "customer_phone":    metadata.get("customer_phone"),
                "customer_email":    metadata.get("customer_email"),
                "items":             ast.literal_eval(metadata.get("items", "[]")),
                "total":             float(metadata.get("total", 0)),
                "pickup_time":       metadata.get("pickup_time"),
                "status":            "confirmed",
            }

            response = supabase.table("orders").insert(order_data).execute()
            order = response.data[0] if response.data else None

            if order:
                # Fire push notification to owner's phone
                from lib.notifications import notify_owner_new_order
                await notify_owner_new_order(order)

                # Send confirmation email to customer
                from lib.email import send_order_confirmation
                await send_order_confirmation(order)

        except Exception as e:
            # Log but don't fail — Stripe already has the payment
            print(f"Error saving order: {e}")

    return {"status": "ok"}


# ── PUBLIC: Get order by session ID (confirmation page) ──
@router.get("/orders/confirm/{session_id}")
def get_order_by_session(session_id: str):
    """Called by order-confirmation.html to show order details."""
    try:
        response = (
            supabase.table("orders")
            .select("*")
            .eq("stripe_payment_id", session_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Get all orders ─────────────────────────────
@router.get("/admin/orders", response_model=List[Order])
def get_orders(
    status: str = None,
    _: str = Depends(verify_admin_token)
):
    """
    Owner dashboard calls this.
    Optional ?status=confirmed filter.
    """
    try:
        query = supabase.table("orders").select("*").order(
            "created_at", desc=True
        )
        if status:
            query = query.eq("status", status)

        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Update order status ────────────────────────
@router.patch("/admin/orders/{order_id}")
def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    _: str = Depends(verify_admin_token)
):
    """
    Owner marks order as: confirmed → preparing → ready → collected
    When marked 'ready', customer gets a push notification.
    """
    valid_statuses = ["confirmed", "preparing", "ready", "collected"]
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {valid_statuses}"
        )

    try:
        response = (
            supabase.table("orders")
            .update({"status": body.status})
            .eq("id", order_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")

        order = response.data[0]

        # Notify customer when order is ready
        if body.status == "ready":
            from lib.notifications import notify_customer_order_ready
            import asyncio
            asyncio.create_task(notify_customer_order_ready(order))

        return {"id": order_id, "status": body.status, "message": "Updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))