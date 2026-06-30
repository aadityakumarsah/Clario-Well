// Sends the Supabase session JWT — no separate clario-token needed.
import { supabase } from "./supabase";

const BASE = (import.meta.env.VITE_BACKEND_BASE_URL as string) ?? "";

export interface SubscriptionStatus {
  active: boolean;
  plan: string | null;
  expires_at: string | null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (!BASE) return { active: false, plan: null, expires_at: null };
  try {
    const res = await fetch(`${BASE}/payments/status`, {
      headers: await authHeaders(),
    });
    if (!res.ok) return { active: false, plan: null, expires_at: null };
    return await res.json();
  } catch {
    return { active: false, plan: null, expires_at: null };
  }
}

class NoRetryError extends Error {
  constructor(msg: string) { super(msg); this.name = "NoRetryError"; }
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 8, delayMs = 6000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delayMs));
    try { return await fn(); } catch (e) {
      if (e instanceof NoRetryError) throw e; // don't retry auth/config errors
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function createCheckoutSession(
  plan: "weekly" | "monthly" | "yearly"
): Promise<string> {
  if (!BASE) throw new Error("Backend URL not configured");

  const origin = window.location.origin;
  return withRetry(async () => {
    const res = await fetch(`${BASE}/payments/create-checkout-session`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        plan,
        success_url: `${origin}/paywall/success`,
        cancel_url: `${origin}/paywall`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.detail ?? `Failed to create checkout session (${res.status})`;
      // Don't retry: 4xx (except 429), or 502 from payment provider (config error, not server sleep)
      const noRetry = (res.status >= 400 && res.status < 500 && res.status !== 429)
        || (res.status === 502 && msg.toLowerCase().includes("payment provider"));
      if (noRetry) throw new NoRetryError(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    return data.url as string;
  });
}

export async function syncSubscription(sessionId: string): Promise<void> {
  if (!BASE) return;
  await withRetry(async () => {
    const res = await fetch(
      `${BASE}/payments/sync?session_id=${encodeURIComponent(sessionId)}`,
      { method: "POST", headers: await authHeaders() }
    );
    if (res.ok) return;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Sync failed (${res.status})`);
  });
}
