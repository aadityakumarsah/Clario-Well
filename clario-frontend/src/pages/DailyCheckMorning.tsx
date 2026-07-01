/**
 * Morning Energy step — tap 2 water glasses to complete.
 * SVG glass: trapezoid silhouette, thick rim, animated water fill clipped inside.
 * Ported from the React Native mobile app.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Droplets, Zap, Brain, Waves, CheckCircle2 } from "lucide-react";
import { markStepDone } from "./DailyCheck";

// ─── Palette ──────────────────────────────────────────────────────────────────
const W = {
  accent:       "#1A7CB5",
  accentLight:  "#E3F2FB",
  accentBorder: "rgba(30,130,195,0.28)",
  accentMid:    "#A3CFEA",
  accentDark:   "#0E5A88",
};

// ─── SVG glass geometry (same as mobile) ─────────────────────────────────────
const GW = 120, GH = 205;
const RIM_X = 7, RIM_Y = 5, RIM_W = 106, RIM_H = 14, RIM_RX = 7;
const CAV_TOP_Y  = RIM_Y + RIM_H;          // 19
const CAV_BOT_Y  = 163;
const CAV_TOP_X1 = 14, CAV_TOP_X2 = 106;
const CAV_BOT_X1 = 27, CAV_BOT_X2 = 93;
const CAV_H      = CAV_BOT_Y - CAV_TOP_Y;  // 144
const WALL_TOP_X1 = 8,  WALL_TOP_X2 = 112;
const WALL_BOT_X1 = 22, WALL_BOT_X2 = 98;
const CLIP_D = `M ${CAV_TOP_X1} ${CAV_TOP_Y} L ${CAV_TOP_X2} ${CAV_TOP_Y} L ${CAV_BOT_X2} ${CAV_BOT_Y} L ${CAV_BOT_X1} ${CAV_BOT_Y} Z`;
const WALL_D = `M ${WALL_TOP_X1} ${CAV_TOP_Y} L ${WALL_TOP_X2} ${CAV_TOP_Y} L ${WALL_BOT_X2} ${CAV_BOT_Y} L ${WALL_BOT_X1} ${CAV_BOT_Y} Z`;
const MAX_FILL = CAV_H * 0.80;
const WAVE_W  = 340, WAVE_H = 20;
const WAVE_CTR_X = (CAV_TOP_X1 + CAV_TOP_X2) / 2;
const WAVE_INIT_X = WAVE_CTR_X - WAVE_W / 2;
const BASE_W = 52, BASE_H = 9;
const BASE_X = (GW - BASE_W) / 2;
const BASE_Y = CAV_BOT_Y + 3;

// ─── useAnimVal: simple number state animated via rAF ─────────────────────────
function useAnimVal(target: number, duration: number, delay = 0) {
  const [val, setVal] = useState(0);
  const ref = useRef<{ start: number; from: number; to: number; raf: number } | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const kick = () => {
      const from = ref.current?.to ?? 0;
      const startTime = performance.now();
      ref.current = { start: startTime, from, to: target, raf: 0 };

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(from + (target - from) * eased);
        if (t < 1) ref.current!.raf = requestAnimationFrame(tick);
      };
      ref.current.raf = requestAnimationFrame(tick);
    };
    timeout = setTimeout(kick, delay);
    return () => {
      clearTimeout(timeout);
      if (ref.current) cancelAnimationFrame(ref.current.raf);
    };
  }, [target, duration, delay]);

  return val;
}

// ─── WaterGlass ──────────────────────────────────────────────────────────────
function WaterGlass({ index, drunk, onClick }: { index: number; drunk: boolean; onClick: () => void }) {
  const fill = useAnimVal(drunk ? 1 : 0, 960);

  // Wave oscillation via CSS animation offset
  const [waveOff, setWaveOff] = useState(0);
  const waveRef = useRef<{ raf: number; t: number }>({ raf: 0, t: 0 });
  useEffect(() => {
    const loop = () => {
      waveRef.current.t += 0.0016; // ~2s cycle at 60fps
      setWaveOff(Math.sin(waveRef.current.t * Math.PI * 2) * 24);
      waveRef.current.raf = requestAnimationFrame(loop);
    };
    waveRef.current.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(waveRef.current.raf);
  }, []);

  // Bubble animation
  const [bubT, setBubT] = useState(0);
  const bubRef = useRef<number>(0);
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t = (t + 1 / (2700 / 16.67)) % 1;
      setBubT(t);
      bubRef.current = requestAnimationFrame(loop);
    };
    bubRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(bubRef.current);
  }, []);

  // Derived values
  const waterY = CAV_BOT_Y - MAX_FILL * fill;
  const waterH = MAX_FILL * fill + 50;
  const waveY  = CAV_BOT_Y - MAX_FILL * fill - WAVE_H + 7;
  const waveX  = WAVE_INIT_X + waveOff;

  // Bubble paths
  const bub1Y  = CAV_BOT_Y - 16 - (CAV_BOT_Y - 16 - (CAV_TOP_Y + 22)) * bubT;
  const bub2T  = Math.max(0, (bubT - 0) / 1);
  const bub2Y  = bubT < 0.28
    ? CAV_BOT_Y - 8 - (52 / 0.28) * bubT
    : CAV_BOT_Y - 52 - (CAV_BOT_Y - 52 - (CAV_TOP_Y + 32)) * ((bubT - 0.28) / 0.72);
  const bubO   = bubT < 0.12 ? bubT / 0.12 * 0.70
    : bubT < 0.82 ? 0.70 - (bubT - 0.12) / 0.70 * 0.28
    : 0;

  const clipId = `gc${index}`;
  const gradId = `gw${index}`;
  const glId   = `gl${index}`;

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      whileTap={drunk ? {} : { scale: 0.92 }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={drunk}
        className="relative focus:outline-none"
        style={{ width: GW, height: GH, cursor: drunk ? "default" : "pointer" }}
      >
        <svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH}`} fill="none">
          <defs>
            {/* Clip path = inner trapezoid cavity */}
            <clipPath id={clipId}>
              <path d={CLIP_D} />
            </clipPath>
            {/* Water gradient */}
            <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0"    stopColor="#083E72" stopOpacity="0.94" />
              <stop offset="0.45" stopColor="#1068AA" stopOpacity="0.82" />
              <stop offset="1"    stopColor="#3A9DD0" stopOpacity="0.62" />
            </linearGradient>
            {/* Glass body tint */}
            <linearGradient id={glId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0"   stopColor="#B5DBF4" stopOpacity="0.22" />
              <stop offset="0.5" stopColor="#E5F5FF" stopOpacity="0.06" />
              <stop offset="1"   stopColor="#B5DBF4" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Layer 1: empty glass inner tint */}
          <path d={CLIP_D} fill={`url(#${glId})`} />

          {/* Layer 2: water fill + wave + bubbles (clipped to cavity) */}
          <g clipPath={`url(#${clipId})`}>
            {/* Water body */}
            <rect
              x={CAV_TOP_X1 - 2}
              y={waterY}
              width={CAV_TOP_X2 - CAV_TOP_X1 + 4}
              height={Math.max(0, waterH)}
              fill={`url(#${gradId})`}
            />
            {/* Wave surface — light */}
            <rect
              x={waveX}
              y={waveY}
              width={WAVE_W}
              height={WAVE_H}
              rx={WAVE_H / 2}
              fill="rgba(68, 168, 222, 0.62)"
            />
            {/* Wave surface — deep */}
            <rect
              x={waveX}
              y={waveY}
              width={WAVE_W}
              height={WAVE_H * 0.55}
              rx={WAVE_H / 2}
              fill="rgba(16, 95, 168, 0.40)"
            />
            {/* Bubbles (only when filled) */}
            {drunk && (
              <>
                <circle cx={CAV_BOT_X1 + 22} cy={bub1Y} r={2.5} fill="rgba(255,255,255,0.65)" opacity={bubO} />
                <circle cx={CAV_BOT_X1 + 40} cy={bub2Y} r={1.8} fill="rgba(255,255,255,0.50)" opacity={bubO} />
              </>
            )}
          </g>

          {/* Layer 3: glass wall shell */}
          <path
            d={WALL_D}
            fill="rgba(205, 238, 255, 0.07)"
            stroke="rgba(175, 222, 248, 0.78)"
            strokeWidth={2.8}
          />

          {/* Layer 4: rim */}
          <rect
            x={RIM_X} y={RIM_Y} width={RIM_W} height={RIM_H} rx={RIM_RX}
            fill="rgba(222, 243, 255, 0.65)"
            stroke="rgba(162, 212, 244, 0.90)"
            strokeWidth={1.5}
          />
          {/* Rim inner highlight */}
          <rect
            x={RIM_X + 5} y={RIM_Y + 3} width={RIM_W - 10} height={4} rx={2}
            fill="rgba(255,255,255,0.58)"
          />

          {/* Layer 5: left shine streak */}
          <path
            d={`M ${CAV_TOP_X1 + 5} ${CAV_TOP_Y + 5} L ${CAV_BOT_X1 + 3} ${CAV_BOT_Y - 14}`}
            stroke="rgba(255,255,255,0.50)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Secondary shine */}
          <path
            d={`M ${CAV_TOP_X1 + 15} ${CAV_TOP_Y + 9} L ${CAV_TOP_X1 + 17} ${CAV_TOP_Y + 50}`}
            stroke="rgba(255,255,255,0.24)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />

          {/* Layer 6: flat base */}
          <rect
            x={BASE_X} y={BASE_Y} width={BASE_W} height={BASE_H} rx={5}
            fill="rgba(168, 208, 232, 0.65)"
            stroke="rgba(148, 196, 226, 0.80)"
            strokeWidth={1}
          />
        </svg>

        {/* Check badge over SVG */}
        <AnimatePresence>
          {drunk && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 16, delay: 0.65 }}
              className="absolute top-2 right-1 rounded-full p-0.5"
              style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
            >
              <CheckCircle2 size={22} color={W.accent} strokeWidth={2.4} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Label */}
      <div className="flex items-center gap-1.5">
        <Droplets size={13} color={drunk ? W.accent : "rgba(58,46,42,0.30)"} strokeWidth={2.2} />
        <span
          className="text-sm font-semibold"
          style={{ color: drunk ? W.accentDark : "rgba(58,46,42,0.45)" }}
        >
          Glass {index + 1}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DailyCheckMorning() {
  const navigate = useNavigate();
  const [drunk, setDrunk] = useState([false, false]);

  const tap = (i: number) => {
    if (drunk[i]) return;
    setDrunk((prev) => prev.map((v, idx) => (idx === i ? true : v)));
  };

  const drank = drunk.filter(Boolean).length;
  const both  = drunk.every(Boolean);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Back */}
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

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-6 mt-4 mb-8 rounded-[26px] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #C8E6F5 0%, #DFF0FA 50%, #F2F8FD 100%)",
          border: `1px solid ${W.accentBorder}`,
          boxShadow: "0 4px 24px rgba(26,124,181,0.10)",
        }}
      >
        <div className="p-6">
          {/* Badge */}
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.6)", border: `1px solid ${W.accentBorder}` }}
          >
            <Droplets size={22} color={W.accent} strokeWidth={2} />
          </div>

          <p className="text-[10px] tracking-[0.35em] font-bold mb-2" style={{ color: W.accent, opacity: 0.9 }}>
            01 · MORNING ENERGY
          </p>
          <h1
            className="text-4xl font-bold leading-tight mb-2.5"
            style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.6px", fontFamily: "var(--font-display)" }}
          >
            Morning<br />Hydration
          </h1>
          <p className="text-sm mb-5" style={{ color: "rgba(58,46,42,0.55)", lineHeight: 1.5 }}>
            Two glasses of water in the morning activates your metabolism and clears mental fog.
          </p>

          {/* Progress */}
          <div className="flex items-center gap-2">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                animate={{ backgroundColor: drunk[i] ? W.accent : W.accentMid + "55" }}
                transition={{ duration: 0.4 }}
                className="flex-1 h-1.5 rounded-full"
              />
            ))}
            <span className="text-xs font-bold ml-1" style={{ color: W.accentDark }}>
              {drank} of 2
            </span>
          </div>
        </div>
      </motion.div>

      {/* Glasses stage */}
      <div className="flex-1 flex flex-col items-center justify-center gap-7 px-6">
        <div className="flex items-end gap-9 justify-center">
          {drunk.map((d, i) => (
            <WaterGlass key={i} index={i} drunk={d} onClick={() => tap(i)} />
          ))}
        </div>

        {/* Completion banner / hint */}
        <AnimatePresence mode="wait">
          {both ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4 rounded-[18px] w-full max-w-sm"
              style={{
                backgroundColor: W.accentLight,
                border: `1px solid ${W.accentBorder}`,
                padding: "14px 18px",
              }}
            >
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#fff", border: `1px solid ${W.accentBorder}` }}
              >
                <Waves size={20} color={W.accent} strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-display)" }}>
                  Well hydrated!
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(58,46,42,0.55)" }}>
                  Your body thanks you.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.p key="hint" className="text-xs text-center" style={{ color: "rgba(58,46,42,0.35)" }}>
              tap each glass once you've drunk it
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-2.5 px-6 mt-6 mb-6">
        {[
          { Icon: Zap,   text: "Boosts metabolism" },
          { Icon: Brain, text: "Clears mental fog"  },
        ].map(({ Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: W.accentLight,
              border: `1px solid ${W.accentBorder}`,
              color: W.accentDark,
            }}
          >
            <Icon size={14} color={W.accent} strokeWidth={2.2} />
            {text}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-12">
        <AnimatePresence mode="wait">
          {both ? (
            <motion.button
              key="done-btn"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              onClick={() => { markStepDone("morning"); navigate("/daily-check"); }}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-85"
              style={{
                backgroundColor: W.accent,
                color: "#fff",
                boxShadow: `0 4px 18px rgba(26,124,181,0.28)`,
              }}
            >
              <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} />
              Done — back to daily check
            </motion.button>
          ) : (
            <motion.div
              key="waiting-btn"
              className="w-full py-4 rounded-2xl text-center text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: "hsl(var(--card))",
                border: "1.5px solid hsl(var(--border))",
                color: "rgba(58,46,42,0.35)",
              }}
            >
              <Droplets size={15} color="rgba(58,46,42,0.25)" strokeWidth={2} />
              drink both glasses to complete
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
