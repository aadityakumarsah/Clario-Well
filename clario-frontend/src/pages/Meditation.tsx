/**
 * Meditation — full-body segmentation + lotus pose hold tracker.
 * If the user moves beyond the threshold, a horn fires.
 *
 * Pose criteria (lotus / seated upright):
 *  - Shoulders above hips (body upright, not leaning way over)
 *  - Knees spread wider than shoulders (cross-legged position)
 *  - Hips near vertical center-bottom of frame (seated on the floor)
 *
 * Stability: 8 key landmarks tracked per frame; if the average
 * normalised movement exceeds MOVE_THRESHOLD a horn fires
 * (with a 2.5 s cooldown so it doesn't blast continuously).
 */

import { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Square } from "lucide-react";

// ─── MediaPipe from CDN window globals ────────────────────────────────────────
const mpW = window as any;

// ─── constants ────────────────────────────────────────────────────────────────
const ACCENT = "hsl(var(--primary))";       // violet
const GOOD_COLOR    = "#4ADE80";       // green – stable
const BAD_COLOR     = "#F87171";       // red   – moved
const MOVE_THRESHOLD = 0.016;          // normalised-coord distance per frame
const HORN_COOLDOWN  = 2500;           // ms between horn blasts
const TRACKED_IDX    = [11, 12, 23, 24, 25, 26, 27, 28]; // shoulders/hips/knees/ankles

// ─── horn via Web Audio API ───────────────────────────────────────────────────
function playHorn(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Low, blaring brass-like tone
  [110, 220, 330].forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.4);
    gain.gain.setValueAtTime(0.18 - i * 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.start(now);
    osc.stop(now + 0.6);
  });
}

// ─── lotus detection heuristics ───────────────────────────────────────────────
function detectLotus(lm: any[]): boolean {
  const ls = lm[11]; const rs = lm[12]; // shoulders
  const lh = lm[23]; const rh = lm[24]; // hips
  const lk = lm[25]; const rk = lm[26]; // knees

  if (!ls || !rs || !lh || !rh || !lk || !rk) return false;
  if ([ls, rs, lh, rh, lk, rk].some(p => (p.visibility ?? 1) < 0.4)) return false;

  const shoulderW = Math.abs(ls.x - rs.x);
  const kneeW     = Math.abs(lk.x - rk.x);
  const hipMidY   = (lh.y + rh.y) / 2;
  const shoulderMidY = (ls.y + rs.y) / 2;
  const kneeMidY  = (lk.y + rk.y) / 2;

  // Seated: hips below shoulders (y increases downward in normalised coords)
  const isSeated = hipMidY > shoulderMidY + 0.1;
  // Knees spread wider than shoulder width (cross-legged)
  const kneesWide = kneeW >= shoulderW * 0.8;
  // Knees roughly at hip level (not sticking up like a chair sit)
  const kneesLow = Math.abs(kneeMidY - hipMidY) < 0.25;
  // Upright torso
  const torsoUpright = Math.abs(hipMidY - shoulderMidY) > 0.15;

  return isSeated && kneesWide && kneesLow && torsoUpright;
}

// ─── landmark movement ────────────────────────────────────────────────────────
function computeMovement(prev: any[], curr: any[]): number {
  let total = 0;
  let count = 0;
  for (const i of TRACKED_IDX) {
    if (!prev[i] || !curr[i]) continue;
    const dx = curr[i].x - prev[i].x;
    const dy = curr[i].y - prev[i].y;
    total += Math.sqrt(dx * dx + dy * dy);
    count++;
  }
  return count > 0 ? total / count : 0;
}

