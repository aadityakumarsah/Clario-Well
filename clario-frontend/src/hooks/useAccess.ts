import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isTrialActive, getTrialDaysLeft } from "@/lib/trial";
import { getSubscriptionStatus, SubscriptionStatus } from "@/lib/subscription";

interface AccessState {
  hasAccess: boolean;
  isPremium: boolean;       // true only when a paid subscription is active
  trialDaysLeft: number;
  plan: string | null;      // "weekly" | "monthly" | "yearly" | null
  expiresAt: string | null; // ISO string of subscription end date
  loading: boolean;
}

export function useAccess(): AccessState {
  const { user, loading: authLoading } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus>({ active: false, plan: null, expires_at: null });
  const [subLoading, setSubLoading] = useState(true);

  const createdAt = user?.created_at ?? null;
  const trialActive   = isTrialActive(createdAt);
  const trialDaysLeft = getTrialDaysLeft(createdAt);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setSubLoading(false); return; }

    getSubscriptionStatus()
      .then((s) => setSub(s))
      .catch(() => setSub({ active: false, plan: null, expires_at: null }))
      .finally(() => setSubLoading(false));
  }, [user, authLoading]);

  const isPremium = sub.active;

  return {
    hasAccess: trialActive || isPremium,
    isPremium,
    trialDaysLeft,
    plan: sub.plan,
    expiresAt: sub.expires_at,
    loading: authLoading || subLoading,
  };
}
