"""SQLite database — single file, no external services required."""
import os
import sqlite3
import threading
from pathlib import Path

DEFAULT_DB_PATH = Path(os.getenv("DB_PATH", "/tmp/clario.db"))
DB_PATH = DEFAULT_DB_PATH

# Warn once at import time when running on an ephemeral path in production —
# every restart wipes all voice sessions/transcripts stored there.
if os.getenv("ENV", "development") == "production" and str(DB_PATH).startswith("/tmp/"):
    import logging
    logging.getLogger(__name__).warning(
        "DB_PATH is the ephemeral default (%s). Voice sessions and transcripts "
        "will be LOST on every restart. Set DB_PATH to a persistent location "
        "or migrate storage to Supabase.", DB_PATH,
    )

_local = threading.local()


def get_conn() -> sqlite3.Connection:
    if not hasattr(_local, "conn"):
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        # Avoid "database is locked" under concurrent gunicorn workers
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA synchronous=NORMAL")
        _local.conn = conn
    return _local.conn


def init_db() -> None:
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS voice_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            ended_at TEXT,
            duration_seconds INTEGER,
            call_report TEXT
        );

        CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            daily_reminder INTEGER NOT NULL DEFAULT 1,
            streak_notifications INTEGER NOT NULL DEFAULT 1,
            weekly_digest INTEGER NOT NULL DEFAULT 0,
            reminder_time TEXT NOT NULL DEFAULT '08:00',
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    """)
    conn.commit()
