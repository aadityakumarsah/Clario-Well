/**
 * Dynamic garden scene — grows with task completion (0–3 steps done).
 * Pure SVG + CSS, no video dependency.
 */

import { motion, AnimatePresence } from "framer-motion";

interface GardenSceneProps {
  completed: number; // 0–3
}

// Flower positions [x%, stemHeight, petalColor, type]
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

// Which flowers are visible at each completion level
const FLOWERS_AT: number[] = [0, 3, 6, 8];

// Grass blade positions [x%, height, hue-shift]
const GRASS_BLADES: [number, number, number][] = Array.from({ length: 28 }, (_, i) => [
  (i / 27) * 100,
  28 + ((i * 7919) % 18),
  (i * 13) % 30 - 15,
]);

function Flower({
  x, stemH, color, type, delay,
}: {
  x: number; stemH: number; color: string; type: "daisy" | "tulip" | "poppy"; delay: number;
}) {
  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay }}
      style={{ transformOrigin: `${x}% 100%` }}
    >
      {/* stem */}
      <line
        x1={`${x}%`} y1="100%" x2={`${x}%`} y2={`calc(100% - ${stemH}px)`}
        stroke="#388E3C" strokeWidth="1.8" strokeLinecap="round"
      />
      {/* leaf */}
      <ellipse
        cx={`calc(${x}% + 6px)`} cy={`calc(100% - ${stemH * 0.55}px)`}
        rx="5" ry="2.5"
        fill="#43A047" transform={`rotate(-35, 0, 0)`}
        style={{ transformOrigin: `calc(${x}% + 6px) calc(100% - ${stemH * 0.55}px)` }}
      />
      {type === "daisy" && (
        <g style={{ transform: `translate(${x}%, calc(100% - ${stemH + 6}px))` }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse
              key={a} cx="0" cy="-7" rx="2.5" ry="5"
              fill={color} opacity="0.9"
              transform={`rotate(${a})`}
            />
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
            <ellipse
              key={a} cx="0" cy="-6" rx="4" ry="7"
              fill={color} opacity="0.85"
              transform={`rotate(${a})`}
            />
          ))}
          <circle cx="0" cy="0" r="3.5" fill="#1B5E20" />
        </g>
      )}
    </motion.g>
  );
}

