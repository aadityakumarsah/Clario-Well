import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { syncSubscription } from "@/lib/subscription";

export default function PaywallSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) { setSyncing(false); return; }

    syncSubscription(sessionId)
      .catch(() => setSyncError(true))
      .finally(() => setSyncing(false));
  }, []);

  if (syncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#060F1E" }}>
        <div className="w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: "#94A3B8" }}>Activating your subscription…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#060F1E" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "rgba(124,58,237,0.18)", border: "1.5px solid #7C3AED" }}
        >
          {syncError ? "⚠️" : "✓"}
        </div>

        <h1 className="text-3xl font-bold text-white">
          {syncError ? "Payment received!" : "You're all set!"}
        </h1>

        <p className="text-base" style={{ color: "#94A3B8" }}>
          {syncError
            ? "Your payment went through but we couldn't activate instantly. Sign out and back in to refresh your access."
            : <>Welcome to{" "}
                <span style={{ color: "#A78BFA" }} className="font-semibold">Clario Premium</span>
                . Your subscription is now active — enjoy full access to all your wellness tools.
              </>}
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
