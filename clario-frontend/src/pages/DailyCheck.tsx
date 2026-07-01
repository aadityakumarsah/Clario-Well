/**
 * Daily Check hub — garden video top section + 3 step cards below.
 * Completion state persisted in localStorage keyed by today's date.
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Dumbbell, Moon, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import GardenScene from "@/components/GardenScene";

// ─── persistence ──────────────────────────────────────────────────────────────
const todayKey = () => `daily-check-${new Date().toISOString().slice(0, 10)}`;

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(todayKey()) ?? "{}");
  } catch {
    return {};
  }
}

export function markStepDone(key: string) {
  const current = loadDone();
  current[key] = true;
  localStorage.setItem(todayKey(), JSON.stringify(current));
}

// ─── step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "morning",
    number: "01",
    title: "Morning Energy",
    subtitle: "Hydrate to activate",
    description: "Drink 2 glasses of water to wake your body up.",
    icon: Droplets,
    color: "#E8A44A",    // warm amber
    path: "/daily-check/morning",
  },
  {
    key: "refill",
    number: "02",
    title: "Day Refill",
    subtitle: "Move to reset",
    description: "5 squats with your camera — let the body shake off the midday fog.",
    icon: Dumbbell,
    color: "#5DB075",    // sage green
    path: "/daily-check/refill",
  },
  {
    key: "night",
    number: "03",
    title: "Night Summary",
    subtitle: "Release the day",
    description: "Speak your whole day to your voice agent. Nothing held back.",
    icon: Moon,
    color: "hsl(var(--primary))",    // soft violet
    path: "/daily-check/night",
  },
];

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// ─── component ────────────────────────────────────────────────────────────────
export default function DailyCheck() {
  const navigate = useNavigate();
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Reload completion state whenever this page is focused
  useEffect(() => {
    const refresh = () => setDone(loadDone());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const completedCount = STEPS.filter(s => done[s.key]).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      <Navbar />

      {/* ── Garden scene section ─────────────────────────────────────── */}
      <div className="relative w-full shrink-0" style={{ paddingTop: "56px" /* navbar height */ }}>
        <GardenScene completed={completedCount} />
      </div>

      {/* ── Content section ──────────────────────────────────────────── */}
      <div className="flex-1 px-5 pb-12 max-w-2xl w-full mx-auto -mt-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            today's ritual
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.5px" }}>
              daily check
            </h1>
            {/* Progress pill */}
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full mb-1"
              style={{
                backgroundColor: completedCount === 3 ? "#10B981" + "22" : "rgba(58,46,42,0.06)",
                color: completedCount === 3 ? "#10B981" : "hsl(var(--muted-foreground))",
                border: `1px solid ${completedCount === 3 ? "#10B98144" : "hsl(var(--border))"}`,
              }}
            >
              {completedCount} / 3 done
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            three steps, morning to night.
          </p>
        </motion.div>

        {/* Step cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col gap-3"
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = !!done[step.key];

            return (
              <motion.button
                key={step.key}
                variants={cardAnim}
                type="button"
                onClick={() => navigate(step.path)}
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left rounded-2xl border p-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden"
                style={{
                  backgroundColor: isDone
                    ? step.color + "0D"
                    : "rgba(58,46,42,0.03)",
                  borderColor: isDone
                    ? step.color + "40"
                    : "rgba(58,46,42,0.07)",
                }}
              >
                {/* Subtle done tint */}
                {isDone && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: step.color, opacity: 0.04 }}
                  />
                )}

                {/* Icon circle */}
                <div
                  className="shrink-0 w-13 h-13 w-[52px] h-[52px] rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: step.color + (isDone ? "28" : "18"),
                    border: `1px solid ${step.color}${isDone ? "55" : "33"}`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-mono font-semibold"
                      style={{ color: step.color }}
                    >
                      {step.number}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {step.subtitle}
                    </span>
                  </div>
                  <p
                    className="font-semibold text-base leading-snug"
                    style={{ color: isDone ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}
                  >
                    {step.title}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Tick / arrow */}
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: step.color }}
                  >
                    <Check className="w-3.5 h-3.5 text-foreground" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <div
                    className="shrink-0 text-lg"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    ›
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* All done banner */}
        {completedCount === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 rounded-2xl p-5 text-center"
            style={{
              backgroundColor: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "#10B981" }}>
              All done for today ✓
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              See you tomorrow.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
