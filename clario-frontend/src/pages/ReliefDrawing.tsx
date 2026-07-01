/**
 * Air Drawing — MediaPipe Hands + canvas
 * Gesture map:
 *   index up, others curled  → draw (pen down)
 *   open palm / all fingers  → move cursor only (pen up)
 *   pinch (thumb ≈ index)    → erase mode
 * Submit button captures canvas → Gemini Vision analyzes stress from strokes
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Undo2, Download, Send } from "lucide-react";
import DrawingReport from "../components/DrawingReport";
import PremiumGate from "@/components/PremiumGate";

declare const Hands: any;
declare const Camera: any;

const COLORS = ["#A78BFA", "#60A5FA", "#34D399", "#F472B6", "#FBBF24", "#F87171", "#FFFFFF"];
const SESSION_SECONDS = 3 * 60;

function isIndexPointing(lm: any[]): boolean {
  const indexUp = lm[8].y < lm[6].y;
  const middleDown = lm[12].y > lm[10].y;
  const ringDown = lm[16].y > lm[14].y;
  const pinkyDown = lm[20].y > lm[18].y;
  return indexUp && middleDown && ringDown && pinkyDown;
}

function isPinching(lm: any[], threshold = 0.07): boolean {
  const dx = lm[4].x - lm[8].x;
  const dy = lm[4].y - lm[8].y;
  return Math.hypot(dx, dy) < threshold;
}

function ReliefDrawingInner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);

  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState<"idle" | "draw" | "erase">("idle");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const colorRef = useRef(color);
  const brushRef = useRef(brushSize);
  const prevRef = useRef<{ x: number; y: number } | null>(null);
  const frameCountRef = useRef(0);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);

  // Timer — keeps going even after submit
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((e) => (e < SESSION_SECONDS ? e + 1 : e));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 30) historyRef.current.shift();
  }, []);

  const undo = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    canvas.getContext("2d")!.putImageData(historyRef.current.pop()!, 0, 0);
  };

  const clear = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    saveHistory();
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const download = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "air-drawing.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Capture canvas as PNG and send to backend for Gemini analysis
  const submit = async () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    // Stop camera to free resources
    cameraRef.current?.stop();
    handsRef.current?.close();

    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      // Flatten + resize to max 800px (keeps payload small for Gemini)
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(canvas.width, canvas.height));
      const flat = document.createElement("canvas");
      flat.width = Math.round(canvas.width * scale);
      flat.height = Math.round(canvas.height * scale);
      const fCtx = flat.getContext("2d")!;
      fCtx.fillStyle = "#0A0A0F";
      fCtx.fillRect(0, 0, flat.width, flat.height);
      fCtx.drawImage(canvas, 0, 0, flat.width, flat.height);

      const dataUrl = flat.toDataURL("image/png");

      const BASE = (import.meta.env.VITE_BACKEND_BASE_URL as string) ?? "http://localhost:8000";
      const res = await fetch(`${BASE}/relief/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setReportData(data);
    } catch (e: any) {
      setAnalyzeError(e.message ?? "Analysis failed");
      setAnalyzing(false);
    }
  };

  // MediaPipe Hands setup
  useEffect(() => {
    if (reportData) return;
    const video = videoRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!video || !drawCanvas) return;

    const resize = () => {
      drawCanvas.width = window.innerWidth;
      drawCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    if (typeof Hands === "undefined" || typeof Camera === "undefined") return;

    const hands = new Hands({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    handsRef.current = hands;
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.6 });

    let lastSaveAt = 0;
    hands.onResults((results: any) => {
      if (!results.multiHandLandmarks?.length) {
        prevRef.current = null;
        setCursor(null);
        setMode("idle");
        return;
      }
      const lm = results.multiHandLandmarks[0];
      const x = (1 - lm[8].x) * window.innerWidth;
      const y = lm[8].y * window.innerHeight;
      setCursor({ x, y });

      const pinching = isPinching(lm);
      const pointing = !pinching && isIndexPointing(lm);
      const ctx = drawCanvas.getContext("2d")!;

      if (pinching) {
        setMode("erase");
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        prevRef.current = null;
      } else if (pointing) {
        setMode("draw");
        frameCountRef.current++;
        if (frameCountRef.current - lastSaveAt > 40) { saveHistory(); lastSaveAt = frameCountRef.current; }
        if (prevRef.current) {
          ctx.beginPath();
          ctx.moveTo(prevRef.current.x, prevRef.current.y);
          ctx.lineTo(x, y);
          ctx.strokeStyle = colorRef.current;
          ctx.lineWidth = brushRef.current;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
        prevRef.current = { x, y };
      } else {
        setMode("idle");
        prevRef.current = null;
      }
    });

    let stopped = false;
    const camera = new Camera(video, {
      onFrame: async () => {
        if (stopped) return;
        try { await hands.send({ image: video }); } catch { /* ignore post-close frames */ }
      },
      width: 1280, height: 720,
    });
    cameraRef.current = camera;
    camera.start().then(() => setCameraReady(true));

    return () => {
      stopped = true;
      camera.stop();
      // Defer close by one tick so any in-flight onFrame resolves first
      setTimeout(() => { try { hands.close(); } catch { /* already closed */ } }, 50);
      window.removeEventListener("resize", resize);
    };
  }, [reportData]);

  const timeLeft = SESSION_SECONDS - elapsed;
  const timeStr = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;
  const progress = Math.min(1, elapsed / SESSION_SECONDS);

  // Show Gemini report
  if (reportData) return <DrawingReport data={reportData} onClose={() => navigate("/relief")} />;

  // Analyzing overlay
  if (analyzing) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "#0A0A0F" }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
          <div className="absolute inset-2 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#60A5FA", borderTopColor: "transparent", animationDirection: "reverse", animationDuration: "0.8s" }} />
        </div>
        <p className="text-foreground font-semibold">Analyzing your drawing…</p>
        <p className="text-xs" style={{ color: "rgba(58,46,42,0.40)" }}>Gemini is reading your strokes</p>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* Camera feed (mirrored) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)", opacity: cameraReady ? 0.3 : 0 }}
        muted playsInline
      />

      {/* Drawing canvas */}
      <canvas ref={drawCanvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }} />

      {/* Camera loading */}
      <AnimatePresence>
        {!cameraReady && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <div className="w-8 h-8 rounded-full border-2 animate-spin mb-3"
              style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "rgba(58,46,42,0.50)" }}>Starting camera…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finger cursor */}
      {cursor && (
        <motion.div
          className="absolute pointer-events-none z-20 rounded-full"
          style={{
            left: cursor.x, top: cursor.y, x: "-50%", y: "-50%",
            width: mode === "erase" ? 44 : 16,
            height: mode === "erase" ? 44 : 16,
            border: `2px solid ${mode === "draw" ? color : mode === "erase" ? "#F87171" : "rgba(58,46,42,0.50)"}`,
            backgroundColor: mode === "draw" ? color + "44" : "transparent",
            boxShadow: mode === "draw" ? `0 0 12px ${color}88` : "none",
          }}
          animate={{ scale: mode === "draw" ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.3, repeat: mode === "draw" ? Infinity : 0 }}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-3"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,15,0.88) 0%, transparent 100%)" }}>
        <button onClick={() => navigate("/relief")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(58,46,42,0.08)" }}>
          <X className="w-4 h-4 text-foreground" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-foreground text-sm font-semibold tabular-nums">{timeStr}</span>
          <div className="w-24 h-1 rounded-full mt-1" style={{ background: "rgba(58,46,42,0.10)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: "hsl(var(--primary))" }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={undo} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(58,46,42,0.08)" }}>
            <Undo2 className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={clear} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(58,46,42,0.08)" }}>
            <Trash2 className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={download} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(58,46,42,0.08)" }}>
            <Download className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(to top, rgba(10,10,15,0.92) 0%, transparent 100%)" }}>

        <p className="text-center text-xs mb-3" style={{ color: "rgba(58,46,42,0.35)" }}>
          {mode === "draw" ? "✏️ Drawing" : mode === "erase" ? "🫥 Erasing" : "☝️ Point to draw · Pinch to erase"}
        </p>

        {/* Color palette */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} className="rounded-full transition-all"
              style={{
                width: color === c ? 28 : 22, height: color === c ? 28 : 22,
                backgroundColor: c,
                border: color === c ? "2px solid white" : "2px solid transparent",
                boxShadow: color === c ? `0 0 10px ${c}88` : "none",
              }} />
          ))}
        </div>

        {/* Brush + Submit row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[3, 5, 9, 15].map((s) => (
              <button key={s} onClick={() => setBrushSize(s)}
                className="rounded-full flex items-center justify-center transition-all"
                style={{
                  width: 32, height: 32,
                  background: brushSize === s ? "rgba(167,139,250,0.2)" : "rgba(58,46,42,0.06)",
                  border: `1px solid ${brushSize === s ? "hsl(var(--primary) / 0.33)" : "rgba(58,46,42,0.08)"}`,
                }}>
                <div className="rounded-full bg-white" style={{ width: s, height: s, opacity: brushSize === s ? 1 : 0.4 }} />
              </button>
            ))}
          </div>

          {/* Submit button */}
          <motion.button
            onClick={submit}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-foreground text-sm font-semibold"
            style={{ background: "rgba(167,139,250,0.25)", border: "1px solid rgba(167,139,250,0.5)" }}
          >
            <Send className="w-4 h-4" />
            Analyse
          </motion.button>
        </div>

        {/* Error */}
        {analyzeError && (
          <p className="text-center text-xs mt-2" style={{ color: "#F87171" }}>
            {analyzeError}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReliefDrawing() {
  return (
    <PremiumGate
      feature="AI Draw"
      icon="✏️"
      description="Draw with your hands in the air and let Gemini read your emotions from every stroke. Pure magic — and pure premium."
    >
      <ReliefDrawingInner />
    </PremiumGate>
  );
}
