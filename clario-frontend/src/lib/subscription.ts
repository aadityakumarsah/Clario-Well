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

export async function createCheckoutSession(
  plan: "weekly" | "monthly" | "yearly"
): Promise<string> {
  if (!BASE) throw new Error("Backend URL not configured");

  const origin = window.location.origin;
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
    throw new Error(err.detail ?? `Failed to create checkout session (${res.status})`);
  }

  const data = await res.json();
  return data.url as string;
}

export async function syncSubscription(sessionId: string): Promise<void> {
  if (!BASE) return;
  await fetch(`${BASE}/payments/sync?session_id=${encodeURIComponent(sessionId)}`, {
    method: "POST",
    headers: await authHeaders(),
  });
}
