import { motion } from "framer-motion";
import { X, TrendingDown, Zap, Heart, Star, Brain } from "lucide-react";

interface DrawingReportData {
  stress_level: number;
  mental_state: string;
  drawing_analysis: string;
  stress_reduction: number;
  focus_score: number;
  calm_score: number;
  creativity_score: number;
  mood_before: number;
  mood_after: number;
  insights: string[];
  recommendation: string;
}

interface Props {
  data: DrawingReportData;
  onClose: () => void;
}

const STRESS_LABEL = (v: number) => {
  if (v <= 2) return { label: "High Stress", color: "#F87171" };
  if (v <= 4) return { label: "Elevated", color: "#FBBF24" };
  if (v <= 6) return { label: "Moderate", color: "#60A5FA" };
  if (v <= 8) return { label: "Calm", color: "#34D399" };
  return { label: "Very Calm", color: "hsl(var(--primary))" };
};

export default function DrawingReport({ data, onClose }: Props) {
  const stressInfo = STRESS_LABEL(data.stress_level);

  const BARS = [
    { label: "Stress Reduction", value: data.stress_reduction, color: "hsl(var(--primary))", Icon: TrendingDown },
    { label: "Focus",            value: data.focus_score,      color: "#60A5FA", Icon: Zap },
    { label: "Calm Level",       value: data.calm_score,       color: "#34D399", Icon: Heart },
    { label: "Creativity",       value: data.creativity_score, color: "#F472B6", Icon: Star },
  ];

  const moodPoints = [
    data.mood_before,
    data.mood_before - 0.3,
    data.mood_before + 0.6,
    (data.mood_before + data.mood_after) / 2,
    data.mood_after - 0.2,
    data.mood_after,
  ];
  const chartW = 260;
  const chartH = 72;
  const polyline = moodPoints
    .map((v, i) => {
      const x = (i / (moodPoints.length - 1)) * chartW;
      const y = chartH - (Math.min(10, Math.max(0, v)) / 10) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="max-w-lg mx-auto px-5 pt-10 pb-28">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(58,46,42,0.30)" }}>
              AI Drawing Analysis
            </p>
            <h1 className="text-2xl font-bold text-foreground">Stress Report</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(58,46,42,0.40)" }}>
              Powered by Gemini Vision
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(58,46,42,0.08)" }}>
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Stress level hero */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
          className="rounded-2xl p-6 mb-4 flex items-center gap-5"
          style={{ background: stressInfo.color + "14", border: `1px solid ${stressInfo.color}30` }}
        >
          {/* Stress dial */}
          <div className="relative shrink-0" style={{ width: 76, height: 76 }}>
            <svg viewBox="0 0 76 76" width="76" height="76">
              <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(58,46,42,0.07)" strokeWidth="6" />
              <circle
                cx="38" cy="38" r="32"
                fill="none"
                stroke={stressInfo.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - data.stress_level / 10)}`}
                transform="rotate(-90 38 38)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold" style={{ color: stressInfo.color }}>
                {data.stress_level}
              </span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground mb-0.5">{data.mental_state}</p>
            <p className="text-xs mb-1" style={{ color: stressInfo.color }}>{stressInfo.label}</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(58,46,42,0.50)" }}>
              {data.drawing_analysis}
            </p>
          </div>
        </motion.div>

        {/* Metric bars */}
        <div className="rounded-2xl p-5 mb-4"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="space-y-4">
            {BARS.map((b, i) => (
              <motion.div key={b.label}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.07 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <b.Icon className="w-3.5 h-3.5" style={{ color: b.color }} />
                    <span className="text-xs" style={{ color: "rgba(58,46,42,0.50)" }}>{b.label}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: b.color }}>{b.value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(58,46,42,0.07)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: b.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${b.value}%` }}
                    transition={{ delay: 0.22 + i * 0.07, duration: 0.8, ease: "easeOut" }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mood chart */}
        <div className="rounded-2xl p-5 mb-4"
          style={{ background: "rgba(58,46,42,0.03)", border: "1px solid rgba(58,46,42,0.07)" }}>
          <p className="text-xs mb-3" style={{ color: "rgba(58,46,42,0.40)" }}>Mood shift during session</p>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums w-8 text-right" style={{ color: "rgba(58,46,42,0.30)" }}>
              {data.mood_before}/10
            </span>
            <div className="flex-1">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 52 }}>
                <defs>
                  <linearGradient id="mgGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F87171" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>
                <polyline points={polyline} fill="none" stroke="url(#mgGrad)"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {moodPoints.map((v, i) => (
                  <circle key={i}
                    cx={(i / (moodPoints.length - 1)) * chartW}
                    cy={chartH - (Math.min(10, Math.max(0, v)) / 10) * chartH}
                    r="3"
                    fill={i === moodPoints.length - 1 ? "#34D399" : i === 0 ? "#F87171" : "rgba(58,46,42,0.40)"}
                  />
                ))}
              </svg>
            </div>
            <span className="text-xs tabular-nums w-8" style={{ color: "#34D399" }}>
              {data.mood_after}/10
            </span>
          </div>
          <div className="flex justify-between px-11 mt-0.5">
            <span className="text-[10px]" style={{ color: "rgba(58,46,42,0.20)" }}>before</span>
            <span className="text-[10px]" style={{ color: "rgba(58,46,42,0.20)" }}>after</span>
          </div>
        </div>

        {/* Gemini insights */}
        {data.insights.length > 0 && (
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
              <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(58,46,42,0.30)" }}>
                Gemini insights
              </p>
            </div>
            <div className="space-y-3">
              {data.insights.map((text, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(58,46,42,0.60)" }}>
                  <span style={{ color: "hsl(var(--primary))" }}>·</span> {text}
                </motion.p>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {data.recommendation && (
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
              Recommendation
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(58,46,42,0.70)" }}>
              {data.recommendation}
            </p>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-foreground font-semibold text-sm"
          style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}>
          Back to Relief
        </button>
      </div>
    </motion.div>
  );
}
