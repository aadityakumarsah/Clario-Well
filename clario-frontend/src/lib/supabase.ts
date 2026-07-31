// ─── Supabase client ─────────────────────────────────────────────────────────
// Env vars (set in .env.local for dev, Vercel dashboard for prod):
//   VITE_SUPABASE_URL      → Project URL from Supabase > Settings > API
//   VITE_SUPABASE_ANON_KEY → anon/public key from Supabase > Settings > API

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "[Clario] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — " +
    "copy them from Supabase > Settings > API into your .env (see .env.example)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
