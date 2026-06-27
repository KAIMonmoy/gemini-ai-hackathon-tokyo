"""Firebase ID-token verification as a FastAPI dependency.

Uses Application Default Credentials (gcloud ADC locally; the Cloud Run service
account in production). The frontend sends `Authorization: Bearer <idToken>`.
"""

from __future__ import annotations

import logging
import os

import firebase_admin
from fastapi import Header, HTTPException, status
from firebase_admin import auth as fb_auth

import sourcing_sentinel.config  # noqa: F401  (ensures .env is loaded)

logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "tokyo-gemini-ai-hackathon")


def _ensure_init() -> None:
    """Initialize the Admin SDK lazily (idempotent) on first verification."""
    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={"projectId": PROJECT_ID})


async def current_uid(authorization: str = Header(default="")) -> str:
    """Verify the bearer ID token and return the caller's Firebase uid."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    _ensure_init()
    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = fb_auth.verify_id_token(token)
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ID token"
        ) from exc
    return decoded["uid"]
