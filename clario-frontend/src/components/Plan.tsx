import { useState } from "react";

const plans = [
  {
    name: "Basic",
    price: 10,
    tag: "For starters",
    description: "Perfect for individuals exploring the platform with essential access.",
    color: "#4A6FA5",
    features: [
      { label: "Reports per day", value: "1", unlimited: false },
      { label: "API calls per day", value: "1", unlimited: false },
      { label: "Dashboard access", value: "Basic", unlimited: false },
      { label: "Email support", value: "48hr response", unlimited: false },
      { label: "Data export", value: "CSV only", unlimited: false },
      { label: "Team members", value: "1 seat", unlimited: false },
    ],
    cta: "Start Basic",
    popular: false,
  },
  {
    name: "Pro",
    price: 100,
    tag: "Most popular",
    description: "Built for growing teams that need serious throughput and deeper insights.",
    color: "#D4841A",
    features: [
      { label: "Reports per day", value: "10", unlimited: false },
      { label: "API calls per day", value: "10", unlimited: false },
      { label: "Dashboard access", value: "Advanced", unlimited: false },
      { label: "Priority support", value: "4hr response", unlimited: false },
      { label: "Data export", value: "CSV, PDF, JSON", unlimited: false },
      { label: "Team members", value: "5 seats", unlimited: false },
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Max",
    price: 300,
    tag: "Full potential",
    description: "Unlimited everything. No ceilings, no throttling — pure, unrestricted power.",
    color: "hsl(var(--primary))",
    features: [
      { label: "Reports per day", value: "Unlimited", unlimited: true },
      { label: "API calls per day", value: "Unlimited", unlimited: true },
      { label: "Dashboard access", value: "Full Suite", unlimited: true },
      { label: "Dedicated support", value: "Instant", unlimited: true },
      { label: "Data export", value: "All formats", unlimited: true },
      { label: "Team members", value: "Unlimited", unlimited: true },
    ],
    cta: "Unlock Max",
    popular: false,
  },
];

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfinityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.739-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

interface Theme {
  bg: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  toggleBg: string;
  toggleActive: string;
  dividerAlpha: string;
  featureHighlight: string;
  shadow: string;
}

const lightTheme: Theme = {
  bg: "#F6F5F0",
  cardBg: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.06)",
  text: "#1A1A2E",
  textSecondary: "#4A5568",
  textMuted: "#8896A6",
  toggleBg: "rgba(0,0,0,0.04)",
  toggleActive: "#FFFFFF",
  dividerAlpha: "44",
  featureHighlight: "0A",
  shadow: "rgba(0,0,0,0.08)",
};

const darkTheme: Theme = {
  bg: "#0B0F1A",
  cardBg: "rgba(58,46,42,0.03)",
  cardBorder: "rgba(58,46,42,0.06)",
  text: "#E8ECF1",
  textSecondary: "#A0AEC0",
  textMuted: "#6B7B8D",
  toggleBg: "rgba(58,46,42,0.04)",
  toggleActive: "rgba(58,46,42,0.10)",
  dividerAlpha: "44",
  featureHighlight: "0A",
  shadow: "rgba(0,0,0,0.25)",
};

