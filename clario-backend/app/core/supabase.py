# ─── Supabase admin client ────────────────────────────────────────────────────
# Uses the service role key — bypasses RLS for all backend writes.
# Env vars:
#   SUPABASE_URL              → Project URL from Supabase > Settings > API
#   SUPABASE_SERVICE_ROLE_KEY → service_role key (keep SECRET — never expose to frontend)

from __future__ import annotations
from app.core.config import settings

_client = None


def get_supabase_client():
    """Return a cached Supabase admin client, or None if not configured.

    Only successful initializations are cached — a transient failure is retried
    on the next call instead of permanently disabling Supabase for the process.
    """
    global _client
    if _client is not None:
        return _client
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        from supabase import create_client
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        return _client
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Supabase client init failed: %s", e)
        return None
