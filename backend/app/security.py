import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    # bcrypt operates on the first 72 bytes; truncating keeps long passwords working.
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


def create_access_token(subject: str, role: str, session_id: str | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    if session_id:
        payload["sid"] = session_id
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


# --- opaque tokens (invitations, refresh tokens) and OTPs (Module 6) ---


def generate_opaque_token() -> str:
    """URL-safe random token for invitations and refresh tokens (the raw value is
    shown once; only its hash is stored)."""
    return secrets.token_urlsafe(32)


def hash_token(raw: str) -> str:
    """SHA-256 hash for opaque tokens/OTPs at rest. (Tokens are high-entropy, so a
    fast hash is fine here — unlike passwords, which use bcrypt.)"""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def generate_otp() -> str:
    """6-digit numeric OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def utc_in(*, hours: int = 0, minutes: int = 0, days: int = 0) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=hours, minutes=minutes, days=days)


def is_expired(expires_at: datetime) -> bool:
    """Compare an expiry against now, tolerating naive datetimes from backends
    (e.g. SQLite) that drop tz info — assume stored times are UTC."""
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)
