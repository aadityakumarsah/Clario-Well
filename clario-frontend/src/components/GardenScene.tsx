/**
 * Dynamic garden scene — grows with task completion (0–3 steps done).
 * CSS keyframes for all looping ambient motion; framer-motion only for
 * completion-triggered reveals (opacity/scale/y — never SVG geometry attrs).
 */

import { motion, AnimatePresence } from "framer-motion";

interface GardenSceneProps {
  completed: number; // 0–3
}

const FLOWERS: [number, number, string, "daisy" | "tulip" | "poppy"][] = [
  [12, 38, "#F9A825", "daisy"],
  [22, 44, "#E53935", "tulip"],
  [36, 36, "#FB8C00", "poppy"],
  [48, 42, "#8E24AA", "daisy"],
  [58, 40, "#E53935", "tulip"],
  [68, 46, "#F9A825", "poppy"],
  [76, 38, "#43A047", "daisy"],
  [85, 44, "#8E24AA", "tulip"],
];
const FLOWERS_AT = [0, 3, 6, 8];

const GRASS_BLADES: [number, number, number][] = Array.from({ length: 32 }, (_, i) => [
  (i / 31) * 100,
  26 + ((i * 7919) % 20),
  (i * 13) % 30 - 15,
]);

// [startX, y, flightDuration, bodyScale, delay, wingColor, shadowY]
// shadowY = ground (268) minus bird y
const BIRDS = [
  { x: -60,  y: 68,  dur: 20, s: 1.1, delay: 0,  wc: "#90CAF9", sy: 200, sid: "b0" },
  { x: -220, y: 92,  dur: 26, s: 0.8, delay: 5,  wc: "#B0BEC5", sy: 176, sid: "b1" },
  { x: -380, y: 52,  dur: 32, s: 1.3, delay: 11, wc: "#80DEEA", sy: 216, sid: "b2" },
];

const CLOUDS = [
  { cx: -100, cy: 38,  rx: 52, ry: 18, dur: 38, opacity: 0.82 },
  { cx: 240,  cy: 58,  rx: 40, ry: 14, dur: 52, opacity: 0.60 },
  { cx: 560,  cy: 28,  rx: 68, ry: 22, dur: 30, opacity: 0.70 },
];

const FIREFLIES = Array.from({ length: 9 }, (_, i) => ({
  cx: 230 + (i * 73) % 330,
  cy: 150 + (i * 41) % 90,
  dur: 2.2 + (i * 0.4) % 2.5,
  delay: i * 0.65,
}));

function Flower({
  x, stemH, color, type, delay, swayClass,
}: {
  x: number; stemH: number; color: string;
  type: "daisy" | "tulip" | "poppy"; delay: number; swayClass: string;
}) {
  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay }}
      style={{ transformOrigin: `${x}% 100%` }}
    >
      <g className={swayClass} style={{ transformOrigin: `${x}% 100%` }}>
        <line
          x1={`${x}%`} y1="100%" x2={`${x}%`} y2={`calc(100% - ${stemH}px)`}
          stroke="#388E3C" strokeWidth="1.8" strokeLinecap="round"
        />
        <ellipse
          cx={`calc(${x}% + 6px)`} cy={`calc(100% - ${stemH * 0.55}px)`}
          rx="5" ry="2.5" fill="#43A047"
          style={{ transformOrigin: `calc(${x}% + 6px) calc(100% - ${stemH * 0.55}px)` }}
        />
        {type === "daisy" && (
          <g style={{ transform: `translate(${x}%, calc(100% - ${stemH + 6}px))` }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <ellipse key={a} cx="0" cy="-7" rx="2.5" ry="5" fill={color} opacity="0.9" transform={`rotate(${a})`} />
            ))}
            <circle cx="0" cy="0" r="4" fill="#FFF9C4" />
          </g>
        )}
        {type === "tulip" && (
          <g style={{ transform: `translate(${x}%, calc(100% - ${stemH + 4}px))` }}>
            <ellipse cx="0" cy="-5" rx="5" ry="8" fill={color} opacity="0.9" />
            <ellipse cx="-4" cy="-4" rx="4" ry="7" fill={color} opacity="0.7" transform="rotate(-20)" />
            <ellipse cx="4" cy="-4" rx="4" ry="7" fill={color} opacity="0.7" transform="rotate(20)" />
          </g>
        )}
        {type === "poppy" && (
          <g style={{ transform: `translate(${x}%, calc(100% - ${stemH + 5}px))` }}>
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse key={a} cx="0" cy="-6" rx="4" ry="7" fill={color} opacity="0.85" transform={`rotate(${a})`} />
            ))}
            <circle cx="0" cy="0" r="3.5" fill="#1B5E20" />
          </g>
        )}
      </g>
    </motion.g>
  );
}

