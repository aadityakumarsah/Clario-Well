import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession } from "@/lib/subscription";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";

type Plan = "weekly" | "monthly" | "yearly";
type AuthMode = "signin" | "signup";

interface PlanCard {
  id: Plan;
  label: string;
  price: string;
  period: string;
  description: string;
  highlight: boolean;
  badge?: string;
}

const PLANS: PlanCard[] = [
  {
    id: "weekly",
    label: "Weekly",
    price: "$3",
    period: "per week",
    description: "Try it out week by week",
    highlight: false,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$10",
    period: "per month",
    description: "The most popular choice",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$198",
    period: "per year",
    description: "Best value — save over 30%",
    highlight: false,
  },
];

function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // AuthContext will pick up the session and redirect automatically
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "#0D1B2E",
    border: "1.5px solid #1E293B",
    borderRadius: "12px",
    color: "#F1F5F9",
    padding: "10px 14px",
    width: "100%",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <motion.div
      key="auth"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <div
        className="rounded-2xl p-6"
        style={{ background: "#0D1B2E", border: "1.5px solid #1E293B" }}
      >
        {/* Toggle */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "#060F1E" }}
        >
          {(["signup", "signin"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: mode === m ? "#7C3AED" : "transparent",
                color: mode === m ? "#fff" : "#64748B",
              }}
            >
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-400 text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1 transition-opacity disabled:opacity-60"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            {loading
              ? "Please wait…"
              : mode === "signup"
              ? "Start 3-day free trial"
              : "Sign in"}
          </button>
        </form>

        {mode === "signup" && (
          <p className="mt-4 text-xs text-center" style={{ color: "#475569" }}>
            3 days free, then choose a plan. No card required to start.
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PlanCards() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [wakingUp, setWakingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (plan: Plan) => {
    setLoadingPlan(plan);
    setWakingUp(false);
    setError(null);

    // Show "waking up server" message after 5s if still loading
    const wakeTimer = setTimeout(() => setWakingUp(true), 5000);
    try {
      const url = await createCheckoutSession(plan);
      clearTimeout(wakeTimer);
      window.location.href = url;
    } catch (err: unknown) {
      clearTimeout(wakeTimer);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      const isFetch = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("backend url");
      setError(isFetch ? "Server is still starting. Please try again in a moment." : msg);
      setLoadingPlan(null);
      setWakingUp(false);
    }
  };

  return (
    <motion.div
      key="plans"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl flex flex-col items-center gap-6"
    >
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handleSelect(plan.id)}
            disabled={loadingPlan !== null}
            className="relative flex flex-col items-center text-center rounded-2xl p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
            style={{
              background: plan.highlight
                ? "linear-gradient(135deg, #1E1040 0%, #0F172A 100%)"
                : "#0D1B2E",
              border: plan.highlight
                ? "1.5px solid #7C3AED"
                : "1.5px solid #1E293B",
              boxShadow: plan.highlight
                ? "0 0 24px 0 rgba(124,58,237,0.18)"
                : "none",
            }}
          >
            {plan.badge && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full"
                style={{ background: "#7C3AED", color: "#fff" }}
              >
                {plan.badge}
              </span>
            )}
            <span className="text-base font-semibold mb-1" style={{ color: plan.highlight ? "#A78BFA" : "#94A3B8" }}>
              {plan.label}
            </span>
            <span className="text-4xl font-bold mb-0.5" style={{ color: "#F1F5F9" }}>
              {plan.price}
            </span>
            <span className="text-xs mb-3" style={{ color: "#64748B" }}>
              {plan.period}
            </span>
            <span className="text-sm mb-5" style={{ color: "#94A3B8" }}>
              {plan.description}
            </span>
            <span
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
              style={{
                background: plan.highlight
                  ? loadingPlan === plan.id ? "#5B21B6" : "#7C3AED"
                  : loadingPlan === plan.id ? "#1E3A5F" : "#1E293B",
                color: plan.highlight ? "#fff" : "#94A3B8",
              }}
            >
              {loadingPlan === plan.id ? (wakingUp ? "Waking server…" : "Please wait…") : "Get started"}
            </span>
          </button>
        ))}
      </div>

      {wakingUp && !error && (
        <p className="text-xs text-center animate-pulse" style={{ color: "#A78BFA" }}>
          Server is starting up — this takes up to 30 seconds, please wait…
        </p>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-400 text-center max-w-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs underline"
            style={{ color: "#64748B" }}
          >
            Dismiss and try again
          </button>
        </div>
      )}
      <p className="text-xs text-center" style={{ color: "#475569" }}>
        Cancel anytime. Secure payment via Dodo Payments.
      </p>
    </motion.div>
  );
}

export default function Paywall() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { trialDaysLeft, loading: accessLoading } = useAccess();
  const navigate = useNavigate();

  const loading = authLoading || accessLoading;
  // User is logged in → show plans
  // User is not logged in → show auth form
  const showPlans = !loading && !!user;
  // Still in trial → show "not yet" escape
  const stillInTrial = !loading && !!user && trialDaysLeft > 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8"
      style={{ background: "#060F1E" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#A78BFA" }}>
          Clario
        </h1>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-semibold text-white">
          {showPlans
            ? stillInTrial
              ? "Upgrade your plan"
              : "Your free trial has ended"
            : "Feel better, starting today"}
        </h2>
        <p className="text-base" style={{ color: "#94A3B8" }}>
          {showPlans
            ? stillInTrial
              ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left in your trial — upgrade anytime`
              : "Continue your wellness journey with a Clario subscription"
            : "Create a free account and get 3 days on us"}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        ) : showPlans ? (
          <>
            <PlanCards />
            <div className="flex flex-col items-center gap-3 mt-1">
              {stillInTrial && (
                <button
                  onClick={() => navigate("/daily-check")}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#94A3B8",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Not yet, continue my trial
                </button>
              )}
              <button
                onClick={signOut}
                className="text-xs underline"
                style={{ color: "#475569" }}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <AuthForm />
        )}
      </AnimatePresence>
    </div>
  );
}
