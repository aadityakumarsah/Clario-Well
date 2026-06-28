"""Voice session rows — SQLite."""
import json
import uuid
from datetime import date, datetime, time, timedelta, timezone

from loguru import logger

from app.core.database import get_conn

TABLE = "voice_sessions"


def create_session(user_id: str) -> dict | None:
    session_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        conn = get_conn()
        conn.execute(
            "INSERT INTO voice_sessions (session_id, user_id, created_at) VALUES (?, ?, ?)",
            (session_id, user_id, created_at),
        )
        conn.commit()
        return {"session_id": session_id, "user_id": user_id, "created_at": created_at}
    except Exception as e:
        logger.warning("create_session error: {}", e)
        return None


def get_session_for_user(session_id: str, user_id: str) -> dict | None:
    row = get_conn().execute(
        "SELECT * FROM voice_sessions WHERE session_id = ? AND user_id = ?",
        (session_id, user_id),
    ).fetchone()
    if not row:
        return None
    d = dict(row)
    if d.get("call_report") and isinstance(d["call_report"], str):
        try:
            d["call_report"] = json.loads(d["call_report"])
        except Exception:
            pass
    return d


def list_sessions_for_user(
    user_id: str,
    *,
    session_date: date | None = None,
    tz_offset_minutes: int = 0,
) -> list[dict] | None:
    try:
        conn = get_conn()
        if session_date is not None:
            local_tz = timezone(timedelta(minutes=-tz_offset_minutes))
            local_start = datetime.combine(session_date, time.min, tzinfo=local_tz)
            local_end = local_start + timedelta(days=1)
            utc_start = local_start.astimezone(timezone.utc).isoformat()
            utc_end = local_end.astimezone(timezone.utc).isoformat()
            rows = conn.execute(
                "SELECT * FROM voice_sessions WHERE user_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at DESC",
                (user_id, utc_start, utc_end),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM voice_sessions WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()

        result = []
        for row in rows:
            d = dict(row)
            if d.get("call_report") and isinstance(d["call_report"], str):
                try:
                    d["call_report"] = json.loads(d["call_report"])
                except Exception:
                    pass
            result.append(d)
        return result
    except Exception as e:
        logger.warning("list_sessions_for_user error: {}", e)
        return None


def end_session(session_id: str, user_id: str, duration_seconds: int) -> bool:
    if not get_session_for_user(session_id, user_id):
        logger.warning("end_session: session not found | session_id={}", session_id)
        return False
    ended_at = datetime.now(timezone.utc).isoformat()
    try:
        conn = get_conn()
        conn.execute(
            "UPDATE voice_sessions SET ended_at = ?, duration_seconds = ? WHERE session_id = ? AND user_id = ?",
            (ended_at, max(0, int(duration_seconds)), session_id, user_id),
        )
        conn.commit()
        return True
    except Exception as e:
        logger.warning("end_session error: {}", e)
        return False


def save_call_report(session_id: str, user_id: str, report: dict) -> bool:
    if not get_session_for_user(session_id, user_id):
        logger.warning("save_call_report: session not found | session_id={}", session_id)
        return False
    try:
        conn = get_conn()
        conn.execute(
            "UPDATE voice_sessions SET call_report = ? WHERE session_id = ? AND user_id = ?",
            (json.dumps(report), session_id, user_id),
        )
        conn.commit()
        return True
    except Exception as e:
        logger.warning("save_call_report error: {}", e)
        return False


def delete_session(session_id: str, user_id: str) -> bool:
    """Delete a session and its conversation history for the given user."""
    if not get_session_for_user(session_id, user_id):
        logger.warning("delete_session: not found | session_id={}", session_id)
        return False
    try:
        conn = get_conn()
        # SQLite schema has no FK cascade — delete child rows first
        conn.execute(
            "DELETE FROM conversation_history WHERE session_id = ? AND user_id = ?",
            (session_id, user_id),
        )
        conn.execute(
            "DELETE FROM voice_sessions WHERE session_id = ? AND user_id = ?",
            (session_id, user_id),
        )
        conn.commit()
        logger.info("delete_session: removed session_id={}", session_id)
        return True
    except Exception as e:
        logger.warning("delete_session error: {}", e)
        return False


def cleanup_sessions_older_than(days: int = 10) -> int:
    """Delete all sessions (and their conversation history) created more than `days` ago.

    Called once at startup so old data is pruned without needing a separate cron job.
    Returns the number of sessions removed.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    try:
        conn = get_conn()
        old_rows = conn.execute(
            "SELECT session_id FROM voice_sessions WHERE created_at < ?",
            (cutoff,),
        ).fetchall()
        if not old_rows:
            return 0
        ids = [r["session_id"] for r in old_rows]
        placeholders = ",".join("?" * len(ids))
        conn.execute(
            f"DELETE FROM conversation_history WHERE session_id IN ({placeholders})", ids
        )
        conn.execute(
            f"DELETE FROM voice_sessions WHERE session_id IN ({placeholders})", ids
        )
        conn.commit()
        logger.info(
            "cleanup_sessions_older_than({}d): removed {} sessions (cutoff={})",
            days, len(ids), cutoff,
        )
        return len(ids)
    except Exception as e:
        logger.warning("cleanup_sessions_older_than error: {}", e)
        return 0
