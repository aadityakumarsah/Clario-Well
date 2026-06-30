"""Dodo Payments routes — checkout, webhook, subscription status."""
import base64
import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from loguru import logger
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.db.subscriptions import get_subscription, upsert_subscription

payments_router = APIRouter(prefix="/payments", tags=["Payments"])

_DODO_TEST_BASE = "https://test.dodopayments.com"
_DODO_LIVE_BASE = "https://live.dodopayments.com"


def _dodo_base() -> str:
    return _DODO_LIVE_BASE if os.getenv("DODO_LIVE", "").lower() == "true" else _DODO_TEST_BASE


def _dodo_headers() -> dict:
    api_key = os.getenv("DODO_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="DODO_API_KEY not configured")
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def _product_ids() -> dict[str, str]:
    return {
        "weekly":  os.getenv("DODO_PRODUCT_WEEKLY",  "pdt_0NiAXvN7vcS31vtjnOlZx"),
        "monthly": os.getenv("DODO_PRODUCT_MONTHLY", "pdt_0NiAY0OPAdfxMC6MY7yoU"),
        "yearly":  os.getenv("DODO_PRODUCT_YEARLY",  "pdt_0NiAY68nBNPhmCDwZTWLS"),
    }


# ── Schemas ────────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str          # "weekly" | "monthly" | "yearly"
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    url: str
    session_id: str


class SubscriptionStatusResponse(BaseModel):
    active: bool
    plan: str | None
    expires_at: str | None
    started_at: str | None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _plan_from_product_id(product_id: str) -> str | None:
    for plan, pid in _product_ids().items():
        if pid == product_id:
            return plan
    return None


def _parse_ts(value) -> int | None:
    """Convert ISO datetime string or unix timestamp to int seconds."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return int(dt.timestamp())
    except Exception:
        return None


def _verify_dodo_signature(
    webhook_id: str,
    webhook_timestamp: str,
    payload: bytes,
    signature_header: str,
    secret: str,
) -> bool:
    """Verify Dodo Payments webhook signature (svix / webhooks.fyi standard)."""
    signed_content = f"{webhook_id}.{webhook_timestamp}.{payload.decode()}"

    # Secret may be raw or base64-encoded (some providers prefix with "whsec_")
    try:
        raw_secret = base64.b64decode(secret[6:] if secret.startswith("whsec_") else secret)
    except Exception:
        raw_secret = secret.encode()

    expected = base64.b64encode(
        hmac.new(raw_secret, signed_content.encode(), hashlib.sha256).digest()
    ).decode()

    # Header may contain space-separated "v1,<base64sig>" tokens
    sigs = [s.split(",", 1)[-1] if "," in s else s for s in signature_header.split()]
    return any(hmac.compare_digest(expected, sig) for sig in sigs)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@payments_router.post("/create-checkout-session", response_model=CheckoutResponse)
def create_checkout_session(
    body: CheckoutRequest,
    user: dict = Depends(get_current_user),
):
    product_ids = _product_ids()
    if body.plan not in product_ids:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    user_email = user.get("email", "")
    user_id = user.get("id", "")
    if user_id == "guest" or not user_email or user_email == "guest@local":
        raise HTTPException(status_code=401, detail="Sign in to start a subscription")

    product_id = product_ids[body.plan]
    payload = {
        "product_cart": [{"product_id": product_id, "quantity": 1}],
        "customer": {"email": user_email},
        "return_url": body.success_url,
        "metadata": {"user_id": user_id, "plan": body.plan},
    }

    try:
        resp = httpx.post(
            f"{_dodo_base()}/checkouts",
            headers=_dodo_headers(),
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error("Dodo create checkout error: {} {}", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail=f"Payment provider error: {e.response.text}")
    except httpx.RequestError as e:
        logger.error("Dodo create checkout network error: {}", e)
        raise HTTPException(status_code=502, detail="Could not reach payment provider")

    data = resp.json()
    checkout_url = data.get("checkout_url") or data.get("url", "")
    session_id   = data.get("session_id")   or data.get("id", "")

    if not checkout_url:
        logger.error("Dodo checkout response missing checkout_url: {}", data)
        raise HTTPException(status_code=502, detail="Payment provider returned unexpected response")

    return CheckoutResponse(url=checkout_url, session_id=session_id)


@payments_router.post("/webhook")
async def dodo_webhook(request: Request):
    """Dodo Payments sends events here — NOT protected by JWT."""
    webhook_secret = os.getenv("DODO_WEBHOOK_SECRET", "")
    payload_bytes  = await request.body()

    if webhook_secret:
        wh_id        = request.headers.get("webhook-id", "")
        wh_timestamp = request.headers.get("webhook-timestamp", "")
        wh_signature = request.headers.get("webhook-signature", "")

        if not wh_id or not wh_timestamp or not wh_signature:
            logger.warning("Dodo webhook missing signature headers")
            raise HTTPException(status_code=400, detail="Missing webhook signature headers")

        if not _verify_dodo_signature(wh_id, wh_timestamp, payload_bytes, wh_signature, webhook_secret):
            logger.warning("Dodo webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        logger.warning("DODO_WEBHOOK_SECRET not set — accepting webhook without verification (dev only)")

    try:
        event = json.loads(payload_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("type") or event.get("event_type", "")
    # Dodo wraps the subscription object in "data" or "payload"
    data = event.get("data") or event.get("payload") or {}

    logger.info("Dodo webhook event: {}", event_type)

    if event_type in ("subscription.active", "subscription.created"):
        _handle_subscription_active(data)
    elif event_type in ("subscription.cancelled", "subscription.failed"):
        _handle_subscription_cancelled(data)
    elif event_type == "subscription.renewed":
        _handle_subscription_renewed(data)
    elif event_type == "subscription.on_hold":
        _handle_subscription_on_hold(data)

    return {"received": True}


def _handle_subscription_active(data: dict) -> None:
    sub_id   = data.get("subscription_id") or data.get("id", "")
    metadata = data.get("metadata") or {}
    user_id  = metadata.get("user_id", "")

    if not user_id:
        logger.warning("subscription.active missing user_id in metadata, sub_id={}", sub_id)
        return

    product_id = data.get("product_id", "")
    plan       = _plan_from_product_id(product_id) or metadata.get("plan")
    period_end = _parse_ts(data.get("current_period_end") or data.get("next_billing_date"))
    started_at = _parse_ts(data.get("created_at") or data.get("start_date"))

    upsert_subscription(
        user_id=user_id,
        stripe_subscription_id=sub_id,
        plan=plan,
        status="active",
        current_period_end=period_end,
        started_at=started_at,
    )
    logger.info("Subscription activated for user {}: plan={} sub_id={}", user_id, plan, sub_id)


def _handle_subscription_cancelled(data: dict) -> None:
    sub_id   = data.get("subscription_id") or data.get("id", "")
    metadata = data.get("metadata") or {}
    user_id  = metadata.get("user_id", "")

    if not user_id:
        from app.db.subscriptions import get_subscription_by_stripe_sub_id
        row = get_subscription_by_stripe_sub_id(sub_id)
        if row:
            user_id = row["user_id"]

    if not user_id:
        logger.warning("subscription.cancelled missing user_id, sub_id={}", sub_id)
        return

    upsert_subscription(user_id=user_id, stripe_subscription_id=sub_id, status="cancelled")
    logger.info("Subscription cancelled for user {}", user_id)


def _handle_subscription_renewed(data: dict) -> None:
    sub_id     = data.get("subscription_id") or data.get("id", "")
    period_end = _parse_ts(data.get("current_period_end") or data.get("next_billing_date"))
    metadata   = data.get("metadata") or {}
    user_id    = metadata.get("user_id", "")

    if not user_id:
        from app.db.subscriptions import get_subscription_by_stripe_sub_id
        row = get_subscription_by_stripe_sub_id(sub_id)
        if row:
            user_id = row["user_id"]

    if not user_id:
        logger.warning("subscription.renewed missing user_id, sub_id={}", sub_id)
        return

    upsert_subscription(
        user_id=user_id,
        stripe_subscription_id=sub_id,
        status="active",
        current_period_end=period_end,
    )
    logger.info("Subscription renewed for user {}", user_id)


def _handle_subscription_on_hold(data: dict) -> None:
    sub_id   = data.get("subscription_id") or data.get("id", "")
    metadata = data.get("metadata") or {}
    user_id  = metadata.get("user_id", "")

    if not user_id:
        from app.db.subscriptions import get_subscription_by_stripe_sub_id
        row = get_subscription_by_stripe_sub_id(sub_id)
        if row:
            user_id = row["user_id"]

    if not user_id:
        return

    upsert_subscription(user_id=user_id, stripe_subscription_id=sub_id, status="past_due")
    logger.warning("Subscription on_hold for user {}", user_id)


@payments_router.post("/sync")
def sync_subscription(
    subscription_id: str | None = None,
    session_id: str | None = None,
    user: dict = Depends(get_current_user),
):
    """Called from the success page to force-sync subscription from Dodo.
    Accepts subscription_id (Dodo sub ID) or session_id (legacy / fallback).
    """
    if user.get("id") == "guest":
        raise HTTPException(status_code=401, detail="Sign in to sync subscription")

    user_id = user["id"]
    dodo_id = subscription_id or session_id

    if not dodo_id:
        # No ID provided — check if webhook already activated the subscription
        existing = get_subscription(user_id)
        if existing and existing.get("status") == "active":
            return {"synced": True}
        raise HTTPException(status_code=400, detail="No subscription ID provided")

    # Try fetching from Dodo as subscription ID
    try:
        resp = httpx.get(
            f"{_dodo_base()}/subscriptions/{dodo_id}",
            headers=_dodo_headers(),
            timeout=20,
        )
        if resp.status_code == 200:
            sub      = resp.json()
            metadata = sub.get("metadata") or {}

            meta_user_id = metadata.get("user_id", "")
            if meta_user_id and meta_user_id != user_id:
                raise HTTPException(status_code=403, detail="Subscription does not belong to this user")

            product_id = sub.get("product_id", "")
            plan       = _plan_from_product_id(product_id) or metadata.get("plan")
            status_raw = sub.get("status", "active")
            status     = "active" if status_raw in ("active", "trialing", "paid") else status_raw
            period_end = _parse_ts(sub.get("current_period_end") or sub.get("next_billing_date"))
            started_at = _parse_ts(sub.get("created_at") or sub.get("start_date"))

            upsert_subscription(
                user_id=user_id,
                stripe_subscription_id=dodo_id,
                plan=plan,
                status=status,
                current_period_end=period_end,
                started_at=started_at,
            )
            return {"synced": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Dodo sync error for id {}: {}", dodo_id, e)

    # Lookup failed — webhook may have already handled it
    existing = get_subscription(user_id)
    if existing and existing.get("status") == "active":
        return {"synced": True}

    raise HTTPException(status_code=404, detail="Subscription not found — payment may still be processing")


@payments_router.get("/status", response_model=SubscriptionStatusResponse)
def get_subscription_status(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    row     = get_subscription(user_id)

    if not row:
        return SubscriptionStatusResponse(active=False, plan=None, expires_at=None, started_at=None)

    status           = row.get("status", "")
    current_period_end = row.get("current_period_end")
    now_ts           = int(time.time())

    is_active = status in ("active", "trialing") and (
        current_period_end is None or current_period_end > now_ts
    )

    expires_at = None
    if current_period_end:
        expires_at = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()

    started_at_raw = row.get("started_at") or row.get("created_at")
    started_at     = None
    if started_at_raw:
        if isinstance(started_at_raw, (int, float)):
            started_at = datetime.fromtimestamp(started_at_raw, tz=timezone.utc).isoformat()
        else:
            started_at = str(started_at_raw)

    return SubscriptionStatusResponse(
        active=is_active,
        plan=row.get("plan") if is_active else None,
        expires_at=expires_at,
        started_at=started_at if is_active else None,
    )


@payments_router.get("/checkout-return")
def checkout_return(
    subscription_id: str | None = None,
    payment_status: str | None = None,
    session_id: str | None = None,
):
    """Dodo redirects here after checkout. Returns HTML that deep-links into the mobile app."""
    ref_id    = subscription_id or session_id or ""
    deep_link = f"clariomobile://paywall/success?subscription_id={ref_id}"
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting to Clario…</title>
  <style>
    body {{ font-family: -apple-system, sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh; margin: 0;
           background: #FAF7F2; color: #3A2E2A; text-align: center; padding: 24px; box-sizing: border-box; }}
    h1 {{ font-size: 22px; margin-bottom: 8px; }}
    p  {{ font-size: 14px; color: #6B5E57; margin-bottom: 32px; }}
    a  {{ background: #3A2E2A; color: #FAF7F2; text-decoration: none;
          padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 600; }}
  </style>
</head>
<body>
  <h1>Payment successful!</h1>
  <p>Opening Clario…</p>
  <a href="{deep_link}">Open Clario</a>
  <script>window.location.href = "{deep_link}";</script>
</body>
</html>"""
    return HTMLResponse(content=html)


@payments_router.get("/checkout-cancel")
def checkout_cancel():
    """Dodo redirects here on cancel — shows a page that bounces back to paywall."""
    html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment cancelled</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh; margin: 0;
           background: #FAF7F2; color: #3A2E2A; text-align: center; padding: 24px; box-sizing: border-box; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p  { font-size: 14px; color: #6B5E57; margin-bottom: 32px; }
    a  { background: #3A2E2A; color: #FAF7F2; text-decoration: none;
          padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Payment cancelled</h1>
  <p>No charge was made. Tap below to return to the app.</p>
  <a href="clariomobile://paywall">Return to Clario</a>
  <script>window.location.href = "clariomobile://paywall";</script>
</body>
</html>"""
    return HTMLResponse(content=html)
