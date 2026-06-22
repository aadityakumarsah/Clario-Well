"""Stripe payment routes — checkout, webhook, subscription status."""
import os
import time
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from loguru import logger
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.db.subscriptions import get_subscription, upsert_subscription

payments_router = APIRouter(prefix="/payments", tags=["Payments"])

def _price_ids() -> dict[str, str]:
    """Read at call time so load_dotenv() has already populated os.environ."""
    return {
        "weekly": os.getenv("STRIPE_PRICE_WEEKLY", ""),
        "monthly": os.getenv("STRIPE_PRICE_MONTHLY", ""),
        "yearly": os.getenv("STRIPE_PRICE_YEARLY", ""),
    }


def _stripe_client() -> stripe.StripeClient:
    secret_key = os.getenv("STRIPE_SECRET_KEY", "")
    if not secret_key:
        raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY not configured")
    return stripe.StripeClient(secret_key)


# ── Schemas ───────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str  # "weekly" | "monthly" | "yearly"
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    url: str


class SubscriptionStatusResponse(BaseModel):
    active: bool
    plan: str | None
    expires_at: str | None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@payments_router.post("/create-checkout-session", response_model=CheckoutResponse)
def create_checkout_session(
    body: CheckoutRequest,
    user: dict = Depends(get_current_user),
):
    price_ids = _price_ids()
    if body.plan not in price_ids:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    price_id = price_ids[body.plan]
    if not price_id:
        raise HTTPException(
            status_code=500,
            detail=f"STRIPE_PRICE_{body.plan.upper()} env var not set",
        )

    # Reject unauthenticated (guest) users — they have no real email for Stripe
    user_email = user.get("email", "")
    if user.get("id") == "guest" or not user_email or user_email == "guest@local":
        raise HTTPException(status_code=401, detail="Sign in to start a subscription")

    client = _stripe_client()
    user_id = user["id"]

    # Check if this user already has a Stripe customer ID
    existing = get_subscription(user_id)
    customer_id = existing.get("stripe_customer_id") if existing else None

    # Append Stripe's session_id template so the success page can call /payments/sync
    success_url = body.success_url
    sep = "&" if "?" in success_url else "?"
    success_url = f"{success_url}{sep}session_id={{CHECKOUT_SESSION_ID}}"

    session_params: dict = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success_url,
        "cancel_url": body.cancel_url,
        "metadata": {"user_id": user_id},
        "subscription_data": {"metadata": {"user_id": user_id}},
    }
    if customer_id:
        session_params["customer"] = customer_id
    else:
        session_params["customer_email"] = user_email

    try:
        session = client.v1.checkout.sessions.create(params=session_params)
    except stripe.StripeError as e:
        logger.error("Stripe error creating checkout session: {}", e)
        raise HTTPException(status_code=502, detail=str(e))

    return CheckoutResponse(url=session.url)


@payments_router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    """Stripe sends events here — NOT protected by JWT."""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    payload = await request.body()

    if webhook_secret and stripe_signature:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, webhook_secret
            )
        except stripe.SignatureVerificationError as e:
            logger.warning("Stripe webhook signature verification failed: {}", e)
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Accept unsigned in dev if no secret configured (log a warning)
        logger.warning("STRIPE_WEBHOOK_SECRET not set — skipping signature check")
        import json
        event = json.loads(payload)

    event_type = event["type"] if isinstance(event, dict) else event.type
    data_obj = event["data"]["object"] if isinstance(event, dict) else event.data.object

    logger.info("Stripe webhook event: {}", event_type)

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data_obj)
    elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
        _handle_subscription_change(data_obj)

    return {"received": True}


def _handle_checkout_completed(session: dict) -> None:
    user_id = session.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("checkout.session.completed missing user_id in metadata")
        return

    customer_id = session.get("customer")
    subscription_id = session.get("subscription")

    # Fetch subscription details to get period end and plan
    plan = None
    current_period_end = None
    status = "active"

    if subscription_id:
        secret_key = os.getenv("STRIPE_SECRET_KEY", "")
        if secret_key:
            try:
                client = stripe.StripeClient(secret_key)
                sub = client.v1.subscriptions.retrieve(subscription_id)
                status = sub.status
                current_period_end = sub.current_period_end
                # Derive plan from price metadata or interval
                if sub.items and sub.items.data:
                    price = sub.items.data[0].price
                    interval = price.recurring.interval if price.recurring else None
                    if interval == "week":
                        plan = "weekly"
                    elif interval == "month":
                        plan = "monthly"
                    elif interval == "year":
                        plan = "yearly"
            except Exception as e:
                logger.error("Failed to retrieve subscription {}: {}", subscription_id, e)

    upsert_subscription(
        user_id=user_id,
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
        plan=plan,
        status=status,
        current_period_end=current_period_end,
    )
    logger.info("Subscription activated for user {}: plan={}", user_id, plan)


def _handle_subscription_change(subscription: dict) -> None:
    """Handle subscription updates/cancellations."""
    user_id = None
    if isinstance(subscription, dict):
        user_id = subscription.get("metadata", {}).get("user_id")
        sub_id = subscription.get("id")
        status = subscription.get("status")
        current_period_end = subscription.get("current_period_end")
    else:
        user_id = subscription.metadata.get("user_id") if subscription.metadata else None
        sub_id = subscription.id
        status = subscription.status
        current_period_end = subscription.current_period_end

    if not user_id:
        # Try to find user by subscription ID
        logger.warning("subscription event missing user_id in metadata, sub_id={}", sub_id)
        return

    upsert_subscription(
        user_id=user_id,
        stripe_subscription_id=sub_id,
        status=status,
        current_period_end=current_period_end,
    )
    logger.info("Subscription updated for user {}: status={}", user_id, status)


@payments_router.get("/status", response_model=SubscriptionStatusResponse)
def get_subscription_status(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    row = get_subscription(user_id)

    if not row:
        return SubscriptionStatusResponse(active=False, plan=None, expires_at=None)

    status = row.get("status", "")
    current_period_end = row.get("current_period_end")
    now_ts = int(time.time())

    # Active if status is active/trialing AND period hasn't ended
    is_active = status in ("active", "trialing") and (
        current_period_end is None or current_period_end > now_ts
    )

    expires_at = None
    if current_period_end:
        expires_at = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()

    return SubscriptionStatusResponse(
        active=is_active,
        plan=row.get("plan") if is_active else None,
        expires_at=expires_at,
    )


@payments_router.post("/sync")
def sync_subscription_from_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Called from the success page to save the subscription immediately.
    Fallback for when the Stripe webhook hasn't been configured yet.
    """
    if user.get("id") == "guest":
        raise HTTPException(status_code=401, detail="Sign in to sync subscription")

    client = _stripe_client()
    try:
        session = client.v1.checkout.sessions.retrieve(session_id)
    except stripe.StripeError as e:
        logger.error("Failed to retrieve checkout session {}: {}", session_id, e)
        raise HTTPException(status_code=502, detail=str(e))

    # Verify this session belongs to the logged-in user
    session_obj = session if isinstance(session, dict) else session.__dict__
    meta_user_id = (session_obj.get("metadata") or {}).get("user_id", "")
    if meta_user_id and meta_user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Session does not belong to this user")

    _handle_checkout_completed(session_obj)
    return {"synced": True}
