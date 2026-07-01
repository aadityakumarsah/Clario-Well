/**
 * Night Summary — prompt to share the day with the voice agent, routes to Dashboard.
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mic } from "lucide-react";
import { markStepDone } from "./DailyCheck";

const ACCENT = "hsl(var(--primary))";

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function DailyCheckNight() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="px-6 pt-10 pb-2">
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

      {/* Main content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-sm w-full flex flex-col items-center gap-6"
        >
          {/* Glowing mic icon */}
          <motion.div variants={fadeUp} className="relative">
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ backgroundColor: ACCENT, opacity: 0.22, transform: "scale(1.6)" }}
            />
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: ACCENT + "22", border: `1.5px solid ${ACCENT}55` }}
            >
              <Mic className="w-8 h-8" style={{ color: ACCENT }} />
            </motion.div>
          </motion.div>

          {/* Label */}
          <motion.p
            variants={fadeUp}
            className="text-[10px] uppercase tracking-[0.35em]"
            style={{ color: ACCENT, opacity: 0.75 }}
          >
            03 · night summary
          </motion.p>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            className="text-3xl font-bold text-foreground leading-snug"
            style={{ letterSpacing: "-0.4px" }}
          >
            Release the day
          </motion.h1>

          {/* Body copy */}
          <motion.p
            variants={fadeUp}
            className="text-sm leading-relaxed"
            style={{ color: "rgba(58,46,42,0.45)" }}
          >
            Share your whole day with your voice agent — what happened, how it felt, what's still sitting with you.
            Nothing is too small or too messy.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-sm leading-relaxed"
            style={{ color: "rgba(58,46,42,0.28)" }}
          >
            Your voice agent is waiting on the dashboard. Tap below to start a night reflection.
          </motion.p>

          {/* CTA */}
          <motion.button
            variants={fadeUp}
            type="button"
            onClick={() => { markStepDone("night"); navigate("/dashboard"); }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full mt-2 py-4 rounded-2xl text-foreground font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-85"
            style={{ backgroundColor: ACCENT }}
          >
            <Mic className="w-4 h-4" />
            Start night reflection
          </motion.button>

          {/* Skip */}
          <motion.button
            variants={fadeUp}
            type="button"
            onClick={() => navigate("/daily-check")}
            className="text-xs transition-opacity hover:opacity-60"
            style={{ color: "rgba(58,46,42,0.25)" }}
          >
            maybe later
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
