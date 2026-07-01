import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Leaf } from "lucide-react";

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

type Mode = "login" | "signup";

const FEATURES = [
  { emoji: "🎙️", text: "Voice journaling with AI" },
  { emoji: "🌿", text: "Daily wellness rituals" },
  { emoji: "📊", text: "Mood & pattern insights" },
  { emoji: "🧘", text: "Breathing & meditation" },
];

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (session) return <Navigate to="/daily-check" replace />;

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
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
    // On success Supabase redirects the browser — no further action needed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/daily-check");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          // Logged in immediately → onboarding
          navigate("/onboard");
        } else {
          toast({ title: "Check your email", description: "Confirm your account then sign in." });
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* ── Left panel (desktop only) ───────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12"
        style={{
          background: "linear-gradient(160deg, hsl(158 28% 28%) 0%, hsl(158 22% 20%) 100%)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-white tracking-tight">Clario</span>
        </div>

        {/* Centre quote */}
        <div className="space-y-6">
          <blockquote className="text-white/90 font-display text-3xl leading-snug font-light">
            "Your feelings deserve a<br />safe place to land."
          </blockquote>

          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.emoji}</span>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-white/30 text-xs">Your AI wellness companion</p>
      </div>

      {/* ── Right panel (form) ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(158 28% 32%)" }}
          >
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-2xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Clario
          </span>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-8 space-y-1">
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-display)" }}
            >
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {mode === "signup"
                ? "Start your 3-day free trial — no card needed"
                : "Sign in to continue your wellness journey"}
            </p>
          </div>

          {/* Tab toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "hsl(var(--muted))" }}
          >
            {(["signup", "login"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === m ? "hsl(var(--background))" : "transparent",
                  color: mode === m ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: mode === m ? "0 1px 4px rgba(58,46,42,0.08)" : "none",
                }}
              >
                {m === "signup" ? "Sign up" : "Sign in"}
              </button>
            ))}
          </div>

          {/* Google OAuth button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-60 mb-4"
            style={{
              background: "hsl(var(--card))",
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

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FieldLabel label="Your name" />
                  <FieldInput
                    type="text"
                    placeholder="How should we call you?"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <FieldLabel label="Email" />
              <FieldInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <FieldLabel label="Password" />
              <div className="relative">
                <FieldInput
                  type={showPw ? "text" : "password"}
                  placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold mt-2 transition-opacity disabled:opacity-60"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              {loading
                ? "Please wait…"
                : mode === "signup"
                ? "Start free trial →"
                : "Sign in →"}
            </button>
          </form>

          {mode === "signup" && (
            <p className="mt-5 text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
              3 days free, then choose a plan. Cancel anytime.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>
      {label}
    </p>
  );
}

function FieldInput({
  type, placeholder, value, onChange, autoComplete, required, minLength,
}: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string;
  required?: boolean; minLength?: number;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete={autoComplete}
      required={required}
      minLength={minLength}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
        color: "hsl(var(--foreground))",
      }}
      onFocus={e => (e.target.style.borderColor = "hsl(var(--primary))")}
      onBlur={e => (e.target.style.borderColor = "hsl(var(--border))")}
    />
  );
}
