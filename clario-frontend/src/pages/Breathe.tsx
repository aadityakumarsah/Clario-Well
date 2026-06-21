/**
 * Breathe tab — emotion card picker.
 * Click a card → /breathe/[emotion] breathing session.
 */

import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

// ─── image extensions ─────────────────────────────────────────────────────────
const EXT: Record<string, string> = {
  anxiety: "png",
  anger: "jpeg",
  irritation: "jpeg",
  sadness: "png",
  fear: "png",
  worry: "jpeg",
  envy: "png",
};

// ─── emotion data ─────────────────────────────────────────────────────────────
type Emotion = { key: string; label: string; minutes: number; color: string };

const EMOTIONS: Emotion[] = [
  { key: "anxiety",   label: "Anxiety",   minutes: 2, color: "#6B3FC7" },
  { key: "anger",     label: "Anger",     minutes: 3, color: "#B84A16" },
  { key: "irritation",label: "Irritation",minutes: 3, color: "#265C28" },
  { key: "sadness",   label: "Sadness",   minutes: 3, color: "#163464" },
  { key: "fear",      label: "Fear",      minutes: 3, color: "#1A4420" },
  { key: "worry",     label: "Worry",     minutes: 4, color: "#42340C" },
  { key: "envy",      label: "Envy",      minutes: 3, color: "#163448" },
];

// ─── card heights — alternating columns ───────────────────────────────────────
const LEFT_H  = [200, 165, 190, 220];
const RIGHT_H = [220, 185, 170];

// ─── card ─────────────────────────────────────────────────────────────────────
function EmotionCard({ emotion, height }: { emotion: Emotion; height: number }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/breathe/${emotion.key}`)}
      className="relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[0.97] hover:opacity-90 active:scale-95 w-full"
      style={{
        height,
        borderColor: emotion.color + "55",
      }}
    >
      {/* Background image */}
      <img
        src={`/breadth/${emotion.key}.${EXT[emotion.key] ?? "png"}`}
        alt={emotion.label}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Colour tint overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: emotion.color, opacity: 0.18 }}
      />

      {/* Bottom band */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ backgroundColor: "rgba(4,10,22,0.72)" }}
      />

      {/* Text */}
      <div className="absolute bottom-3 left-3 right-2">
        <p className="text-white text-base font-bold tracking-tight mb-1.5" style={{ letterSpacing: "-0.2px" }}>
          {emotion.label}
        </p>
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{
            backgroundColor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.3px",
          }}
        >
          {emotion.minutes} min
        </span>
      </div>
    </button>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function Breathe() {
  const leftCol  = EMOTIONS.filter((_, i) => i % 2 === 0);
  const rightCol = EMOTIONS.filter((_, i) => i % 2 === 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#060F1E" }}>
      <Navbar />

      <div className="pt-28 pb-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-1">
          <h1 className="text-white text-3xl font-bold" style={{ letterSpacing: "-0.5px" }}>
            breathe
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.42)", letterSpacing: "0.1px" }}>
            what do you want to release today?
          </p>
        </div>

        {/* Masonry grid — two columns */}
        <div className="flex gap-2.5 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-2.5 flex-1">
            {leftCol.map((e, i) => (
              <EmotionCard key={e.key} emotion={e} height={LEFT_H[i] ?? 190} />
            ))}
          </div>

          {/* Right column — offset for stagger */}
          <div className="flex flex-col gap-2.5 flex-1 mt-7">
            {rightCol.map((e, i) => (
              <EmotionCard key={e.key} emotion={e} height={RIGHT_H[i] ?? 200} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
