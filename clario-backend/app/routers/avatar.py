"""
Avatar upload endpoint.
- Signed Cloudinary upload (API secret stays server-side)
- Auto-deletes previous avatar from Cloudinary when a new one is uploaded
- Uses app.core.config.settings (pydantic_settings) so Render env vars are read correctly
"""

import hashlib
import time
import httpx

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.config import settings

avatar_router = APIRouter(prefix="/avatar", tags=["Avatar"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _sign(params: dict) -> str:
    """SHA-1 signature over sorted key=value pairs + API secret."""
    sorted_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    return hashlib.sha1(f"{sorted_str}{settings.CLOUDINARY_API_SECRET}".encode()).hexdigest()


def _upload_params(public_id: str, folder: str, eager: str, timestamp: int) -> dict:
    p = {"eager": eager, "folder": folder, "public_id": public_id, "timestamp": str(timestamp)}
    return {**p, "api_key": settings.CLOUDINARY_API_KEY, "signature": _sign(p)}


def _delete_params(public_id: str, timestamp: int) -> dict:
    p = {"public_id": public_id, "timestamp": str(timestamp)}
    return {**p, "api_key": settings.CLOUDINARY_API_KEY, "signature": _sign(p)}


# ── routes ────────────────────────────────────────────────────────────────────

@avatar_router.get("/config-check")
def config_check():
    """Debug: confirms whether Cloudinary env vars are loaded (no secrets exposed)."""
    return {
        "CLOUDINARY_CLOUD_NAME":  bool(settings.CLOUDINARY_CLOUD_NAME),
        "CLOUDINARY_API_KEY":     bool(settings.CLOUDINARY_API_KEY),
        "CLOUDINARY_API_SECRET":  bool(settings.CLOUDINARY_API_SECRET),
        "cloud_name":             settings.CLOUDINARY_CLOUD_NAME or "NOT SET",
    }


class AvatarUploadResponse(BaseModel):
    secure_url: str
    public_id:  str


@avatar_router.post("/upload", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured on this server.",
        )

    # Reject oversized uploads by Content-Length before buffering the body.
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be under 10 MB.")

    # Only accept real image uploads (no arbitrary file hosting).
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, WEBP or GIF images are allowed.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be under 10 MB.")

    user_id   = current_user.get("id") or current_user.get("sub", "unknown")
    timestamp = int(time.time())
    public_id = f"user_{user_id}"
    folder    = "avatars"
    eager     = "c_fill,g_face,w_200,h_200,f_auto,q_auto"
    base_url  = f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/image"

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Upload new image
        upload_resp = await client.post(
            f"{base_url}/upload",
            data=_upload_params(public_id, folder, eager, timestamp),
            files={"file": (file.filename or "avatar.jpg", image_bytes, file.content_type or "image/jpeg")},
        )
        if upload_resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Cloudinary upload failed: {upload_resp.text[:300]}")

        # 2. Delete the caller's previous avatar (public_id is derived from the
        #    authenticated user, never trusted from the client). Best-effort:
        #    errors are ignored — the upload already succeeded.
        prev = f"user_{user_id}"
        del_ts = int(time.time())
        await client.post(
            f"{base_url}/destroy",
            data=_delete_params(prev, del_ts),
        )

    data = upload_resp.json()
    return AvatarUploadResponse(
        secure_url=data["secure_url"],
        public_id=data["public_id"],
    )
