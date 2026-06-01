from fastapi import APIRouter, HTTPException, Depends
from typing import List
from lib.supabase_client import supabase
from schemas import MenuItem, MenuItemCreate, MenuItemUpdate
from api.auth import verify_admin_token

router = APIRouter()

# ── PUBLIC: Get full menu (website calls this) ────────
@router.get("/menu", response_model=List[MenuItem])
def get_menu():
    """
    Returns all available menu items grouped by category.
    Called by menu.html on page load.
    """
    try:
        response = (
            supabase.table("menu_items")
            .select("*")
            .eq("available", True)
            .order("category")
            .order("sort_order")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── PUBLIC: Get single item ───────────────────────────
@router.get("/menu/{item_id}", response_model=MenuItem)
def get_menu_item(item_id: str):
    try:
        response = (
            supabase.table("menu_items")
            .select("*")
            .eq("id", item_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Add new menu item ──────────────────────────
@router.post("/admin/menu", response_model=MenuItem)
def create_menu_item(
    item: MenuItemCreate,
    _: str = Depends(verify_admin_token)
):
    try:
        response = (
            supabase.table("menu_items")
            .insert(item.model_dump())
            .execute()
        )
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Update menu item (price, availability etc) ─
@router.put("/admin/menu/{item_id}", response_model=MenuItem)
def update_menu_item(
    item_id: str,
    updates: MenuItemUpdate,
    _: str = Depends(verify_admin_token)
):
    try:
        # Only send fields that were actually provided
        payload = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not payload:
            raise HTTPException(status_code=400, detail="No fields to update")

        response = (
            supabase.table("menu_items")
            .update(payload)
            .eq("id", item_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Toggle item availability ───────────────────
@router.patch("/admin/menu/{item_id}/toggle")
def toggle_availability(
    item_id: str,
    _: str = Depends(verify_admin_token)
):
    """Quick toggle — mark item as sold out or back in stock."""
    try:
        # Get current state
        current = (
            supabase.table("menu_items")
            .select("available")
            .eq("id", item_id)
            .single()
            .execute()
        )
        if not current.data:
            raise HTTPException(status_code=404, detail="Item not found")

        new_state = not current.data["available"]

        supabase.table("menu_items").update(
            {"available": new_state}
        ).eq("id", item_id).execute()

        return {
            "id": item_id,
            "available": new_state,
            "message": "In stock" if new_state else "Marked as sold out"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: Delete menu item ───────────────────────────
@router.delete("/admin/menu/{item_id}")
def delete_menu_item(
    item_id: str,
    _: str = Depends(verify_admin_token)
):
    try:
        supabase.table("menu_items").delete().eq("id", item_id).execute()
        return {"message": "Item deleted", "id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))