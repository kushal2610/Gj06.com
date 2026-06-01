import os
from fastapi import APIRouter, HTTPException
from lib.supabase_client import supabase
from schemas import PushSubscription
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")


@router.get("/push/vapid-key")
def get_vapid_key():
    """Frontend fetches this to set up push subscription."""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="VAPID not configured")
    return {"public_key": VAPID_PUBLIC_KEY}


@router.post("/push/subscribe")
def subscribe(body: PushSubscription):
    """
    Owner's browser/phone calls this after granting notification permission.
    Saves the subscription so we can send push notifications.
    """
    try:
        data = {
            "endpoint": body.endpoint,
            "p256dh":   body.keys.get("p256dh", ""),
            "auth":     body.keys.get("auth", ""),
        }

        # Upsert — update if endpoint already exists
        supabase.table("push_subscriptions").upsert(
            data, on_conflict="endpoint"
        ).execute()

        return {"message": "Subscribed to push notifications"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/push/unsubscribe")
def unsubscribe(endpoint: str):
    """Remove a push subscription."""
    try:
        supabase.table("push_subscriptions").delete().eq(
            "endpoint", endpoint
        ).execute()
        return {"message": "Unsubscribed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))