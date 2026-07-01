/**
 * Morning Energy step — tap 2 water glasses to complete.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { markStepDone } from "./DailyCheck";

const ACCENT = "#E8A44A";

function WaterGlass({ index, drunk, onClick }: { index: number; drunk: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={drunk}
      whileTap={drunk ? {} : { scale: 0.93 }}
      className="flex flex-col items-center gap-3 select-none"
    >
      {/* Glass SVG */}
      <div className="relative w-28 h-36">
        {/* Glass outline */}
        <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
          {/* Outer glass shape */}
          <path
            d="M10 8 L14 92 Q14 96 20 96 L60 96 Q66 96 66 92 L70 8 Z"
            stroke="rgba(58,46,42,0.25)"
            strokeWidth="2"
            fill="rgba(58,46,42,0.04)"
          />

          {/* Water fill — animates from bottom */}
          <clipPath id={`fill-${index}`}>
            <rect x="0" y="0" width="80" height="100" />
          </clipPath>
          <motion.path
            d="M14.5 88 L17 92 Q17 95 20 95 L60 95 Q63 95 63 92 L65.5 88 Z"
            fill={ACCENT}
            fillOpacity="0.15"
            initial={false}
            animate={drunk ? { fillOpacity: 0.55 } : { fillOpacity: 0.08 }}
            transition={{ duration: 0.6 }}
          />
          <motion.rect
            x="14"
            y="20"
            width="52"
            height="72"
            rx="2"
            fill={ACCENT}
            initial={{ scaleY: 0, originY: 1 }}
            animate={drunk ? { scaleY: 1 } : { scaleY: 0 }}
            style={{ transformOrigin: "50% 100%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            fillOpacity="0.35"
            clipPath={`url(#fill-${index})`}
          />

          {/* Shine */}
          <line x1="22" y1="16" x2="20" y2="80" stroke="rgba(58,46,42,0.12)" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* Check overlay */}
        <AnimatePresence>
          {drunk && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: ACCENT }}
              >
                <Check className="w-5 h-5 text-foreground" strokeWidth={3} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <p className="text-sm font-medium" style={{ color: drunk ? ACCENT : "rgba(58,46,42,0.40)" }}>
        Glass {index + 1}
      </p>
    </motion.button>
  );
}

export default function DailyCheckMorning() {
  const navigate = useNavigate();
  const [drunk, setDrunk] = useState([false, false]);

  const tap = (i: number) => {
    if (drunk[i]) return;
    setDrunk((prev) => prev.map((v, idx) => (idx === i ? true : v)));
  };

  const both = drunk.every(Boolean);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 pt-10 pb-2">
        <button
          type="button"
          onClick={() => navigate("/daily-check")}
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "rgba(58,46,42,0.40)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          back
        </button>
      </div>

      {/* Header */}
      <div className="px-6 mt-6 mb-2">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: ACCENT, opacity: 0.8 }}>
          01 · morning energy
        </p>
        <h1 className="text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.4px" }}>
          Hydrate
        </h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(58,46,42,0.38)" }}>
          Tap each glass once you've drunk it.
        </p>
      </div>

      {/* Glasses */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6">
        <div className="flex items-end gap-16 justify-center">
          {drunk.map((d, i) => (
            <WaterGlass key={i} index={i} drunk={d} onClick={() => tap(i)} />
          ))}
        </div>

        {/* Ripple progress dots */}
        <div className="flex gap-2.5 items-center">
          {drunk.map((d, i) => (
            <motion.div
              key={i}
              animate={{ scale: d ? [1, 1.4, 1] : 1, backgroundColor: d ? ACCENT : "rgba(58,46,42,0.12)" }}
              transition={{ duration: 0.4 }}
              className="w-2.5 h-2.5 rounded-full"
            />
          ))}
        </div>

        {/* Completion text */}
        <AnimatePresence>
          {both && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-center"
              style={{ color: "rgba(58,46,42,0.45)" }}
            >
              Your body thanks you. 💧
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12">
        <AnimatePresence>
          {both ? (
            <motion.button
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              onClick={() => { markStepDone("morning"); navigate("/daily-check"); }}
              className="w-full py-4 rounded-2xl text-foreground font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: ACCENT }}
            >
              Done — back to daily check
            </motion.button>
          ) : (
            <motion.div
              key="waiting"
              className="w-full py-4 rounded-2xl text-center text-sm font-medium"
              style={{
                backgroundColor: "rgba(58,46,42,0.04)",
                border: "1px solid rgba(58,46,42,0.08)",
                color: "rgba(58,46,42,0.20)",
              }}
            >
              tap both glasses to complete
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
