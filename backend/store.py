"""Firestore access for the backend, against the NAMED database `sourcingsentinel`
(asia-northeast1) — NOT the auto-created `(default)` db. Mirrors the frontend model:

    users/{uid}            -> profile (company info + watch-list `items`)
    users/{uid}/runs/{id}  -> Brief (one analysis result)
"""

from __future__ import annotations

import logging
import os

from google.cloud import firestore

logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "tokyo-gemini-ai-hackathon")
DATABASE_ID = os.getenv("FIRESTORE_DATABASE_ID", "sourcingsentinel")

_db: firestore.Client | None = None


def _client() -> firestore.Client:
    """Lazily construct the Firestore client (avoids import-time credential
    resolution, which can hang/fail before request time)."""
    global _db
    if _db is None:
        _db = firestore.Client(project=PROJECT_ID, database=DATABASE_ID)
    return _db


def load_watch_list(uid: str) -> dict:
    """Read the user's profile doc and return a watch_list {items, currency_home}."""
    snap = _client().collection("users").document(uid).get()
    profile = snap.to_dict() if snap.exists else {}
    return {
        "items": profile.get("items", []),
        "currency_home": profile.get("currency_home", "JPY"),
    }


def save_run(uid: str, brief: dict) -> str:
    """Persist a Brief under users/{uid}/runs and return the new doc id."""
    payload = {**brief, "created_at": firestore.SERVER_TIMESTAMP}
    ref = _client().collection("users").document(uid).collection("runs").add(payload)
    # add() returns (timestamp, DocumentReference)
    return ref[1].id