// A single bird group (body + wings + shadow) that CSS-animates across the sky
function Bird({ x, y, dur, s, delay, wc, sy, sid }: typeof BIRDS[0]) {
  const bodyW = 8 * s, bodyH = 3.5 * s;
  const wLen = 13 * s, wH = 9 * s;
  return (
    <>
      {/* Ground shadow travels with the bird */}
      <g style={{
        animation: `fly-${sid} ${dur}s linear ${delay}s infinite`,
        transformOrigin: "0 0",
      }}>
        <ellipse
          cx={x} cy={268}
          rx={12 * s} ry={3 * s}
          fill="rgba(0,0,0,0.13)"
          style={{ filter: "blur(2px)" }}
        />
      </g>

      {/* Bird */}
      <g style={{
        animation: `fly-${sid} ${dur}s linear ${delay}s infinite`,
        transformOrigin: "0 0",
      }}>
        <g style={{
          transform: `translate(${x}px, ${y}px)`,
          animation: `bird-bob ${2.4 + delay * 0.1}s ease-in-out infinite alternate`,
        }}>
          {/* Left wing */}
          <path
            d={`M 0 0 Q ${-wLen} ${-wH * 0.3} ${-wLen * 0.65} ${-wH}`}
            fill={wc} opacity="0.9"
            style={{
              transformBox: "fill-box",
              transformOrigin: "0% 100%",
              animation: `wing-l ${0.48 + delay * 0.02}s ease-in-out infinite alternate`,
            }}
          />
          {/* Right wing */}
          <path
            d={`M 0 0 Q ${wLen} ${-wH * 0.3} ${wLen * 0.65} ${-wH}`}
            fill={wc} opacity="0.9"
            style={{
              transformBox: "fill-box",
              transformOrigin: "0% 100%",
              animation: `wing-r ${0.48 + delay * 0.02}s ease-in-out infinite alternate`,
            }}
          />
          {/* Body */}
          <ellipse cx="0" cy="0" rx={bodyW} ry={bodyH} fill="#37474F" />
          {/* Beak */}
          <polygon
            points={`${bodyW} -1 ${bodyW + 5 * s} 0 ${bodyW} 1`}
            fill="#FF8F00"
          />
          {/* Eye */}
          <circle cx={bodyW * 0.7} cy={-bodyH * 0.4} r={1.2 * s} fill="#fff" />
          <circle cx={bodyW * 0.75} cy={-bodyH * 0.4} r={0.65 * s} fill="#212121" />
          {/* Tail */}
          <path
            d={`M ${-bodyW} 0 Q ${-bodyW - 8 * s} ${bodyH * 1.5} ${-bodyW - 5 * s} ${-bodyH}`}
            fill="#455A64" opacity="0.7"
          />
        </g>
      </g>
    </>
  );
}

// Fluffy cloud shape (stacked ellipses)
function Cloud({ cx, cy, rx, ry, dur, opacity, idx }: typeof CLOUDS[0] & { idx: number }) {
  return (
    <g
      opacity={opacity}
      style={{ animation: `cloud-${idx} ${dur}s linear infinite` }}
    >
      <ellipse cx={cx} cy={cy + ry * 0.4} rx={rx * 0.55} ry={ry * 0.7} fill="white" />
      <ellipse cx={cx + rx * 0.3} cy={cy} rx={rx * 0.45} ry={ry * 0.85} fill="white" />
      <ellipse cx={cx - rx * 0.25} cy={cy + ry * 0.1} rx={rx * 0.45} ry={ry * 0.75} fill="white" />
      <ellipse cx={cx} cy={cy + ry * 0.5} rx={rx} ry={ry * 0.6} fill="white" />
    </g>
  );
}

