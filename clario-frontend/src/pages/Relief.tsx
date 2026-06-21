import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Paintbrush, Box, Sparkles, ArrowLeft } from "lucide-react";

const CARDS = [
  {
    id: "drawing",
    title: "Air Drawing",
    subtitle: "Draw with your finger in the air",
    description: "Use your index finger as a brush. Point to draw, open palm to pause, pinch to erase.",
    icon: Paintbrush,
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    tag: "Camera · MediaPipe",
  },
  {
    id: "blocks",
    title: "Space Blocks",
    subtitle: "Stack blocks in 3D space",
    description: "A satisfying block-stacking game. Time your taps to build the tallest tower.",
    icon: Box,
    color: "#34D399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
    tag: "3D · Touch",
  },
  {
    id: null,
    title: "More coming",
    subtitle: "New activities on the way",
    description: "Bubble pop, mindful coloring, and more creative relief exercises.",
    icon: Sparkles,
    color: "#FB923C",
    bg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.15)",
    tag: "Soon",
    disabled: true,
  },
];

export default function Relief() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F0E0C" }}>
      <div className="max-w-xl mx-auto px-5 pt-14 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate("/daily-check")}
            className="flex items-center gap-1.5 mb-5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            relief
          </p>
          <h1 className="text-3xl font-bold text-white mb-1">Mindful Activities</h1>
          <p className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
            Calm your mind through creative play
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id ?? "soon"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                onClick={() => !card.disabled && card.id && navigate(`/relief/${card.id}`)}
                className="rounded-2xl p-5 flex gap-4 items-start transition-all"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  cursor: card.disabled ? "default" : "pointer",
                  opacity: card.disabled ? 0.5 : 1,
                }}
                whileHover={card.disabled ? {} : { scale: 1.015 }}
                whileTap={card.disabled ? {} : { scale: 0.985 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.color + "22", border: `1px solid ${card.color}44` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-base font-semibold text-white">{card.title}</h2>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: card.color + "22", color: card.color }}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: card.color + "cc" }}>{card.subtitle}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
