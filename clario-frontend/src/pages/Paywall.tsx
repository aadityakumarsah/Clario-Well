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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboard`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
        if (data.session) {
          window.location.href = "/onboard";
          return;
        }
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
    background: "hsl(var(--card))",
    border: "1.5px solid hsl(var(--border))",
    borderRadius: "12px",
    color: "hsl(var(--foreground))",
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
        style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
      >
        {/* Toggle */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "hsl(var(--background))" }}
        >
          {(["signup", "signin"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: mode === m ? "hsl(var(--primary))" : "transparent",
                color: mode === m ? "#fff" : "hsl(var(--muted-foreground))",
              }}
            >
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-60 mb-4"
          style={{
            background: "hsl(var(--background))",
            border: "1.5px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
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
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            {loading
              ? "Please wait…"
              : mode === "signup"
              ? "Start 3-day free trial"
              : "Sign in"}
          </button>
        </form>

        {mode === "signup" && (
          <p className="mt-4 text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
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
            className="relative flex flex-col items-center text-center rounded-2xl p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            style={{
              background: plan.highlight
                ? "hsl(var(--primary) / 0.08)"
                : "hsl(var(--card))",
              border: plan.highlight
                ? "1.5px solid hsl(var(--primary))"
                : "1.5px solid hsl(var(--border))",
              boxShadow: plan.highlight
                ? "0 0 24px 0 hsl(var(--primary) / 0.12)"
                : "none",
            }}
          >
            {plan.badge && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full"
                style={{ background: "hsl(var(--primary))", color: "#fff" }}
              >
                {plan.badge}
              </span>
            )}
            <span className="text-base font-semibold mb-1" style={{ color: plan.highlight ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
              {plan.label}
            </span>
            <span className="text-4xl font-bold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>
              {plan.price}
            </span>
            <span className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              {plan.period}
            </span>
            <span className="text-sm mb-5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {plan.description}
            </span>
            <span
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
              style={{
                background: plan.highlight
                  ? loadingPlan === plan.id ? "hsl(var(--primary) / 0.85)" : "hsl(var(--primary))"
                  : "hsl(var(--muted))",
                color: plan.highlight ? "#fff" : "hsl(var(--muted-foreground))",
              }}
            >
              {loadingPlan === plan.id ? (wakingUp ? "Waking server…" : "Please wait…") : "Get started"}
            </span>
          </button>
        ))}
      </div>

      {wakingUp && !error && (
        <p className="text-xs text-center animate-pulse" style={{ color: "hsl(var(--primary))" }}>
          Server is starting up — this takes up to 30 seconds, please wait…
        </p>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-400 text-center max-w-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs underline"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Dismiss and try again
          </button>
        </div>
      )}
      <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
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
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "hsl(var(--primary))" }}>
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
        <h2 className="text-3xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {showPlans
            ? stillInTrial
              ? "Upgrade your plan"
              : "Your free trial has ended"
            : "Feel better, starting today"}
        </h2>
        <p className="text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
          {showPlans
            ? stillInTrial
              ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left in your trial — upgrade anytime`
              : "Continue your wellness journey with a Clario subscription"
            : "Create a free account and get 3 days on us"}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : showPlans ? (
          <>
            <PlanCards />
            <div className="flex flex-col items-center gap-3 mt-1">
              {stillInTrial && (
                <button
                  onClick={() => navigate("/daily-check")}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  Not yet, continue my trial
                </button>
              )}
              <button
                onClick={signOut}
                className="text-xs underline"
                style={{ color: "hsl(var(--muted-foreground))" }}
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