export default function GardenScene({ completed }: GardenSceneProps) {
  const flowerCount = FLOWERS_AT[Math.min(completed, 3)];

  const skyTop    = completed === 0 ? "#8BA5C2" : completed === 1 ? "#5B9BD5" : completed === 2 ? "#6EC6EA" : "#89D4F5";
  const skyBottom = completed === 0 ? "#D4A574" : completed === 1 ? "#F4C882" : completed === 2 ? "#FFD59E" : "#FFF0B0";
  const grassColor = completed === 0 ? "#5D8A52" : completed === 1 ? "#4CAF50" : completed === 2 ? "#45A049" : "#388E3C";
  const grassDark  = completed === 0 ? "#3B6B30" : completed === 1 ? "#2E7D32" : completed === 2 ? "#2E7D32" : "#1B5E20";
  const treeRadius = 52 + completed * 8;

  // CSS keyframes for all looping ambient motion
  const css = `
    /* Clouds drift right then wrap */
    @keyframes cloud-0 { 0% { transform: translateX(0px); } 100% { transform: translateX(920px); } }
    @keyframes cloud-1 { 0% { transform: translateX(0px); } 100% { transform: translateX(920px); } }
    @keyframes cloud-2 { 0% { transform: translateX(0px); } 100% { transform: translateX(920px); } }

    /* Birds fly across screen then loop from left */
    @keyframes fly-b0 { 0% { transform: translateX(0px); } 100% { transform: translateX(960px); } }
    @keyframes fly-b1 { 0% { transform: translateX(0px); } 100% { transform: translateX(960px); } }
    @keyframes fly-b2 { 0% { transform: translateX(0px); } 100% { transform: translateX(960px); } }

    /* Bird bob (vertical float) */
    @keyframes bird-bob { from { transform: translateY(0px); } to { transform: translateY(-6px); } }

    /* Wing flap — left wing rotates up */
    @keyframes wing-l { from { transform: rotate(10deg); } to { transform: rotate(-35deg); } }
    /* Right wing mirrors */
    @keyframes wing-r { from { transform: rotate(-10deg); } to { transform: rotate(35deg); } }

    /* Grass sway classes */
    @keyframes sway-a { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(2.5deg); } }
    @keyframes sway-b { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-2deg); } }
    @keyframes sway-c { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(3deg); } }

    .sway-a { animation: sway-a 3.2s ease-in-out infinite; }
    .sway-b { animation: sway-b 2.8s ease-in-out infinite; }
    .sway-c { animation: sway-c 3.8s ease-in-out 0.4s infinite; }

    /* Sun glow pulse */
    @keyframes sun-pulse { 0%,100% { opacity: 0.18; r: 24px; } 50% { opacity: 0.30; r: 28px; } }
    @keyframes sun-ray   { 0%,100% { opacity: 0.55; } 50% { opacity: 0.9; } }

    /* Fireflies */
    @keyframes firefly { 0%,100% { opacity: 0; transform: translate(0px,0px); }
                         40%      { opacity: 0.95; transform: translate(5px,-6px); }
                         70%      { opacity: 0.6;  transform: translate(-4px,-2px); } }

    /* Tree canopy sway */
    @keyframes canopy-sway { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(1.2deg); } }
    .canopy-sway { animation: canopy-sway 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 169px 265px; }
  `;

  return (
    <div className="w-full relative overflow-hidden" style={{ height: "clamp(220px, 42vw, 380px)" }}>
      <svg
        viewBox="0 0 800 380"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{css}</style>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
          <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={grassColor} />
            <stop offset="100%" stopColor={grassDark} />
          </linearGradient>
          <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#5D4037" />
            <stop offset="100%" stopColor="#795548" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFD54F" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0" />
          </radialGradient>
          <filter id="blur-soft"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="blur-xs"><feGaussianBlur stdDeviation="0.8" /></filter>
        </defs>

        {/* ── Sky ─────────────────────────────────────────────── */}
        <motion.rect width="800" height="380" fill="url(#sky-grad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} />

        {/* ── Sun + glow rings ────────────────────────────────── */}
        <circle cx="680" cy="54" r={42 + completed * 6} fill="url(#sunGlow)"
          style={{ animation: "sun-pulse 3.5s ease-in-out infinite" }} />
        {/* sun rays */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => (
          <line key={i}
            x1={680 + Math.cos(a * Math.PI / 180) * (20 + completed * 4)}
            y1={54  + Math.sin(a * Math.PI / 180) * (20 + completed * 4)}
            x2={680 + Math.cos(a * Math.PI / 180) * (28 + completed * 5)}
            y2={54  + Math.sin(a * Math.PI / 180) * (28 + completed * 5)}
            stroke="#FFD54F" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
            style={{ animation: `sun-ray ${2.5 + i * 0.1}s ease-in-out ${i * 0.1}s infinite` }}
          />
        ))}
        <circle cx="680" cy="54" r={16 + completed * 3} fill="#FFD54F" opacity="0.92" />
        <circle cx="676" cy="50" r={6 + completed} fill="#FFF9C4" opacity="0.5" />

        {/* ── Clouds ──────────────────────────────────────────── */}
        {CLOUDS.map((c, i) => <Cloud key={i} idx={i} {...c} />)}

        {/* ── Background mountains ────────────────────────────── */}
        <g opacity="0.3">
          <path d="M0 200 L60 130 L120 170 L200 90 L280 145 L380 80 L460 130 L550 100 L650 140 L750 110 L800 130 L800 215 L0 215Z" fill="#607D8B" />
          <path d="M0 210 L80 165 L160 185 L240 150 L320 175 L420 155 L510 170 L600 158 L700 168 L800 155 L800 220 L0 220Z" fill="#78909C" opacity="0.55" />
        </g>

        {/* ── Birds (with ground shadows) ─────────────────────── */}
        <AnimatePresence>
          {completed >= 1 && BIRDS.map((b, i) => (
            <motion.g key={b.sid}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.6, duration: 0.8 }}
            >
              <Bird {...b} />
            </motion.g>
          ))}
        </AnimatePresence>

        {/* ── Fence back row ──────────────────────────────────── */}
        <g opacity="0.45">
          {Array.from({ length: 22 }, (_, i) => (
            <g key={i} transform={`translate(${i * 38 - 10}, 195)`}>
              <rect x="0" y="0" width="7" height="55" rx="1" fill="#D4A96A" />
              <polygon points="3.5,-8 7,0 0,0" fill="#D4A96A" />
            </g>
          ))}
          <rect x="-10" y="215" width="820" height="5" rx="2" fill="#C8974F" />
          <rect x="-10" y="228" width="820" height="4" rx="2" fill="#C8974F" />
        </g>

        {/* ── Ground ──────────────────────────────────────────── */}
        <rect x="0" y="268" width="800" height="112" fill="url(#ground-grad)" />

        {/* Wavy grass edge */}
        <motion.path
          d="M0 268 Q20 258 40 265 Q60 272 80 263 Q100 254 120 262 Q140 270 160 261 Q180 252 200 260 Q220 268 240 259 Q260 250 280 258 Q300 266 320 257 Q340 248 360 256 Q380 264 400 255 Q420 246 440 254 Q460 262 480 253 Q500 244 520 252 Q540 260 560 251 Q580 242 600 250 Q620 258 640 249 Q660 240 680 248 Q700 256 720 247 Q740 238 760 246 Q780 254 800 248 L800 380 L0 380Z"
          fill={grassColor}
          animate={{ fill: grassColor }}
          transition={{ duration: 1 }}
        />

        {/* ── Grass blades with sway ───────────────────────────── */}
        {GRASS_BLADES.map(([xPct, h, hue], i) => {
          const x = (xPct / 100) * 800;
          const baseY = 268 + Math.sin(xPct * 0.3) * 4;
          const swayClass = ["sway-a", "sway-b", "sway-c"][i % 3];
          return (
            <path
              key={i}
              className={swayClass}
              d={`M${x} ${baseY} Q${x + 4 + hue * 0.3} ${baseY - h * 0.6} ${x + 2} ${baseY - h}`}
              stroke={i % 3 === 0 ? "#66BB6A" : i % 3 === 1 ? "#4CAF50" : grassColor}
              strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.75"
              style={{ transformOrigin: `${x}px ${baseY}px` }}
            />
          );
        })}

        {/* ── Tree ────────────────────────────────────────────── */}
        <rect x="158" y="185" width="22" height="90" rx="4" fill="url(#treeTrunk)" />
        <rect x="162" y="205" width="8"  height="40" rx="3" fill="#6D4C41" opacity="0.4" />
        <path d="M158 268 Q148 275 140 278" stroke="#5D4037" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M180 268 Q190 275 198 277" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
        <g className="canopy-sway">
          <ellipse cx="169" cy="175" rx={treeRadius * 0.9} ry={treeRadius * 0.85} fill="#2E7D32" opacity="0.35" />
          <circle  cx="169" cy="168" r={treeRadius} fill={completed >= 2 ? "#43A047" : "#388E3C"} />
          <circle  cx="155" cy="152" r={treeRadius * 0.45} fill="#4CAF50" opacity="0.5" />
          <circle  cx="200" cy="175" r={treeRadius * 0.55} fill="#388E3C" opacity="0.8" />
          <circle  cx="145" cy="180" r={treeRadius * 0.50} fill="#33691E" opacity="0.7" />
        </g>

        {/* ── Fence front row ─────────────────────────────────── */}
        <g>
          {Array.from({ length: 18 }, (_, i) => (
            <g key={i} transform={`translate(${i * 46 + 2}, 210)`}>
              <rect x="0" y="0" width="10" height="68" rx="1.5" fill="#E8C17A" />
              <polygon points="5,-11 10,0 0,0" fill="#E8C17A" />
              <rect x="1" y="5" width="8"  height="58" rx="1" fill="#F0CA85" opacity="0.3" />
            </g>
          ))}
          <rect x="-5" y="234" width="830" height="7" rx="3" fill="#D4A56A" />
          <rect x="-5" y="248" width="830" height="5" rx="2.5" fill="#D4A56A" />
        </g>

        {/* ── Flowers ─────────────────────────────────────────── */}
        <g>
          <svg x="0" y="248" width="800" height="60" overflow="visible">
            <AnimatePresence>
              {FLOWERS.slice(0, flowerCount).map(([x, stemH, color, type], i) => (
                <Flower
                  key={i} x={x} stemH={stemH} color={color} type={type}
                  delay={i * 0.12}
                  swayClass={["sway-a","sway-b","sway-c"][i % 3]}
                />
              ))}
            </AnimatePresence>
          </svg>
        </g>

        {/* ── Butterflies at full completion ──────────────────── */}
        <AnimatePresence>
          {completed >= 3 && (
            <>
              {[
                { x: 350, y: 195, color: "#F48FB1", delay: 0.3 },
                { x: 530, y: 210, color: "#FFD54F", delay: 0.9 },
              ].map((b, i) => (
                <motion.g key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: b.delay, duration: 0.6 }}
                >
                  <motion.g
                    style={{ transformOrigin: `${b.x}px ${b.y}px` }}
                    animate={{ x: [0, 18, -8, 22, 0], y: [0, -14, 6, -8, 0] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
                  >
                    {/* wings use opacity flicker, not d-morphing */}
                    <ellipse cx={b.x - 7} cy={b.y - 5} rx="7" ry="10" fill={b.color} opacity="0.85"
                      style={{ animation: `sway-a ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                               transformOrigin: `${b.x}px ${b.y}px` }} />
                    <ellipse cx={b.x + 7} cy={b.y - 5} rx="7" ry="10" fill={b.color} opacity="0.85"
                      style={{ animation: `sway-b ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                               transformOrigin: `${b.x}px ${b.y}px` }} />
                    <ellipse cx={b.x - 5} cy={b.y + 4} rx="4.5" ry="6" fill={b.color} opacity="0.65"
                      style={{ animation: `sway-a ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                               transformOrigin: `${b.x}px ${b.y}px` }} />
                    <ellipse cx={b.x + 5} cy={b.y + 4} rx="4.5" ry="6" fill={b.color} opacity="0.65"
                      style={{ animation: `sway-b ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                               transformOrigin: `${b.x}px ${b.y}px` }} />
                    <ellipse cx={b.x} cy={b.y} rx="2" ry="6" fill="#5D4037" />
                  </motion.g>
                </motion.g>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ── Fireflies (completed ≥ 3) ───────────────────────── */}
        <AnimatePresence>
          {completed >= 3 && FIREFLIES.map((f, i) => (
            <motion.g key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: f.delay * 0.5, duration: 1 }}
            >
              <circle cx={f.cx} cy={f.cy} r="2.8" fill="#ECFF5E" opacity="0"
                style={{ animation: `firefly ${f.dur}s ease-in-out ${f.delay}s infinite` }} />
              <circle cx={f.cx} cy={f.cy} r="5" fill="#ECFF5E" opacity="0"
                filter="url(#blur-soft)"
                style={{ animation: `firefly ${f.dur}s ease-in-out ${f.delay}s infinite` }} />
            </motion.g>
          ))}
        </AnimatePresence>

        {/* ── Overlays ─────────────────────────────────────────── */}
        <defs>
          <linearGradient id="warmOverlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="55%"  stopColor="rgba(255,160,60,0.10)" />
            <stop offset="100%" stopColor="rgba(180,100,30,0.20)" />
          </linearGradient>
          <linearGradient id="darkFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="60%"  stopColor="rgba(6,15,30,0.50)" />
            <stop offset="100%" stopColor="#060F1E" />
          </linearGradient>
        </defs>
        <rect x="0" y="210" width="800" height="170" fill="url(#warmOverlay)" />
        <rect x="0" y="0"   width="800" height="380" fill="url(#darkFade)" />
      </svg>
    </div>
  );
}
