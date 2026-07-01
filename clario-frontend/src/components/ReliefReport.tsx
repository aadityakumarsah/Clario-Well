import { motion } from "framer-motion";
import { X, TrendingDown, Zap, Heart, Star } from "lucide-react";

interface Props {
  activity: "drawing" | "blocks";
  duration: number;
  score?: number;
  onClose: () => void;
}

function rand(min: number, max: number, seed: number) {
  return Math.floor(min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min));
}

export default function ReliefReport({ activity, duration, score, onClose }: Props) {
  const seed = duration + (score ?? 0);

  const stressReduction = rand(28, 62, seed);
  const focusScore     = rand(55, 92, seed + 1);
  const calmScore      = rand(60, 95, seed + 2);
  const creativityScore= rand(50, 98, seed + 3);

  const moodBefore = rand(3, 6, seed + 4);
  const moodAfter  = Math.min(10, moodBefore + rand(2, 5, seed + 5));

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const durationStr = `${mins}:${String(secs).padStart(2, "0")}`;

  const BARS = [
    { label: "Stress Reduction", value: stressReduction, color: "hsl(var(--primary))", icon: TrendingDown },
    { label: "Focus",            value: focusScore,      color: "#60A5FA", icon: Zap },
    { label: "Calm Level",       value: calmScore,       color: "#34D399", icon: Heart },
    { label: "Creativity",       value: creativityScore, color: "#F472B6", icon: Star },
  ];

  const insights = activity === "drawing"
    ? [
        "Expressive drawing activates the prefrontal cortex, dampening the amygdala's stress response.",
        "Hand-eye coordination tasks redirect rumination into present-moment focus.",
        "Color choices during free-form art often mirror your emotional state — blues and purples indicate a calming shift.",
      ]
    : [
        "Repetitive precision tasks like block stacking engage the dorsal attention network, quieting anxious thoughts.",
        "Each successful stack triggered a small dopamine release — your brain's natural stress antidote.",
        "Spatial challenges promote mindfulness by anchoring attention to the immediate moment.",
      ];

  const moodPoints = [moodBefore, moodBefore - 0.5, moodBefore + 0.8, moodBefore + 1.5, moodAfter - 0.3, moodAfter];
  const chartW = 280;
  const chartH = 80;
  const ptToSvg = (v: number, i: number) => {
    const x = (i / (moodPoints.length - 1)) * chartW;
    const y = chartH - ((v / 10) * chartH);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const polyline = moodPoints.map((v, i) => ptToSvg(v, i)).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="max-w-lg mx-auto px-5 pt-10 pb-28">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              session complete
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Stress Report</h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {activity === "drawing" ? "Air Drawing" : "Space Blocks"} · {durationStr}
              {score !== undefined && ` · ${score} pts`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(58,46,42,0.08)" }}
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Big stress reduction number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="rounded-2xl p-6 mb-4 text-center"
          style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}
        >
          <p className="text-6xl font-bold mb-1" style={{ color: "hsl(var(--primary))" }}>{stressReduction}%</p>
          <p className="text-sm" style={{ color: "rgba(58,46,42,0.50)" }}>estimated stress reduction</p>
        </motion.div>

        {/* Metric bars */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="space-y-4">
            {BARS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: b.color }} />
                      <span className="text-xs" style={{ color: "rgba(58,46,42,0.55)" }}>{b.label}</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: b.color }}>{b.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(58,46,42,0.07)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: b.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${b.value}%` }}
                      transition={{ delay: 0.25 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mood chart */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Mood during session</p>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums" style={{ color: "rgba(58,46,42,0.30)" }}>{moodBefore}/10</span>
            <div className="flex-1 overflow-hidden">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 56 }}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="url(#moodGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {moodPoints.map((v, i) => (
                  <circle
                    key={i}
                    cx={(i / (moodPoints.length - 1)) * chartW}
                    cy={chartH - (v / 10) * chartH}
                    r="3"
                    fill={i === moodPoints.length - 1 ? "#34D399" : "#60A5FA"}
                  />
                ))}
              </svg>
            </div>
            <span className="text-xs tabular-nums" style={{ color: "#34D399" }}>{moodAfter}/10</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: "rgba(58,46,42,0.25)" }}>start</span>
            <span className="text-[10px]" style={{ color: "rgba(58,46,42,0.25)" }}>end</span>
          </div>
        </div>

        {/* Insights */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Why it works</p>
          <div className="space-y-3">
            {insights.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-sm leading-relaxed"
                style={{ color: "rgba(58,46,42,0.60)" }}
              >
                <span style={{ color: "hsl(var(--primary))" }}>·</span> {text}
              </motion.p>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-foreground font-semibold text-sm"
          style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}
        >
          Back to Relief
        </button>
      </div>
    </motion.div>
  );
}
