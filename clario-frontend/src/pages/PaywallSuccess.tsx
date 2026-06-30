import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { syncSubscription, getSubscriptionStatus } from "@/lib/subscription";
import { clearSubCache, writeCache } from "@/hooks/useAccess";

type State = "syncing" | "done" | "error";

export default function PaywallSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<State>("syncing");
  const [attempt, setAttempt] = useState(0);

  // Dodo Payments appends ?subscription_id=...&status=active; legacy Stripe used session_id
  const sessionId = searchParams.get("subscription_id") ?? searchParams.get("session_id");
  const dodoStatus = searchParams.get("status"); // "active" when Dodo confirms payment

  const doSync = useCallback(async () => {
    setState("syncing");
    try {
      // Try sync — pass subscription_id if we have it
      if (sessionId) {
        await syncSubscription(sessionId);
      }
      clearSubCache();
      const fresh = await getSubscriptionStatus();
      writeCache(fresh);
      // If Dodo told us payment is active OR our DB confirms it, we're done
      if (fresh.active || dodoStatus === "active") {
        setState("done");
        return;
      }
      // Subscription not active yet — treat as error so user can retry
      setState("error");
    } catch (err) {
      console.error("Sync failed:", err);
      if (dodoStatus === "active") {
        // Dodo redirect confirms payment — write optimistic active status so the
        // app doesn't bounce back to paywall before the DB catches up
        clearSubCache();
        writeCache({ active: true, plan: null, expires_at: null });
        setState("done");
        return;
      }
      setState("error");
    }
  }, [sessionId, dodoStatus, attempt]);

  // Auto-retry once after 8s if the first attempt fails (catches brief server hiccups)
  useEffect(() => {
    if (state !== "error" || attempt > 0) return;
    const t = setTimeout(() => setAttempt(1), 8000);
    return () => clearTimeout(t);
  }, [state, attempt]);

  useEffect(() => { doSync(); }, [attempt]);

  if (state === "syncing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#060F1E" }}>
        <div className="w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: "#94A3B8" }}>
          {attempt > 0 ? "Retrying…" : "Activating your subscription…"}
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#060F1E" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(234,179,8,0.15)", border: "1.5px solid #EAB308" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white">Payment received!</h1>

          <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
            Your payment went through — the server is still waking up. Tap retry and it will activate in seconds.
          </p>

          <button
            onClick={() => setAttempt(a => a + 1)}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            Retry activation
          </button>

          <button
            onClick={() => navigate("/daily-check")}
            className="w-full py-2 text-xs"
            style={{ color: "#64748B" }}
          >
            Skip — I'll check later in Settings
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#060F1E" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.18)", border: "1.5px solid #7C3AED" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </motion.div>

        <h1 className="text-3xl font-bold text-white">You're all set!</h1>

        <p className="text-base leading-relaxed" style={{ color: "#94A3B8" }}>
          Welcome to{" "}
          <span style={{ color: "#A78BFA" }} className="font-semibold">Clario Premium</span>
          . Your subscription is now active — enjoy full access to all your wellness tools.
        </p>

        <button
          onClick={() => navigate("/daily-check")}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          Start your day
        </button>
      </motion.div>
    </div>
  );
}
