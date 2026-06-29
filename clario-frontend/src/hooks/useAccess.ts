import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isTrialActive, getTrialDaysLeft } from "@/lib/trial";
import { getSubscriptionStatus, SubscriptionStatus } from "@/lib/subscription";

// ─── Module-level cache ───────────────────────────────────────────────────────
// Shared across all useAccess() instances so only one network call fires per page load.
// Also backed by localStorage so the last known state loads instantly on refresh.

const CACHE_KEY = "clario_sub";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function readCache(): SubscriptionStatus | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: SubscriptionStatus; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
}

export function writeCache(s: SubscriptionStatus) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: s, ts: Date.now() }));
  } catch {}
}

export function clearSubCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
  _inflight = null; // force next fetchSub() to make a fresh network request
}

// In-flight promise shared across instances — prevents duplicate requests.
let _inflight: Promise<SubscriptionStatus> | null = null;

function fetchSub(): Promise<SubscriptionStatus> {
  if (!_inflight) {
    _inflight = getSubscriptionStatus()
      .then((s) => { writeCache(s); return s; })
      .catch(() => ({ active: false, plan: null, expires_at: null }))
      .finally(() => { _inflight = null; });
  }
  return _inflight;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface AccessState {
  hasAccess: boolean;
  isPremium: boolean;
  trialDaysLeft: number;
  plan: string | null;
  expiresAt: string | null;
  loading: boolean;
}

export function useAccess(): AccessState {
  const { user, loading: authLoading } = useAuth();

  const cached = readCache();
  const [sub, setSub] = useState<SubscriptionStatus>(
    cached ?? { active: false, plan: null, expires_at: null }
  );
  // If we have a valid cache hit: no loading state needed
  const [subLoading, setSubLoading] = useState<boolean>(!cached);

  const createdAt     = user?.created_at ?? null;
  const trialActive   = isTrialActive(createdAt);
  const trialDaysLeft = getTrialDaysLeft(createdAt);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setSubLoading(false); return; }

    fetchSub().then((s) => {
      setSub(s);
      setSubLoading(false);
    });
  }, [user?.id, authLoading]);

  const isPremium = sub.active;

  return {
    hasAccess:    trialActive || isPremium,
    isPremium,
    trialDaysLeft,
    plan:         sub.plan,
    expiresAt:    sub.expires_at,
    loading:      authLoading || subLoading,
  };
}
