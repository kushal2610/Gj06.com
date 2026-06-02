import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from api import menu, orders, reservations, auth, push

load_dotenv()

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(
    title="GJ 06 API",
    description="Backend for GJ 06 — A Magical 2D Cafe & Bakehouse",
    version="1.0.0",
    # Disable docs in production for security
    docs_url="/api/docs" if os.environ.get("ENV") != "production" else None,
    redoc_url=None,
)

# ── CORS ──────────────────────────────────────────────
# Allows your frontend HTML files to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5500",   # VS Code Live Server
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ────────────────────────────────────────
app.include_router(auth.router,         prefix="/api", tags=["Auth"])
app.include_router(menu.router,         prefix="/api", tags=["Menu"])
app.include_router(orders.router,       prefix="/api", tags=["Orders"])
app.include_router(reservations.router, prefix="/api", tags=["Reservations"])
app.include_router(push.router,         prefix="/api", tags=["Push Notifications"])

# ── Serve admin panel ─────────────────────────────────
@app.get("/admin")
@app.get("/admin/")
def serve_admin():
    return FileResponse("frontend/admin/index.html")

# ── Health check ──────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "GJ 06 API",
        "version": "1.0.0"
    }


# ── Local dev server ──────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True   # auto-restarts when you save a file
    )