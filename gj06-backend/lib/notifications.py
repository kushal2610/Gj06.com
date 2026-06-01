import os
import json
from pywebpush import webpush, WebPushException
from lib.supabase_client import supabase
from dotenv import load_dotenv

load_dotenv()

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL = os.environ.get("VAPID_EMAIL", "mailto:owner@gj06.com.au")


def _get_subscriptions() -> list:
    """Fetch all push subscriptions from DB."""
    try:
        response = supabase.table("push_subscriptions").select("*").execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching subscriptions: {e}")
        return []


def _send_push(subscription: dict, payload: dict):
    """Send a single push notification."""
    if not VAPID_PRIVATE_KEY:
        print("VAPID_PRIVATE_KEY not set — skipping push notification")
        return

    try:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth":   subscription["auth"],
                }
            },
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_EMAIL}
        )
    except WebPushException as e:
        print(f"Push failed for {subscription['endpoint'][:40]}...: {e}")
        # If subscription is expired/invalid, remove it
        if "410" in str(e) or "404" in str(e):
            try:
                supabase.table("push_subscriptions").delete().eq(
                    "endpoint", subscription["endpoint"]
                ).execute()
                print("Removed stale subscription")
            except Exception:
                pass


async def notify_owner_new_order(order: dict):
    """
    Fires when a new order is paid and confirmed.
    Shows on owner's phone immediately.
    """
    items_summary = ", ".join(
        f"{i.get('qty', 1)}x {i.get('name', '')}"
        for i in order.get("items", [])
    )

    payload = {
        "title": f"🔔 New Order — ${order['total']:.2f}",
        "body":  f"{items_summary}\n{order['customer_name']} · Pickup: {order['pickup_time']}",
        "icon":  "/icon-192.png",
        "badge": "/badge.png",
        "tag":   f"order-{order['id']}",
        "data":  {
            "url":      "/admin/",
            "order_id": order["id"],
        }
    }

    for sub in _get_subscriptions():
        _send_push(sub, payload)


async def notify_owner_new_reservation(reservation: dict):
    """Fires when a customer submits a reservation."""
    payload = {
        "title": f"📅 New Reservation — {reservation['date']}",
        "body":  (
            f"{reservation['customer_name']} · "
            f"{reservation['guests']} guests · "
            f"{reservation['time']}"
        ),
        "icon":  "/icon-192.png",
        "tag":   f"reservation-{reservation['id']}",
        "data":  {"url": "/admin/"}
    }

    for sub in _get_subscriptions():
        _send_push(sub, payload)


async def notify_customer_order_ready(order: dict):
    """
    Fires when owner marks order as 'ready'.
    Notifies the customer their order is ready for pickup.
    Note: customer must have subscribed to push notifications
    at checkout time for this to work.
    """
    # For now we use owner's subscriptions
    # Customer push support can be added in Phase 2
    payload = {
        "title": "Your order is ready! 🫖",
        "body":  f"Hey {order['customer_name']}, come pick it up!",
        "icon":  "/icon-192.png",
        "tag":   f"ready-{order['id']}",
    }

    for sub in _get_subscriptions():
        _send_push(sub, payload)