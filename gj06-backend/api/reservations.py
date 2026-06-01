from fastapi import APIRouter, HTTPException, Depends
from typing import List
from lib.supabase_client import supabase
from schemas import ReservationCreate, Reservation, ReservationStatusUpdate
from api.auth import verify_admin_token

router = APIRouter()

# ── PUBLIC: Submit reservation ────────────────────────
@router.post("/reservations")
async def create_reservation(body: ReservationCreate):
    """
    Customer submits reservation form.
    Saves to Supabase and fires push notification to owner.
    No payment required for reservations.
    """
    try:
        data = body.model_dump()
        response = supabase.table("reservations").insert(data).execute()
        reservation = response.data[0]

        # Push notification to owner's phone
        from lib.notifications import notify_owner_new_reservation
        await notify_owner_new_reservation(reservation)

        # Confirmation email to customer if email provided
        if body.customer_email:
            from lib.email import send_reservation_confirmation
            await send_reservation_confirmation(reservation)

        return {
            "id": reservation["id"],
            "message": "Reservation received! We'll confirm shortly."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Get all reservations ───────────────────────
@router.get("/admin/reservations", response_model=List[Reservation])
def get_reservations(
    date: str = None,
    _: str = Depends(verify_admin_token)
):
    """
    Owner views all reservations.
    Optional ?date=2026-01-15 filter for a specific day.
    """
    try:
        query = supabase.table("reservations").select("*").order(
            "date"
        ).order("time")

        if date:
            query = query.eq("date", date)

        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Update reservation status ─────────────────
@router.patch("/admin/reservations/{reservation_id}")
def update_reservation_status(
    reservation_id: str,
    body: ReservationStatusUpdate,
    _: str = Depends(verify_admin_token)
):
    valid = ["pending", "confirmed", "cancelled"]
    if body.status not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {valid}"
        )

    try:
        response = (
            supabase.table("reservations")
            .update({"status": body.status})
            .eq("id", reservation_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Reservation not found")

        return {
            "id": reservation_id,
            "status": body.status,
            "message": "Reservation updated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))