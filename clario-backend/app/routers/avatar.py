"""
Avatar upload endpoint.
Accepts a multipart image from the mobile app, uploads it to Cloudinary
using a SIGNED upload (API secret stays server-side only), and returns the
secure URL + public_id for storage in Supabase user metadata.

Required env vars (set in Render dashboard):
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
"""

import os
import hashlib
import hmac
import time
import httpx

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from app.core.auth import get_current_user

avatar_router = APIRouter(prefix="/avatar", tags=["Avatar"])


def _cloudinary_signed_params(public_id: str, folder: str, eager: str, timestamp: int) -> dict:
    """Build the signed parameter dict for a Cloudinary signed upload."""
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "")
    api_key    = os.getenv("CLOUDINARY_API_KEY", "")

    params = {
        "eager":      eager,
        "folder":     folder,
        "public_id":  public_id,
        "timestamp":  str(timestamp),
    }
    # Signature: alphabetically sorted key=value pairs joined by &, then SHA-1 with secret
    sorted_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    sig = hashlib.sha1(f"{sorted_str}{api_secret}".encode()).hexdigest()

    return {**params, "api_key": api_key, "signature": sig}


class AvatarUploadResponse(BaseModel):
    secure_url: str
    public_id:  str


@avatar_router.post("/upload", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    if not cloud_name or not os.getenv("CLOUDINARY_API_SECRET"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured on this server.",
        )

    user_id   = current_user.get("id") or current_user.get("sub", "unknown")
    timestamp = int(time.time())
    public_id = f"user_{user_id}"
    folder    = "avatars"
    eager     = "c_fill,g_face,w_200,h_200,f_auto,q_auto"

    signed = _cloudinary_signed_params(public_id, folder, eager, timestamp)

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be under 10 MB.")

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            upload_url,
            data=signed,
            files={"file": (file.filename or "avatar.jpg", image_bytes, file.content_type or "image/jpeg")},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Cloudinary upload failed: {response.text[:300]}",
        )

    data = response.json()
    return AvatarUploadResponse(
        secure_url=data["secure_url"],
        public_id=data["public_id"],
    )
