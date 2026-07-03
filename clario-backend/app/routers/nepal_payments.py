"""Nepal payment gateway routes — Khalti (live) + eSewa."""
import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.db.subscriptions import upsert_subscription

nepal_payments_router = APIRouter(prefix="/nepal-payments", tags=["Nepal Payments"])

# ── Khalti API ─────────────────────────────────────────────────────────────────
_KHALTI_INITIATE_URL = "https://a.khalti.com/api/v2/epayment/initiate/"
_KHALTI_LOOKUP_URL   = "https://a.khalti.com/api/v2/epayment/lookup/"

# NPR amounts in paisa (1 NPR = 100 paisa)
_PLAN_PRICES_PAISA: dict[str, int] = {
    "weekly":  39900,    # Rs. 399
    "monthly": 129900,   # Rs. 1,299
    "yearly":  2499900,  # Rs. 24,999
}

_PLAN_LABELS: dict[str, str] = {
    "weekly":  "Clario Weekly",
    "monthly": "Clario Monthly",
    "yearly":  "Clario Yearly",
}


def _khalti_secret() -> str:
    key = os.getenv("KHALTI_LIVE_SECRET_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="KHALTI_LIVE_SECRET_KEY not configured")
    return key


def _khalti_headers() -> dict:
    return {
        "Authorization": f"Key {_khalti_secret()}",
        "Content-Type": "application/json",
    }


# ── Schemas ────────────────────────────────────────────────────────────────────

class NepalInitiateRequest(BaseModel):
    plan: str        # "weekly" | "monthly" | "yearly"
    gateway: str     # "khalti" | "esewa"
    success_url: str
    failure_url: str


class NepalInitiateResponse(BaseModel):
    gateway: str
    action_url: str
    fields: dict | None = None
    transaction_uuid: str


class NepalVerifyRequest(BaseModel):
    gateway: str
    plan: str
    transaction_uuid: str
    esewa_data: str | None = None
    khalti_pidx: str | None = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@nepal_payments_router.post("/initiate", response_model=NepalInitiateResponse)
async def initiate_nepal_payment(
    body: NepalInitiateRequest,
    user: dict = Depends(get_current_user),
):
    """Initiate a Khalti or eSewa checkout. Returns redirect info."""
    if user.get("id") == "guest":
        raise HTTPException(status_code=401, detail="Sign in to make a payment")

    if body.plan not in _PLAN_PRICES_PAISA:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    user_id    = user["id"]
    user_email = user.get("email", "")
    txn_uuid   = str(uuid.uuid4())

    # Build return URL with enough context for the success page to verify
    sep = "&" if "?" in body.success_url else "?"
    return_url = (
        f"{body.success_url}{sep}"
        f"gateway={body.gateway}&plan={body.plan}&uuid={txn_uuid}"
    )

    if body.gateway == "khalti":
        return await _initiate_khalti(body.plan, user_id, user_email, txn_uuid, return_url)
    elif body.gateway == "esewa":
        raise HTTPException(status_code=400, detail="eSewa integration coming soon")
    else:
        raise HTTPException(status_code=400, detail=f"Unknown gateway: {body.gateway}")


async def _initiate_khalti(
    plan: str,
    user_id: str,
    user_email: str,
    txn_uuid: str,
    return_url: str,
) -> NepalInitiateResponse:
    amount_paisa = _PLAN_PRICES_PAISA[plan]
    payload = {
        "return_url": return_url,
        "website_url": "https://clario-np.vercel.app",
        "amount": amount_paisa,
        "purchase_order_id": txn_uuid,
        "purchase_order_name": _PLAN_LABELS[plan],
        "customer_info": {
            "name": user_email.split("@")[0],
            "email": user_email,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                _KHALTI_INITIATE_URL,
                headers=_khalti_headers(),
                json=payload,
            )
    except Exception as e:
        logger.error("Khalti initiate network error: {}", e)
        raise HTTPException(status_code=502, detail="Failed to reach Khalti API")

    if resp.status_code != 200:
        logger.error("Khalti initiate failed {}: {}", resp.status_code, resp.text[:300])
        raise HTTPException(
            status_code=502,
            detail=f"Khalti API error ({resp.status_code}): {resp.text[:200]}"
        )

    data = resp.json()
    pidx        = data.get("pidx", "")
    payment_url = data.get("payment_url", "")

    if not payment_url:
        raise HTTPException(status_code=502, detail="Khalti did not return a payment URL")

    logger.info(
        "Khalti checkout initiated for user {} plan={} pidx={} txn={}",
        user_id, plan, pidx, txn_uuid,
    )

    return NepalInitiateResponse(
        gateway="khalti",
        action_url=payment_url,
        fields=None,        # Khalti is a redirect, not a form POST
        transaction_uuid=txn_uuid,
    )


@nepal_payments_router.post("/verify")
async def verify_nepal_payment(
    body: NepalVerifyRequest,
    user: dict = Depends(get_current_user),
):
    """Verify a completed Khalti (or eSewa) payment and activate the subscription."""
    if user.get("id") == "guest":
        raise HTTPException(status_code=401, detail="Sign in to verify payment")

    if body.plan not in _PLAN_PRICES_PAISA:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    user_id = user["id"]

    if body.gateway == "khalti":
        return await _verify_khalti(body, user_id)
    elif body.gateway == "esewa":
        raise HTTPException(status_code=400, detail="eSewa verification coming soon")
    else:
        raise HTTPException(status_code=400, detail=f"Unknown gateway: {body.gateway}")


async def _verify_khalti(body: NepalVerifyRequest, user_id: str) -> dict:
    pidx = body.khalti_pidx
    if not pidx:
        raise HTTPException(status_code=400, detail="khalti_pidx is required for Khalti verification")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                _KHALTI_LOOKUP_URL,
                headers=_khalti_headers(),
                json={"pidx": pidx},
            )
    except Exception as e:
        logger.error("Khalti lookup network error: {}", e)
        raise HTTPException(status_code=502, detail="Failed to reach Khalti API for verification")

    if resp.status_code != 200:
        logger.error("Khalti lookup failed {}: {}", resp.status_code, resp.text[:300])
        raise HTTPException(
            status_code=502,
            detail=f"Khalti verification error ({resp.status_code})"
        )

    data   = resp.json()
    status = data.get("status", "")  # "Completed" | "Pending" | "Refunded" | "Expired" | "User canceled"

    logger.info(
        "Khalti lookup for user {} pidx={} status={} plan={}",
        user_id, pidx, status, body.plan,
    )

    if status != "Completed":
        raise HTTPException(
            status_code=402,
            detail=f"Payment not completed — Khalti status: {status}"
        )

    # Activate subscription
    now_ts = int(datetime.now(tz=timezone.utc).timestamp())

    # Calculate period end based on plan
    period_seconds = {
        "weekly":  7  * 24 * 3600,
        "monthly": 30 * 24 * 3600,
        "yearly":  365 * 24 * 3600,
    }
    period_end = now_ts + period_seconds.get(body.plan, 30 * 24 * 3600)

    # Use pidx as the subscription reference
    upsert_subscription(
        user_id=user_id,
        stripe_subscription_id=f"khalti_{pidx}",
        plan=body.plan,
        status="active",
        current_period_end=period_end,
        started_at=now_ts,
    )

    expires_at = datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat()

    logger.info(
        "Khalti subscription activated for user {} plan={} expires={}",
        user_id, body.plan, expires_at,
    )

    return {
        "verified": True,
        "plan": body.plan,
        "expires_at": expires_at,
    }
