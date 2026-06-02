import os
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from dotenv import load_dotenv
from schemas import LoginRequest, TokenResponse

load_dotenv()

router = APIRouter()
bearer_scheme = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


def create_token() -> str:
    expiry = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    return jwt.encode(
        {"sub": "admin", "exp": expiry},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> str:
    """Dependency — add to any protected route."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        if payload.get("sub") != "admin":
            raise HTTPException(status_code=403, detail="Not authorised")
        return payload["sub"]
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please log in again."
        )


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest):
    """
    Owner logs in with their password.
    Returns a JWT token valid for 12 hours.
    """
    if not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_PASSWORD not configured in .env"
        )

    # Simple plain-text comparison for now
    # To use bcrypt: store hash in .env, compare with bcrypt.checkpw()
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")

    return TokenResponse(access_token=create_token())