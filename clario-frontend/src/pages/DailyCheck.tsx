/**
 * Daily Check hub — greeting, garden, streak, week dots, milestone progress,
 * 3 step cards.
 *
 * Layout:
 *   Mobile  — single full-width column (unchanged)
 *   Desktop — centered max-w-5xl, two-column grid:
 *             left = garden card + tracker   right = header + steps
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sunrise, Activity, Moon, Check, Flame, ChevronRight, Sprout,
  Coffee, Flower2, Sparkles, Leaf, Trees, Bird, Cherry, Flower,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import GardenScene from "@/components/GardenScene";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDailyChecksToday,
  getDailyChecksHistory,
  markCheckStep,
  localDateString,
  type DailyCheckDay,
} from "@/lib/api";

// ─── persistence ──────────────────────────────────────────────────────────────
const todayKey = () => `daily-check-${localDateString()}`;

function loadDone(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(todayKey()) ?? "{}"); }
  catch { return {}; }
}

export function markStepDone(key: string) {
  const current = loadDone();
  current[key] = true;
  localStorage.setItem(todayKey(), JSON.stringify(current));
  // Persist to the server too — this is what drives streaks/garden.
  // Fire-and-forget: the local write is the optimistic UI; the server sync
  // must never block the step page.
  markCheckStep(key as "morning" | "refill" | "night").catch(() => {});
}

// ─── milestones ───────────────────────────────────────────────────────────────
const MILESTONES: { successDay: number; label: string; Icon: LucideIcon }[] = [
  { successDay: 1,  label: "teapot",          Icon: Coffee   },
  { successDay: 4,  label: "floral ornament", Icon: Flower2  },
  { successDay: 7,  label: "honey bee",       Icon: Sparkles },
  { successDay: 12, label: "autumn leaves",   Icon: Leaf     },
  { successDay: 21, label: "tree",            Icon: Trees    },
  { successDay: 30, label: "birds",           Icon: Bird     },
  { successDay: 45, label: "berry sprig",     Icon: Cherry   },
  { successDay: 60, label: "garden bees",     Icon: Flower   },
  { successDay: 90, label: "frog",            Icon: Sparkles },
];

function milestoneProgress(dayCount: number) {
  const next = MILESTONES.find((m) => m.successDay > dayCount) ?? null;
  if (!next) return { pct: 1, daysToGo: 0, next: null };
  const idx  = MILESTONES.findIndex((m) => m.successDay === next.successDay);
  const prev = idx > 0 ? MILESTONES[idx - 1].successDay : 0;
  const span = Math.max(1, next.successDay - prev);
  const done = Math.max(0, Math.min(span, dayCount - prev));
  return { pct: done / span, daysToGo: next.successDay - dayCount, next };
}

// ─── step data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "morning",
    number: "01",
    title: "Morning Energy",
    subtitle: "Hydrate to activate",
    description: "Drink 2 glasses of water to wake your body up.",
    Icon: Sunrise,
    color: "#E8A44A",
    path: "/daily-check/morning",
  },
  {
    key: "refill",
    number: "02",
    title: "Day Refill",
    subtitle: "Move to reset",
    description: "5 squats with your camera — let the body shake off the midday fog.",
    Icon: Activity,
    color: "#5DB075",
    path: "/daily-check/refill",
  },
  {
    key: "night",
    number: "03",
    title: "Night Summary",
    subtitle: "Release the day",
    description: "Speak your whole day to your voice agent. Nothing held back.",
    Icon: Moon,
    color: "hsl(var(--primary))",
    path: "/daily-check/night",
  },
];

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const cardAnim = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

// ─── component ────────────────────────────────────────────────────────────────
export default function DailyCheck() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const firstName = (displayName?.split(" ")[0] ?? "").replace(/[^a-zA-Z]/g, "");

  const [done, setDone]     = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [week, setWeek]     = useState<{ label: string; full: boolean }[]>([]);

  function buildLocalWeek() {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
    });
    setWeek(days.map((d, i) => ({
      label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      full:  i === 6 ? Object.values(loadDone()).filter(Boolean).length === 3 : false,
    })));
  }

  async function syncFromApi() {
    try {
      const [today, history] = await Promise.all([
        getDailyChecksToday(),
        getDailyChecksHistory(7),
      ]);
      const merged = { ...loadDone(), morning: today.morning, refill: today.refill, night: today.night };
      setDone(merged);
      localStorage.setItem(todayKey(), JSON.stringify(merged));
      setStreak(today.current_streak);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
      });
      setWeek(history.map((h: DailyCheckDay, i: number) => ({
        label: days[i].toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        full:  h.day_complete,
      })));
    } catch {
      setDone(loadDone());
      buildLocalWeek();
    }
  }

  useEffect(() => {
    setDone(loadDone());
    buildLocalWeek();
    syncFromApi();
    // Refresh on tab focus only — no polling interval to avoid spamming a temporarily-unavailable backend
    const onFocus = () => { setDone(loadDone()); syncFromApi(); };
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("focus", onFocus); };
  }, []);

  const completedCount = STEPS.filter(s => done[s.key]).length;
  const completedKeys  = STEPS.filter(s => done[s.key]).map(s => s.key);
  const { pct, daysToGo, next: nextM } = milestoneProgress(streak);

  // ── Garden + tracker panel (shared between mobile and desktop left col) ──
  const GardenPanel = (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 24,
        border: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
      }}
    >
      <GardenScene completed={completedCount} completedKeys={completedKeys} />

      {/* Streak + week dots */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
          style={{ backgroundColor: "#E8A44A33" }}
        >
          <Flame size={14} color="#C47A1B" strokeWidth={2.3} />
          <span className="text-sm font-black" style={{ color: "#6B3E0A" }}>{streak}</span>
          <span className="text-xs" style={{ color: "#8B5E1A" }}>day streak</span>
        </div>

        <div className="flex flex-1 justify-around items-end">
          {week.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: d.full ? "#5DB075" : i === 6 ? "transparent" : "hsl(var(--border))",
                  border: i === 6 ? "2px solid #E8A44A" : "none",
                }}
              />
              <span
                className="text-[9px]"
                style={{ color: i === 6 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontWeight: i === 6 ? 700 : 400 }}
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/garden")}
          className="flex items-center gap-0.5 shrink-0"
          style={{ color: "#5DB075" }}
        >
          <Sprout size={16} strokeWidth={2.2} />
          <ChevronRight size={14} color="hsl(var(--muted-foreground))" strokeWidth={2} />
        </button>
      </div>

      {/* Next milestone */}
      {nextM && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderTop: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#EEF4E9", border: "1px solid rgba(143,168,124,0.3)" }}
          >
            <nextM.Icon size={18} color="#5DB075" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-bold" style={{ color: "#5DB075", letterSpacing: "0.12em" }}>NEXT UNLOCK</span>
              <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {daysToGo} day{daysToGo !== 1 ? "s" : ""} to go
              </span>
            </div>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{nextM.label}</p>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(93,176,117,0.18)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: "#5DB075" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Steps panel ──────────────────────────────────────────────────────────
  const StepsPanel = (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          today's ritual
        </p>
        <h1 className="text-4xl font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.5px" }}>
          daily check
        </h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          three steps, morning to night.
        </p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
        {STEPS.map((step) => {
          const { Icon } = step;
          const isDone = !!done[step.key];
          return (
            <motion.button
              key={step.key}
              variants={cardAnim}
              type="button"
              onClick={() => navigate(step.path)}
              whileHover={{ scale: 1.012 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left rounded-2xl border p-5 flex items-center gap-4 relative overflow-hidden"
              style={{
                backgroundColor: isDone ? step.color + "0D" : "hsl(var(--card))",
                borderColor: isDone ? step.color + "40" : "hsl(var(--border))",
              }}
            >
              {isDone && (
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: step.color, opacity: 0.04 }} />
              )}
              <div
                className="shrink-0 w-[52px] h-[52px] rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: step.color + (isDone ? "28" : "18"),
                  border: `1px solid ${step.color}${isDone ? "55" : "33"}`,
                }}
              >
                <Icon size={22} style={{ color: step.color }} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono font-bold" style={{ color: step.color }}>{step.number}</span>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {step.subtitle}
                  </span>
                </div>
                <p
                  className="font-semibold text-base leading-snug"
                  style={{
                    color: isDone ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                >
                  {step.title}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {step.description}
                </p>
              </div>
              <AnimatePresence mode="wait">
                {isDone ? (
                  <motion.div
                    key="tick"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: step.color }}
                  >
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span key="arrow" className="shrink-0 text-lg" style={{ color: "hsl(var(--muted-foreground))" }}>›</span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {completedCount === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 rounded-2xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "rgba(93,176,117,0.1)", border: "1px solid rgba(93,176,117,0.3)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#5DB075" }}
            >
              <Check size={16} color="#fff" strokeWidth={2.8} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#3A7A50" }}>All done for today</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>See you tomorrow.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      <Navbar />

      {/* ── Mobile layout: single column ─────────────────────────────────── */}
      <div className="md:hidden pt-16 pb-20">
        {/* Greeting above garden */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-5 pt-2 pb-2"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            today's ritual
          </p>
          <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.3px" }}>
            {firstName
              ? `Hey, ${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} 👋`
              : "Hey there 👋"}
          </h2>
        </motion.div>

        <div className="w-full overflow-hidden" style={{ borderBottom: "1px solid hsl(var(--border))", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, backgroundColor: "hsl(var(--card))" }}>
          <GardenScene completed={completedCount} completedKeys={completedKeys} />

          <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: "#E8A44A33" }}>
              <Flame size={14} color="#C47A1B" strokeWidth={2.3} />
              <span className="text-sm font-black" style={{ color: "#6B3E0A" }}>{streak}</span>
              <span className="text-xs" style={{ color: "#8B5E1A" }}>day streak</span>
            </div>
            <div className="flex flex-1 justify-around items-end">
              {week.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.full ? "#5DB075" : i === 6 ? "transparent" : "hsl(var(--border))", border: i === 6 ? "2px solid #E8A44A" : "none" }} />
                  <span className="text-[9px]" style={{ color: i === 6 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontWeight: i === 6 ? 700 : 400 }}>{d.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/garden")} className="flex items-center gap-0.5 shrink-0" style={{ color: "#5DB075" }}>
              <Sprout size={16} strokeWidth={2.2} />
              <ChevronRight size={14} color="hsl(var(--muted-foreground))" strokeWidth={2} />
            </button>
          </div>

          {nextM && (
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EEF4E9", border: "1px solid rgba(143,168,124,0.3)" }}>
                <nextM.Icon size={18} color="#5DB075" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold" style={{ color: "#5DB075", letterSpacing: "0.12em" }}>NEXT UNLOCK</span>
                  <span className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{daysToGo} day{daysToGo !== 1 ? "s" : ""} to go</span>
                </div>
                <p className="text-sm font-semibold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{nextM.label}</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(93,176,117,0.18)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: "#5DB075" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-12 pt-6">
          {StepsPanel}
        </div>
      </div>

      {/* ── Desktop layout: centered two-column grid ──────────────────────── */}
      {/* pt-20 = fixed desktop navbar height */}
      <div className="hidden md:block pt-20">
        {/* Desktop greeting inside container */}
        <div className="max-w-5xl mx-auto px-8 pt-8 pb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              today's ritual
            </p>
            <h2 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.4px" }}>
              Hey, {firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : "there"} 👋
            </h2>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: completedCount === 3 ? "rgba(93,176,117,0.15)" : "rgba(58,46,42,0.06)",
              color:            completedCount === 3 ? "#3A7A50" : "hsl(var(--muted-foreground))",
              border: `1px solid ${completedCount === 3 ? "rgba(93,176,117,0.4)" : "hsl(var(--border))"}`,
            }}
          >
            {completedCount} / 3 done
          </span>
        </div>

        {/* Two-column grid */}
        <div className="max-w-5xl mx-auto px-8 pb-16 grid grid-cols-[1fr_1.1fr] gap-8 items-start">
          {/* Left — garden card */}
          <div className="sticky top-8">
            {GardenPanel}
          </div>

          {/* Right — header + step cards */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <h1 className="text-4xl font-bold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.5px" }}>
                daily check
              </h1>
              <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                three steps, morning to night.
              </p>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
              {STEPS.map((step) => {
                const { Icon } = step;
                const isDone = !!done[step.key];
                return (
                  <motion.button
                    key={step.key}
                    variants={cardAnim}
                    type="button"
                    onClick={() => navigate(step.path)}
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left rounded-2xl border p-5 flex items-center gap-4 relative overflow-hidden"
                    style={{
                      backgroundColor: isDone ? step.color + "0D" : "hsl(var(--card))",
                      borderColor: isDone ? step.color + "40" : "hsl(var(--border))",
                    }}
                  >
                    {isDone && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: step.color, opacity: 0.04 }} />}
                    <div
                      className="shrink-0 w-[52px] h-[52px] rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: step.color + (isDone ? "28" : "18"), border: `1px solid ${step.color}${isDone ? "55" : "33"}` }}
                    >
                      <Icon size={22} style={{ color: step.color }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: step.color }}>{step.number}</span>
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{step.subtitle}</span>
                      </div>
                      <p className="font-semibold text-base leading-snug" style={{ color: isDone ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))", textDecoration: isDone ? "line-through" : "none" }}>
                        {step.title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {step.description}
                      </p>
                    </div>
                    <AnimatePresence mode="wait">
                      {isDone ? (
                        <motion.div key="tick" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 380, damping: 18 }} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: step.color }}>
                          <Check size={14} color="#fff" strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <span key="arrow" className="shrink-0 text-lg" style={{ color: "hsl(var(--muted-foreground))" }}>›</span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </motion.div>

            <AnimatePresence>
              {completedCount === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 rounded-2xl p-5 flex items-center gap-4"
                  style={{ backgroundColor: "rgba(93,176,117,0.1)", border: "1px solid rgba(93,176,117,0.3)" }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#5DB075" }}>
                    <Check size={16} color="#fff" strokeWidth={2.8} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#3A7A50" }}>All done for today</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>See you tomorrow.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
}