// ─── format mm:ss ─────────────────────────────────────────────────────────────
function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── component ────────────────────────────────────────────────────────────────
export default function Meditation() {
  const navigate   = useNavigate();
  const webcamRef  = useRef<Webcam>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const audioCtxRef    = useRef<AudioContext | null>(null);
  const lastHornRef    = useRef(0);
  const prevLandmarks  = useRef<any[]>([]);
  const isRunningRef   = useRef(false);

  const [loaded,        setLoaded]        = useState(false);
  const [isRunning,     setIsRunning]     = useState(false);
  const [inLotus,       setInLotus]       = useState(false);
  const [stable,        setStable]        = useState(true);
  const [hornCount,     setHornCount]     = useState(0);
  const [sessionSecs,   setSessionSecs]   = useState(0);
  const [movementPct,   setMovementPct]   = useState(0);

  // ── timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSessionSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // ── pose results ────────────────────────────────────────────────────────────
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;
    const video = webcamRef.current.video;
    const W = video.videoWidth || 640;
    const H = video.videoHeight || 480;
    canvasRef.current.width  = W;
    canvasRef.current.height = H;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // ── segmentation silhouette ──────────────────────────────────────────────
    if (results.segmentationMask) {
      // Draw mask
      ctx.drawImage(results.segmentationMask, 0, 0, W, H);
      // Replace person pixels with camera feed
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(results.image, 0, 0, W, H);
      // Fill background
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "hsl(var(--background))";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.drawImage(results.image, 0, 0, W, H);
    }

    if (results.poseLandmarks) {
      const lm = results.poseLandmarks;
      const isLotus = detectLotus(lm);
      setInLotus(isLotus);

      if (isRunningRef.current) {
        // ── movement detection ─────────────────────────────────────────────
        const movement = computeMovement(prevLandmarks.current, lm);
        const pct = Math.min(movement / MOVE_THRESHOLD, 1);
        setMovementPct(pct);

        const moved = movement > MOVE_THRESHOLD;
        setStable(!moved);

        if (moved) {
          const now = Date.now();
          if (now - lastHornRef.current > HORN_COOLDOWN) {
            lastHornRef.current = now;
            if (!audioCtxRef.current) {
              audioCtxRef.current = new AudioContext();
            }
            playHorn(audioCtxRef.current);
            setHornCount(c => c + 1);
          }
        }

        prevLandmarks.current = lm;
      }

      // ── skeleton overlay ───────────────────────────────────────────────────
      const skeletonColor = isRunningRef.current
        ? (stable ? GOOD_COLOR : BAD_COLOR)
        : "rgba(58,46,42,0.40)";

      mpW.drawConnectors(ctx, lm, mpW.POSE_CONNECTIONS, {
        color: skeletonColor + "99",
        lineWidth: 2,
      });
      mpW.drawLandmarks(ctx, lm, {
        color: skeletonColor,
        lineWidth: 1,
        radius: 3,
      });

      // ── aura glow around silhouette when stable & in lotus ──────────────
      if (isRunningRef.current && isLotus && stable) {
        ctx.shadowBlur    = 40;
        ctx.shadowColor   = GOOD_COLOR + "55";
        ctx.strokeStyle   = GOOD_COLOR + "22";
        ctx.lineWidth     = 0;
        ctx.globalCompositeOperation = "screen";
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }, [stable]);

  // ── MediaPipe setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const Pose   = mpW.Pose;
    const Camera = mpW.Camera;
    if (!Pose || !Camera) return;

    const pose = new Pose({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity:        1,
      smoothLandmarks:        true,
      enableSegmentation:     true,
      smoothSegmentation:     true,
      minDetectionConfidence: 0.55,
      minTrackingConfidence:  0.55,
    });
    pose.onResults(onResults);

    let camera: any = null;
    const t = setTimeout(() => {
      if (webcamRef.current?.video) {
        camera = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current?.video) {
              await pose.send({ image: webcamRef.current.video });
              if (!loaded) setLoaded(true);
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    }, 400);

    return () => {
      clearTimeout(t);
      camera?.stop();
      pose.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onResults]);

  // ── controls ─────────────────────────────────────────────────────────────
  const startSession = () => {
    prevLandmarks.current = [];
    lastHornRef.current = 0;
    setHornCount(0);
    setSessionSecs(0);
    setStable(true);
    isRunningRef.current = true;
    setIsRunning(true);
  };

  const stopSession = () => {
    isRunningRef.current = false;
    setIsRunning(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-10 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft className="w-4 h-4" />
          back
        </button>

        {/* Session timer */}
        <AnimatePresence>
          {isRunning && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-sm tabular-nums"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {fmt(sessionSecs)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="px-6 mt-3 mb-4 shrink-0">
        <p
          className="text-[10px] uppercase tracking-[0.3em] mb-1"
          style={{ color: ACCENT, opacity: 0.8 }}
        >
          hold the pose
        </p>
        <h1
          className="text-3xl font-bold text-foreground"
          style={{ letterSpacing: "-0.4px" }}
        >
          meditation
        </h1>
      </div>

      {/* Main grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-5 pb-10 min-h-0">

        {/* Camera canvas */}
        <div
          className="relative flex-1 rounded-2xl overflow-hidden min-h-[300px]"
          style={{ border: `1px solid rgba(58,46,42,0.07)`, backgroundColor: "#020810" }}
        >
          {/* Loading */}
          {!loaded && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ backgroundColor: "rgba(2,8,16,0.95)" }}
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-3"
                style={{ borderColor: ACCENT, borderTopColor: "transparent" }}
              />
              <p className="text-sm font-medium" style={{ color: ACCENT }}>
                Loading pose model…
              </p>
            </div>
          )}

          {/* Hidden webcam feed */}
          <Webcam
            ref={webcamRef}
            className="absolute opacity-0 w-px h-px"
            videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
          />
          {/* Pose canvas */}
          <canvas ref={canvasRef} className="w-full h-full object-cover" />

          {/* Movement alarm flash */}
          <AnimatePresence>
            {isRunning && !stable && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.35, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ backgroundColor: BAD_COLOR, border: `2px solid ${BAD_COLOR}` }}
              />
            )}
          </AnimatePresence>

          {/* Pose status badge */}
          {loaded && (
            <div
              className="absolute top-3 left-3 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: "rgba(2,8,16,0.72)",
                backdropFilter: "blur(8px)",
                color: inLotus ? GOOD_COLOR : "rgba(58,46,42,0.45)",
                border: `1px solid ${inLotus ? GOOD_COLOR + "44" : "rgba(58,46,42,0.08)"}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: inLotus ? GOOD_COLOR : "rgba(58,46,42,0.25)" }}
              />
              {inLotus ? "Lotus detected" : "Awaiting pose"}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="lg:w-52 flex flex-row lg:flex-col gap-3 shrink-0">

          {/* Posture status */}
          <div
            className="flex-1 lg:flex-none rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(58,46,42,0.03)",
              border: "1px solid rgba(58,46,42,0.06)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(58,46,42,0.30)" }}>
              posture
            </p>
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ backgroundColor: isRunning && !stable ? BAD_COLOR : GOOD_COLOR }}
                transition={{ duration: 0.2 }}
                className="w-2.5 h-2.5 rounded-full shrink-0"
              />
              <span className="text-sm font-semibold text-foreground">
                {!isRunning ? "—" : stable ? "Still" : "Moving!"}
              </span>
            </div>

            {/* Movement bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(58,46,42,0.06)" }}>
              <motion.div
                className="h-full rounded-full transition-colors duration-200"
                style={{ backgroundColor: movementPct > 0.6 ? BAD_COLOR : GOOD_COLOR }}
                animate={{ width: `${movementPct * 100}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "rgba(58,46,42,0.22)" }}>
              movement level
            </p>
          </div>

          {/* Horn count */}
          <div
            className="flex-1 lg:flex-none rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(58,46,42,0.03)",
              border: "1px solid rgba(58,46,42,0.06)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(58,46,42,0.30)" }}>
              posture breaks
            </p>
            <span
              className="text-4xl font-black"
              style={{ color: hornCount > 0 ? BAD_COLOR : GOOD_COLOR }}
            >
              {hornCount}
            </span>
          </div>

          {/* Session duration */}
          <div
            className="flex-1 lg:flex-none rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(58,46,42,0.03)",
              border: "1px solid rgba(58,46,42,0.06)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(58,46,42,0.30)" }}>
              held for
            </p>
            <span className="text-3xl font-bold text-foreground tabular-nums font-mono">
              {fmt(sessionSecs)}
            </span>
          </div>

          {/* Instructions */}
          <div
            className="hidden lg:block rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(58,46,42,0.02)",
              border: "1px solid rgba(58,46,42,0.05)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-2.5" style={{ color: "rgba(58,46,42,0.22)" }}>
              how to
            </p>
            <ul className="space-y-1.5">
              {[
                "Sit in lotus pose on the floor",
                "Full body visible in frame",
                "Press Start to begin",
                "Horn fires if you move",
              ].map((t, i) => (
                <li key={i} className="flex gap-2 text-xs leading-snug" style={{ color: "rgba(58,46,42,0.35)" }}>
                  <span style={{ color: ACCENT }}>·</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Start / Stop */}
      <div className="px-5 pb-10 shrink-0">
        {isRunning ? (
          <button
            type="button"
            onClick={stopSession}
            className="w-full py-4 rounded-2xl text-foreground font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(248,113,113,0.18)", border: `1px solid ${BAD_COLOR}44`, color: BAD_COLOR }}
          >
            <Square className="w-4 h-4" />
            End session
          </button>
        ) : (
          <button
            type="button"
            onClick={startSession}
            disabled={!loaded}
            className="w-full py-4 rounded-2xl text-foreground font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ backgroundColor: ACCENT }}
          >
            <Play className="w-4 h-4" />
            {loaded ? "Start meditation" : "Loading…"}
          </button>
        )}
      </div>
    </div>
  );
}