export default function GardenScene({ completed }: GardenSceneProps) {
  const flowerCount = FLOWERS_AT[Math.min(completed, 3)];

  // Sky color shifts warmer/brighter with progress
  const skyTop = completed === 0
    ? "#B0C4DE" : completed === 1
    ? "#87CEEB" : completed === 2
    ? "#A8D8EA" : "#C8E6F5";
  const skyBottom = completed === 0
    ? "#D4A574" : completed === 1
    ? "#F4C882" : completed === 2
    ? "#FFD59E" : "#FFE8B0";

  // Grass gets greener
  const grassColor = completed === 0
    ? "#5D8A52" : completed === 1
    ? "#4CAF50" : completed === 2
    ? "#45A049" : "#388E3C";
  const grassDark = completed === 0
    ? "#3B6B30" : completed === 1
    ? "#2E7D32" : completed === 2
    ? "#2E7D32" : "#1B5E20";

  // Tree canopy grows
  const treeRadius = 52 + completed * 8;

  return (
    <div className="w-full relative overflow-hidden" style={{ height: "clamp(220px, 42vw, 380px)" }}>
      <svg
        viewBox="0 0 800 380"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop}>
              <animate attributeName="stop-color" values={skyTop} dur="1s" />
            </stop>
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={grassColor} />
            <stop offset="100%" stopColor={grassDark} />
          </linearGradient>
          <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#795548" />
          </linearGradient>
          <filter id="blur-soft">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Sky */}
        <motion.rect
          width="800" height="380" fill="url(#sky)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Sun */}
        <circle cx="680" cy="55" r={16 + completed * 4} fill="#FFD54F" opacity="0.9" />
        <circle cx="680" cy="55" r={22 + completed * 5} fill="#FFD54F" opacity="0.18" />

        {/* Background mountains / building silhouettes */}
        <g opacity="0.35">
          <path d="M0 200 L60 130 L120 170 L200 90 L280 145 L380 80 L460 130 L550 100 L650 140 L750 110 L800 130 L800 210 L0 210Z" fill="#607D8B" />
          <path d="M0 210 L80 165 L160 185 L240 150 L320 175 L420 155 L510 170 L600 158 L700 168 L800 155 L800 215 L0 215Z" fill="#78909C" opacity="0.6" />
        </g>

        {/* Fence posts — back row (smaller) */}
        <g opacity="0.5">
          {Array.from({ length: 22 }, (_, i) => (
            <g key={i} transform={`translate(${i * 38 - 10}, 195)`}>
              <rect x="0" y="0" width="7" height="55" rx="1" fill="#D4A96A" />
              <polygon points="3.5,-8 7,0 0,0" fill="#D4A96A" />
            </g>
          ))}
          <rect x="-10" y="215" width="820" height="5" rx="2" fill="#C8974F" />
          <rect x="-10" y="228" width="820" height="4" rx="2" fill="#C8974F" />
        </g>

        {/* Fence posts — front row */}
        <g>
          {Array.from({ length: 18 }, (_, i) => (
            <g key={i} transform={`translate(${i * 46 + 2}, 210)`}>
              <rect x="0" y="0" width="10" height="68" rx="1.5" fill="#E8C17A" />
              <polygon points="5,-11 10,0 0,0" fill="#E8C17A" />
              <rect x="1" y="5" width="8" height="58" rx="1" fill="#F0CA85" opacity="0.3" />
            </g>
          ))}
          <rect x="-5" y="234" width="830" height="7" rx="3" fill="#D4A56A" />
          <rect x="-5" y="248" width="830" height="5" rx="2.5" fill="#D4A56A" />
        </g>

        {/* Ground */}
        <rect x="0" y="268" width="800" height="112" fill="url(#ground)" />

        {/* Ground grass texture (subtle wavy edge) */}
        <motion.path
          d="M0 268 Q20 258 40 265 Q60 272 80 263 Q100 254 120 262 Q140 270 160 261 Q180 252 200 260 Q220 268 240 259 Q260 250 280 258 Q300 266 320 257 Q340 248 360 256 Q380 264 400 255 Q420 246 440 254 Q460 262 480 253 Q500 244 520 252 Q540 260 560 251 Q580 242 600 250 Q620 258 640 249 Q660 240 680 248 Q700 256 720 247 Q740 238 760 246 Q780 254 800 248 L800 380 L0 380Z"
          fill={grassColor}
          animate={{ fill: grassColor }}
          transition={{ duration: 1 }}
        />

        {/* Grass blades */}
        <motion.g
          animate={{ opacity: 1 }}
          initial={{ opacity: 0.6 }}
          transition={{ duration: 1 }}
        >
          {GRASS_BLADES.map(([xPct, h, hue], i) => {
            const x = (xPct / 100) * 800;
            const baseY = 268 + Math.sin(xPct * 0.3) * 4;
            return (
              <path
                key={i}
                d={`M${x} ${baseY} Q${x + 4 + hue * 0.3} ${baseY - h * 0.6} ${x + 2} ${baseY - h}`}
                stroke={i % 3 === 0 ? "#66BB6A" : i % 3 === 1 ? "#4CAF50" : grassColor}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              />
            );
          })}
        </motion.g>

        {/* Tree trunk */}
        <rect x="158" y="185" width="22" height="90" rx="4" fill="url(#treeTrunk)" />
        <rect x="162" y="205" width="8" height="40" rx="3" fill="#6D4C41" opacity="0.4" />

        {/* Tree roots */}
        <path d="M158 268 Q148 275 140 278" stroke="#5D4037" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M180 268 Q190 275 198 277" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Tree canopy shadow */}
        <ellipse cx="169" cy="175" rx={treeRadius * 0.9} ry={treeRadius * 0.85} fill="#2E7D32" opacity="0.4" />
        {/* Tree canopy main */}
        <circle cx="169" cy="168" r={treeRadius} fill={completed >= 2 ? "#43A047" : "#388E3C"} />
        {/* Canopy highlight */}
        <circle cx="155" cy="152" r={treeRadius * 0.45} fill="#4CAF50" opacity="0.5" />
        {/* Canopy sub-clusters */}
        <circle cx="200" cy="175" r={treeRadius * 0.55} fill="#388E3C" opacity="0.8" />
        <circle cx="145" cy="180" r={treeRadius * 0.5} fill="#33691E" opacity="0.7" />

        {/* Flowers (in ground layer, above grass, behind fence front) */}
        <g style={{ clipPath: "inset(0 0 0 0)" }}>
          <svg x="0" y="248" width="800" height="60" overflow="visible">
            <AnimatePresence>
              {FLOWERS.slice(0, flowerCount).map(([x, stemH, color, type], i) => (
                <Flower
                  key={i}
                  x={x} stemH={stemH} color={color} type={type}
                  delay={i * 0.12}
                />
              ))}
            </AnimatePresence>
          </svg>
        </g>

        {/* Bird — appears at 2+ completed */}
        <AnimatePresence>
          {completed >= 2 && (
            <motion.g
              key="bird"
              initial={{ x: 900, y: 0, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ x: 900, opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
            >
              <motion.g
                transform="translate(620, 88)"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Bird body */}
                <ellipse cx="0" cy="0" rx="8" ry="4" fill="#37474F" />
                {/* Wings flap */}
                <motion.path
                  d="M-6 0 Q-14 -8 -10 -12 Q-4 -6 0 -2"
                  fill="#4FC3F7"
                  animate={{ d: completed >= 3 ? "M-6 0 Q-14 -10 -10 -14 Q-4 -6 0 -2" : "M-6 0 Q-14 -6 -10 -10 Q-4 -6 0 -2" }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.path
                  d="M6 0 Q14 -8 10 -12 Q4 -6 0 -2"
                  fill="#4FC3F7"
                  animate={{ d: completed >= 3 ? "M6 0 Q14 -10 10 -14 Q4 -6 0 -2" : "M6 0 Q14 -6 10 -10 Q4 -6 0 -2" }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.1 }}
                />
                {/* Beak */}
                <path d="M8 -1 L12 0 L8 1" fill="#FF8F00" />
                {/* Eye */}
                <circle cx="6" cy="-1" r="1.2" fill="#fff" />
                <circle cx="6.3" cy="-1" r="0.6" fill="#212121" />
              </motion.g>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Butterflies at full completion */}
        <AnimatePresence>
          {completed >= 3 && (
            <>
              {[
                { x: 350, y: 195, color: "#F48FB1", delay: 0.3 },
                { x: 530, y: 210, color: "#FFD54F", delay: 0.8 },
              ].map((b, i) => (
                <motion.g
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: b.delay, duration: 0.6 }}
                >
                  <motion.g
                    style={{ transformOrigin: `${b.x}px ${b.y}px` }}
                    animate={{ x: [0, 15, -10, 20, 0], y: [0, -12, 8, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
                  >
                    <motion.path
                      d={`M${b.x} ${b.y} Q${b.x - 10} ${b.y - 10} ${b.x - 6} ${b.y + 2}`}
                      fill={b.color} opacity="0.85"
                      animate={{ d: [`M${b.x} ${b.y} Q${b.x - 10} ${b.y - 10} ${b.x - 6} ${b.y + 2}`, `M${b.x} ${b.y} Q${b.x - 7} ${b.y - 14} ${b.x - 6} ${b.y + 2}`] }}
                      transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                    />
                    <motion.path
                      d={`M${b.x} ${b.y} Q${b.x + 10} ${b.y - 10} ${b.x + 6} ${b.y + 2}`}
                      fill={b.color} opacity="0.85"
                      animate={{ d: [`M${b.x} ${b.y} Q${b.x + 10} ${b.y - 10} ${b.x + 6} ${b.y + 2}`, `M${b.x} ${b.y} Q${b.x + 7} ${b.y - 14} ${b.x + 6} ${b.y + 2}`] }}
                      transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", delay: 0.1 }}
                    />
                    <circle cx={b.x} cy={b.y} r="1.5" fill="#5D4037" />
                  </motion.g>
                </motion.g>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Warm light overlay at ground — fades from orange at fence line */}
        <defs>
          <linearGradient id="warmOverlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="55%" stopColor="rgba(255,160,60,0.12)" />
            <stop offset="100%" stopColor="rgba(180,100,30,0.22)" />
          </linearGradient>
        </defs>
        <rect x="0" y="210" width="800" height="170" fill="url(#warmOverlay)" />

        {/* Bottom dark fade (blends into page #060F1E) */}
        <defs>
          <linearGradient id="darkFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="60%" stopColor="rgba(6,15,30,0.55)" />
            <stop offset="100%" stopColor="#060F1E" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="800" height="380" fill="url(#darkFade)" />
      </svg>
    </div>
  );
}
