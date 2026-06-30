# ─── Subscription storage ─────────────────────────────────────────────────────
# Primary:  Supabase `subscriptions` table (when SUPABASE_URL is set)
# Fallback: SQLite (local dev without Supabase)
#
# Supabase table schema — run SUPABASE_MIGRATION.sql in your Supabase SQL editor.

from __future__ import annotations
import time
from loguru import logger

# Track whether the Supabase subscriptions table is confirmed to exist.
# _supa_table_ok: True = ok, False = missing (with timestamp to auto-reset after 60s)
_supa_table_ok: bool | None = None
_supa_table_fail_ts: float = 0.0
_SUPA_RETRY_AFTER = 60.0  # seconds before retrying after a table-missing error


# ── Supabase path ─────────────────────────────────────────────────────────────

def _supa():
    from app.core.supabase import get_supabase_client
    return get_supabase_client()


def _supa_available() -> bool:
    """Return True only if Supabase is configured AND the subscriptions table is reachable."""
    global _supa_table_ok, _supa_table_fail_ts
    if _supa() is None:
        return False
    if _supa_table_ok is False:
        # Auto-reset after the retry window so transient errors don't permanently disable Supabase
        if time.monotonic() - _supa_table_fail_ts > _SUPA_RETRY_AFTER:
            _supa_table_ok = None
        else:
            return False
    return True


def _supa_get(user_id: str) -> dict | None:
    global _supa_table_ok, _supa_table_fail_ts
    if not user_id or user_id == "guest":
        return None
    try:
        res = _supa().table("subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()
        _supa_table_ok = True
        return res.data if res is not None else None
    except Exception as e:
        err = str(e)
        if "PGRST205" in err or "schema cache" in err or "does not exist" in err:
            if _supa_table_ok is not False:
                logger.warning("Supabase 'subscriptions' table missing — run SUPABASE_MIGRATION.sql. Falling back to SQLite.")
            _supa_table_ok = False
            _supa_table_fail_ts = time.monotonic()
        else:
            logger.error("Supabase get_subscription error: {}", e)
        return None


def _supa_upsert(user_id: str, **fields) -> None:
    global _supa_table_ok, _supa_table_fail_ts
    try:
        payload = {"user_id": user_id, **{k: v for k, v in fields.items() if v is not None}}
        _supa().table("subscriptions").upsert(payload, on_conflict="user_id").execute()
        _supa_table_ok = True
    except Exception as e:
        err = str(e)
        if "PGRST205" in err or "schema cache" in err or "does not exist" in err:
            if _supa_table_ok is not False:
                logger.warning("Supabase 'subscriptions' table missing — run SUPABASE_MIGRATION.sql. Falling back to SQLite.")
            _supa_table_ok = False
            _supa_table_fail_ts = time.monotonic()
        else:
            logger.error("Supabase upsert_subscription error: {}", e)


def _supa_get_by_stripe_sub_id(stripe_subscription_id: str) -> dict | None:
    global _supa_table_ok, _supa_table_fail_ts
    try:
        res = (
            _supa()
            .table("subscriptions")
            .select("*")
            .eq("stripe_subscription_id", stripe_subscription_id)
            .maybe_single()
            .execute()
        )
        _supa_table_ok = True
        return res.data if res is not None else None
    except Exception as e:
        logger.error("Supabase get_subscription_by_stripe_sub_id error: {}", e)
        return None


# ── SQLite fallback path ───────────────────────────────────────────────────────

def _sqlite_init() -> None:
    from app.core.database import get_conn
    get_conn().executescript("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            user_id TEXT PRIMARY KEY,
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            plan TEXT,
            status TEXT,
            current_period_end INTEGER,
            started_at INTEGER
        );
    """)
    get_conn().commit()


def _sqlite_get(user_id: str) -> dict | None:
    from app.core.database import get_conn
    row = get_conn().execute(
        "SELECT * FROM subscriptions WHERE user_id = ?", (user_id,)
    ).fetchone()
    return dict(row) if row else None


def _sqlite_get_by_stripe_sub_id(stripe_subscription_id: str) -> dict | None:
    from app.core.database import get_conn
    row = get_conn().execute(
        "SELECT * FROM subscriptions WHERE stripe_subscription_id = ?", (stripe_subscription_id,)
    ).fetchone()
    return dict(row) if row else None


def _sqlite_upsert(user_id: str, **fields) -> None:
    from app.core.database import get_conn
    conn = get_conn()
    existing = conn.execute(
        "SELECT 1 FROM subscriptions WHERE user_id = ?", (user_id,)
    ).fetchone()
    if existing:
        sets, vals = [], []
        for k, v in fields.items():
            # Don't overwrite started_at once set
            if k == "started_at":
                continue
            if v is not None:
                sets.append(f"{k} = ?")
                vals.append(v)
        if sets:
            conn.execute(f"UPDATE subscriptions SET {', '.join(sets)} WHERE user_id = ?", [*vals, user_id])
    else:
        cols = ["user_id"] + [k for k, v in fields.items() if v is not None]
        vals = [user_id] + [v for v in fields.values() if v is not None]
        placeholders = ", ".join(["?"] * len(vals))
        conn.execute(f"INSERT INTO subscriptions ({', '.join(cols)}) VALUES ({placeholders})", vals)
    conn.commit()


# ── Public API ────────────────────────────────────────────────────────────────

def init_subscriptions_table() -> None:
    """Always initialise the SQLite table so the Supabase fallback never crashes."""
    _sqlite_init()


def get_subscription(user_id: str) -> dict | None:
    if _supa_available():
        result = _supa_get(user_id)
        if _supa_table_ok:
            return result
    return _sqlite_get(user_id)


def get_subscription_by_stripe_sub_id(stripe_subscription_id: str) -> dict | None:
    if _supa_available():
        result = _supa_get_by_stripe_sub_id(stripe_subscription_id)
        if _supa_table_ok:
            return result
    return _sqlite_get_by_stripe_sub_id(stripe_subscription_id)


def upsert_subscription(
    user_id: str,
    stripe_customer_id: str | None = None,
    stripe_subscription_id: str | None = None,
    plan: str | None = None,
    status: str | None = None,
    current_period_end: int | None = None,
    started_at: int | None = None,
) -> None:
    fields = dict(
        stripe_customer_id=stripe_customer_id,
        stripe_subscription_id=stripe_subscription_id,
        plan=plan,
        status=status,
        current_period_end=current_period_end,
        started_at=started_at,
    )
    if _supa_available():
        # For Supabase: don't overwrite started_at if the row already has one
        supa_fields = {k: v for k, v in fields.items() if v is not None}
        existing = _supa_get(user_id)
        if existing and existing.get("started_at"):
            supa_fields.pop("started_at", None)
        _supa_upsert(user_id, **supa_fields)
        if _supa_table_ok:
            return
    _sqlite_upsert(user_id, **fields)
