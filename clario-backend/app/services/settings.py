"""Settings service — Supabase primary, SQLite fallback."""
from __future__ import annotations
import time
from datetime import datetime, timezone
from loguru import logger

_DEFAULTS = {
    "name": "",
    "daily_reminder": True,
    "streak_notifications": True,
    "weekly_digest": False,
    "reminder_time": "08:00",
}

_BOOL_COLS = ("daily_reminder", "streak_notifications", "weekly_digest")

# Supabase table availability flag — same TTL pattern as subscriptions.py
_supa_ok: bool | None = None
_supa_fail_ts: float = 0.0
_RETRY_AFTER = 60.0


# ── Supabase ──────────────────────────────────────────────────────────────────

def _sb():
    from app.core.supabase import get_supabase_client
    return get_supabase_client()


def _supa_available() -> bool:
    global _supa_ok, _supa_fail_ts
    if _sb() is None:
        return False
    if _supa_ok is False:
        if time.monotonic() - _supa_fail_ts > _RETRY_AFTER:
            _supa_ok = None
        else:
            return False
    return True


def _mark_fail(e: Exception) -> None:
    global _supa_ok, _supa_fail_ts
    err = str(e)
    if "does not exist" in err or "PGRST205" in err or "schema cache" in err:
        if _supa_ok is not False:
            logger.warning("Supabase 'user_settings' table missing — run SUPABASE_MIGRATION.sql. Falling back to SQLite.")
        _supa_ok = False
        _supa_fail_ts = time.monotonic()
    else:
        logger.error("Supabase settings error: {}", e)


def _coerce(row: dict) -> dict:
    """Normalise Supabase row — booleans come back as Python bools already."""
    return {k: bool(row[k]) if k in _BOOL_COLS and k in row else row.get(k) for k in row}


def _supa_get(user_id: str) -> dict | None:
    global _supa_ok
    try:
        res = _sb().table("user_settings").select("*").eq("user_id", user_id).maybe_single().execute()
        _supa_ok = True
        return _coerce(res.data) if res.data else None
    except Exception as e:
        _mark_fail(e)
        return None


def _supa_upsert(user_id: str, payload: dict) -> None:
    global _supa_ok
    try:
        _sb().table("user_settings").upsert({"user_id": user_id, **payload}, on_conflict="user_id").execute()
        _supa_ok = True
    except Exception as e:
        _mark_fail(e)


# ── SQLite fallback ───────────────────────────────────────────────────────────

def _row_to_dict(row) -> dict:
    d = dict(row)
    for key in _BOOL_COLS:
        if key in d:
            d[key] = bool(d[key])
    return d


def _sqlite_get(user_id: str) -> dict | None:
    from app.core.database import get_conn
    row = get_conn().execute(
        "SELECT * FROM user_settings WHERE user_id = ?", (user_id,)
    ).fetchone()
    return _row_to_dict(row) if row else None


def _sqlite_create(user_id: str) -> dict | None:
    updated_at = datetime.now(timezone.utc).isoformat()
    try:
        conn = get_conn()
        from app.core.database import get_conn
        conn = get_conn()
        conn.execute(
            """INSERT INTO user_settings
               (user_id, name, daily_reminder, streak_notifications, weekly_digest, reminder_time, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                _DEFAULTS["name"],
                int(_DEFAULTS["daily_reminder"]),
                int(_DEFAULTS["streak_notifications"]),
                int(_DEFAULTS["weekly_digest"]),
                _DEFAULTS["reminder_time"],
                updated_at,
            ),
        )
        conn.commit()
        return _sqlite_get(user_id)
    except Exception:
        return _sqlite_get(user_id)


def _sqlite_update(user_id: str, updates: dict) -> dict | None:
    from app.core.database import get_conn
    for key in _BOOL_COLS:
        if key in updates:
            updates[key] = int(bool(updates[key]))
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [user_id]
    try:
        conn = get_conn()
        conn.execute(f"UPDATE user_settings SET {set_clause} WHERE user_id = ?", values)
        conn.commit()
        return _sqlite_get(user_id)
    except Exception as e:
        logger.warning("SQLite update_settings error: {}", e)
        return None


# ── Public API ────────────────────────────────────────────────────────────────

def get_settings(user_id: str) -> dict | None:
    if _supa_available():
        result = _supa_get(user_id)
        if _supa_ok:
            return result
    return _sqlite_get(user_id)


def create_defaults(user_id: str) -> dict | None:
    defaults = {
        "name": _DEFAULTS["name"],
        "daily_reminder": _DEFAULTS["daily_reminder"],
        "streak_notifications": _DEFAULTS["streak_notifications"],
        "weekly_digest": _DEFAULTS["weekly_digest"],
        "reminder_time": _DEFAULTS["reminder_time"],
    }
    if _supa_available():
        _supa_upsert(user_id, defaults)
        if _supa_ok:
            return _supa_get(user_id) or defaults
    return _sqlite_create(user_id)


def get_or_create(user_id: str) -> dict | None:
    row = get_settings(user_id)
    return row if row is not None else create_defaults(user_id)


def update_settings(user_id: str, updates: dict) -> dict | None:
    allowed = {"name", "daily_reminder", "streak_notifications", "weekly_digest", "reminder_time"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return get_settings(user_id)

    if _supa_available():
        _supa_upsert(user_id, filtered)
        if _supa_ok:
            return _supa_get(user_id)

    return _sqlite_update(user_id, filtered)