export default function Plan() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  const t = isDark ? darkTheme : lightTheme;

  const getPrice = (price: number) => {
    if (billing === "yearly") return Math.round(price * 10);
    return price;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.4s ease",
      }}
    >
      {/* Ambient shapes */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.05)"} 0%, transparent 70%)`,
          animation: "float1 20s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "-5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(212,132,26,0.06)" : "rgba(212,132,26,0.04)"} 0%, transparent 70%)`,
          animation: "float2 25s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 50,
          width: 48,
          height: 48,
          borderRadius: 14,
          border: `1px solid ${isDark ? "rgba(58,46,42,0.10)" : "rgba(0,0,0,0.08)"}`,
          background: isDark ? "rgba(58,46,42,0.05)" : "#FFFFFF",
          color: t.text,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
        aria-label="Toggle theme"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56, animation: "fadeUp 0.8s ease-out" }}>
          <div
            style={{
              display: "inline-block",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#D4841A",
              background: "rgba(212,132,26,0.1)",
              border: "1px solid rgba(212,132,26,0.2)",
              padding: "6px 16px",
              borderRadius: 100,
              marginBottom: 24,
            }}
          >
            PRICING
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 700,
              color: t.text,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              marginBottom: 20,
              transition: "color 0.4s ease",
            }}
          >
            Choose your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #E0A94A, hsl(var(--primary)), #4A6FA5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              power level
            </span>
          </h1>

          <p
            style={{
              fontSize: 17,
              color: t.textMuted,
              maxWidth: 520,
              margin: "0 auto 32px",
              lineHeight: 1.65,
              transition: "color 0.4s ease",
            }}
          >
            Scale from essentials to unlimited. Every plan includes core features — upgrade for more volume and priority access.
          </p>

          {/* Billing toggle */}
          <div
            style={{
              display: "inline-flex",
              background: t.toggleBg,
              borderRadius: 14,
              padding: 4,
              border: `1px solid ${t.cardBorder}`,
              transition: "all 0.4s ease",
            }}
          >
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  color: billing === b ? t.text : t.textMuted,
                  background: billing === b ? t.toggleActive : "transparent",
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: billing === b && !isDark ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {b === "monthly" ? "Monthly" : "Yearly"}
                {b === "yearly" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      background: "rgba(72,199,142,0.15)",
                      color: "#2D9F6F",
                      padding: "2px 8px",
                      borderRadius: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            alignItems: "start",
            animation: "fadeUp 0.8s ease-out 0.15s both",
          }}
        >
          {plans.map((plan, i) => {
            const isHovered = hoveredPlan === i;
            const isPro = plan.popular;
            const isMax = plan.name === "Max";

            return (
              <div
                key={plan.name}
                onMouseEnter={() => setHoveredPlan(i)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  background: isPro
                    ? isDark
                      ? "rgba(212,132,26,0.04)"
                      : "rgba(212,132,26,0.02)"
                    : isMax
                    ? isDark
                      ? "linear-gradient(170deg, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.02) 100%)"
                      : "linear-gradient(170deg, rgba(124,58,237,0.03) 0%, rgba(124,58,237,0.01) 100%)"
                    : t.cardBg,
                  borderRadius: 24,
                  padding: "36px 32px",
                  transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  position: "relative",
                  border: `1px solid ${
                    isPro
                      ? `${plan.color}${isDark ? "33" : "22"}`
                      : isMax
                      ? `${plan.color}${isDark ? "33" : "22"}`
                      : t.cardBorder
                  }`,
                  display: "flex",
                  flexDirection: "column" as const,
                  transform: isHovered
                    ? "translateY(-8px) scale(1.02)"
                    : isPro
                    ? "scale(1.03)"
                    : "translateY(0) scale(1)",
                  boxShadow: isHovered
                    ? `0 32px 64px -16px ${plan.color}${isDark ? "44" : "22"}, 0 0 0 1px ${plan.color}33`
                    : isPro
                    ? `0 24px 48px -12px ${plan.color}${isDark ? "33" : "18"}, 0 0 0 2px ${plan.color}${isDark ? "55" : "33"}`
                    : `0 4px 24px -4px ${t.shadow}`,
                }}
              >
                {isPro && (
                  <div
                    style={{
                      position: "absolute",
                      top: -1,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: 2,
                      color: "#fff",
                      background: plan.color,
                      padding: "6px 20px",
                      borderRadius: "0 0 12px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <SparkleIcon /> MOST POPULAR
                  </div>
                )}

                <div style={{ marginBottom: 24, marginTop: isPro ? 16 : 0 }}>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase" as const,
                      color: plan.color,
                      background: `${plan.color}${isDark ? "18" : "10"}`,
                      padding: "4px 12px",
                      borderRadius: 8,
                      display: "inline-block",
                      marginBottom: 14,
                    }}
                  >
                    {plan.tag}
                  </span>
                  <h2
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: t.text,
                      letterSpacing: -0.5,
                      marginBottom: 8,
                      transition: "color 0.4s ease",
                    }}
                  >
                    {plan.name}
                  </h2>
                  <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, transition: "color 0.4s ease" }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: t.textMuted, marginTop: 8, transition: "color 0.4s ease" }}>
                      $
                    </span>
                    <span
                      style={{
                        fontSize: 56,
                        fontWeight: 700,
                        color: t.text,
                        lineHeight: 1,
                        letterSpacing: -2,
                        fontFamily: "'Space Mono', monospace",
                        transition: "color 0.4s ease",
                      }}
                    >
                      {getPrice(plan.price)}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, color: t.textMuted, fontWeight: 500, display: "block", marginTop: 4, transition: "color 0.4s ease" }}>
                    per {billing === "yearly" ? "year" : "month"}
                  </span>
                  {billing === "yearly" && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#2D9F6F",
                        fontWeight: 500,
                        display: "block",
                        marginTop: 4,
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      ${(getPrice(plan.price) / 12).toFixed(0)}/mo equivalent
                    </span>
                  )}
                </div>

                <div
                  style={{
                    height: 1,
                    marginBottom: 24,
                    background: `linear-gradient(90deg, transparent, ${plan.color}${t.dividerAlpha}, transparent)`,
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 32, flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div
                      key={fi}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: f.unlimited ? "8px 12px" : "4px 0",
                        margin: f.unlimited ? "0 -12px" : 0,
                        borderRadius: f.unlimited ? 10 : 0,
                        background: f.unlimited ? `${plan.color}${t.featureHighlight}` : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ display: "flex", alignItems: "center", color: f.unlimited ? plan.color : t.textMuted }}>
                          {f.unlimited ? <InfinityIcon /> : <CheckIcon />}
                        </span>
                        <span style={{ fontSize: 14, color: t.textSecondary, transition: "color 0.4s ease" }}>
                          {f.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "'Space Mono', monospace",
                          color: f.unlimited ? plan.color : t.textMuted,
                          fontWeight: f.unlimited ? 700 : 500,
                          textAlign: "right" as const,
                          transition: "color 0.4s ease",
                        }}
                      >
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    letterSpacing: 0.3,
                    background: isMax
                      ? `linear-gradient(135deg, , hsl(var(--primary)), )`
                      : isPro
                      ? plan.color
                      : "transparent",
                    color: isPro || isMax ? "#fff" : plan.color,
                    border: isPro || isMax ? "none" : `2px solid ${plan.color}44`,
                    backgroundSize: isMax ? "200% 200%" : "100% 100%",
                    animation: isMax ? "shimmer 3s ease infinite" : "none",
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: t.textMuted,
            marginTop: 48,
            animation: "fadeUp 0.8s ease-out 0.3s both",
            transition: "color 0.4s ease",
          }}
        >
          All plans include SSL encryption, 99.9% uptime SLA, and 14-day free trial. Cancel anytime.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 20px) rotate(-120deg); }
          66% { transform: translate(30px, -40px) rotate(-240deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
