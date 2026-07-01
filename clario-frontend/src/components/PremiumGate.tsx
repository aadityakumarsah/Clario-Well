import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAccess } from "@/hooks/useAccess";

interface Props {
  feature: string;
  icon: string;
  description: string;
  children: React.ReactNode;
}

export default function PremiumGate({ feature, icon, description, children }: Props) {
  const { isPremium, trialDaysLeft, loading } = useAccess();
  const navigate = useNavigate();

  // Fail-closed: locked while loading OR when user hasn't paid (trial doesn't unlock premium features)
  const locked = loading || !isPremium;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!locked) return <>{children}</>;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Subtle radial */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(109,40,217,0.07) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="w-[88px] h-[88px] rounded-[28px] flex items-center justify-center mb-7 text-[44px]"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 0 1px rgba(58,46,42,0.08), 0 8px 32px rgba(58,46,42,0.12)",
          }}
        >
          {icon}
        </motion.div>

        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="text-[10px] font-semibold tracking-[0.25em] uppercase px-3.5 py-1.5 rounded-full mb-5"
          style={{
            background: "rgba(139,92,246,0.12)",
            color: "hsl(var(--primary))",
            border: "1px solid rgba(139,92,246,0.3)",
          }}
        >
          Premium
        </motion.span>

        {/* Feature name */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="text-[28px] font-semibold tracking-tight mb-2.5"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {feature}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21 }}
          className="text-sm leading-relaxed mb-9 px-2"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {description}
        </motion.p>

        {/* Upgrade section — matches screenshot style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="w-full rounded-2xl p-5 mb-5"
          style={{
            background: "hsl(var(--card))",
            border: "1.5px solid rgba(109,40,217,0.55)",
          }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span style={{ color: "hsl(var(--primary))" }}>✦</span>
            <span className="font-semibold text-base" style={{ color: "hsl(var(--foreground))" }}>Upgrade your plan</span>
          </div>
          <p className="text-sm mb-4 text-left" style={{ color: "hsl(var(--muted-foreground))" }}>
            {trialDaysLeft > 0
              ? `Your trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}. Pick a plan to keep access.`
              : "Your trial has ended. Subscribe to continue."}
          </p>

          {/* Plan cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Weekly",  price: "$3",   highlight: false },
              { label: "Monthly", price: "$10",  highlight: true  },
              { label: "Yearly",  price: "$199", highlight: false },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => navigate("/paywall")}
                className="flex flex-col items-center py-4 rounded-xl transition-opacity hover:opacity-90 active:scale-[0.97]"
                style={{
                  background: p.highlight
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
                  border: p.highlight ? "none" : "1px solid hsl(var(--border))",
                  boxShadow: p.highlight ? "0 4px 20px rgba(109,40,217,0.4)" : "none",
                }}
              >
                <span className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{p.price}</span>
                <span className="text-sm mt-0.5" style={{ color: p.highlight ? "rgba(58,46,42,0.80)" : "hsl(var(--muted-foreground))" }}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Back link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={() => navigate(-1)}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Go back
        </motion.button>
      </motion.div>
    </div>
  );
}
