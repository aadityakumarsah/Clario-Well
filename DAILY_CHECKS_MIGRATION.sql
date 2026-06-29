-- ─────────────────────────────────────────────────────────────────────────────
-- Clario — Daily Checks & Streak migration
-- Paste in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times (IF NOT EXISTS + OR REPLACE guards).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── daily_checks ──────────────────────────────────────────────────────────────
-- One row per user per local calendar day.
-- check_date is the user's LOCAL date (YYYY-MM-DD) sent by the mobile client.
CREATE TABLE IF NOT EXISTS public.daily_checks (
  id           BIGSERIAL    PRIMARY KEY,
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date   DATE         NOT NULL,
  morning      BOOLEAN      NOT NULL DEFAULT FALSE,
  refill       BOOLEAN      NOT NULL DEFAULT FALSE,
  night        BOOLEAN      NOT NULL DEFAULT FALSE,
  -- TRUE once all three steps are TRUE; triggers streak update
  day_complete BOOLEAN      NOT NULL DEFAULT FALSE,
  -- timestamp of when day_complete first flipped to TRUE
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, check_date)
);

ALTER TABLE public.daily_checks ENABLE ROW LEVEL SECURITY;

-- Users can read + write only their own rows (used by the mobile app directly if needed)
CREATE POLICY "Users manage own daily checks"
  ON public.daily_checks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Backend service_role key bypasses RLS automatically — no extra policy needed.

CREATE TRIGGER daily_checks_updated_at
  BEFORE UPDATE ON public.daily_checks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── user_streaks ──────────────────────────────────────────────────────────────
-- Denormalised streak counter kept in sync by the API on each full-day check-in.
-- Derived from daily_checks but cached here so reads are O(1).
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id         UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  -- last local date on which all 3 checks were completed
  last_check_date DATE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own streak"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Backend writes via service_role → no INSERT/UPDATE policy needed.

CREATE TRIGGER user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
