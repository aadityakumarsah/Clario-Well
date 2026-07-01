/**
 * Day Refill — 5 squats using MediaPipe Pose (ported from up-down-task).
 */

import { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { markStepDone } from "./DailyCheck";

const mpWindow = window as any;

const TARGET = 5;
const ACCENT = "#5DB075";

interface Point { x: number; y: number; z?: number; visibility?: number }
function calculateAngle(a: Point, b: Point, c: Point) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return angle;
}

export default function DailyCheckRefill() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [count, setCount] = useState(0);
  const [stage, setStage] = useState<"up" | "down">("up");
  const [loaded, setLoaded] = useState(false);
  const [done, setDone] = useState(false);

  const countRef = useRef(0);
  const stageRef = useRef<"up" | "down">("up");
  const doneRef = useRef(false);
  const loadedRef = useRef(false);

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;
    const video = webcamRef.current.video;
    const W = video.videoWidth;
    const H = video.videoHeight;
    canvasRef.current.width = W;
    canvasRef.current.height = H;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(results.image, 0, 0, W, H);

    if (results.poseLandmarks) {
      mpWindow.drawConnectors(ctx, results.poseLandmarks, mpWindow.POSE_CONNECTIONS, {
        color: ACCENT + "cc",
        lineWidth: 3,
      });
      mpWindow.drawLandmarks(ctx, results.poseLandmarks, {
        color: "#ffffff",
        lineWidth: 1,
        radius: 3,
      });

      if (!doneRef.current) {
        const leftHip   = results.poseLandmarks[23];
        const leftKnee  = results.poseLandmarks[25];
        const leftAnkle = results.poseLandmarks[27];

        if (leftHip && leftKnee && leftAnkle) {
          const angle = calculateAngle(leftHip, leftKnee, leftAnkle);

          if (angle > 160 && stageRef.current === "down") {
            stageRef.current = "up";
            setStage("up");
            countRef.current += 1;
            setCount(countRef.current);
            if (countRef.current >= TARGET) {
              doneRef.current = true;
              setDone(true);
            }
          }
          if (angle < 90 && stageRef.current === "up") {
            stageRef.current = "down";
            setStage("down");
          }

          // Angle label near knee
          ctx.font = "bold 18px system-ui";
          ctx.fillStyle = "rgba(58,46,42,0.80)";
          ctx.fillText(
            Math.round(angle) + "°",
            leftKnee.x * W + 14,
            leftKnee.y * H - 8,
          );
        }
      }
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    const Pose = mpWindow.Pose;
    const Camera = mpWindow.Camera;
    if (!Pose || !Camera) return;

    const pose = new Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults(onResults);

    let camera: any = null;
    const startCamera = () => {
      if (webcamRef.current?.video) {
        camera = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current?.video) {
              await pose.send({ image: webcamRef.current.video });
              if (!loadedRef.current) {
                loadedRef.current = true;
                setLoaded(true);
              }
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    };

    // Wait a tick for webcam ref to attach
    const t = setTimeout(startCamera, 300);
    return () => {
      clearTimeout(t);
      camera?.stop();
      pose.close();
    };
  }, [onResults]);

  const reset = () => {
    countRef.current = 0;
    stageRef.current = "up";
    doneRef.current = false;
    setCount(0);
    setStage("up");
    setDone(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-10 pb-2">
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

      {/* Header */}
      <div className="px-6 mt-4 mb-5">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: ACCENT, opacity: 0.8 }}>
          02 · day refill
        </p>
        <h1 className="text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.4px" }}>
          5 Squats
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "rgba(58,46,42,0.38)" }}>
          Stand back so your full body is visible. Squat down past 90°, stand back up.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 px-5 pb-10">
        {/* Camera feed */}
        <div className="relative flex-1 rounded-2xl overflow-hidden bg-black min-h-[300px]"
          style={{ border: "1px solid rgba(58,46,42,0.08)" }}
        >
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ backgroundColor: "hsl(var(--background))" }}
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

          <Webcam
            ref={webcamRef}
            className="absolute opacity-0 w-px h-px"
            videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
          />
          <canvas ref={canvasRef} className="w-full h-full object-cover" />

          {/* Done overlay */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20"
                style={{ backgroundColor: "hsl(var(--background))", backdropFilter: "blur(8px)" }}
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{ backgroundColor: ACCENT + "22", border: `2px solid ${ACCENT}66` }}
                  >
                    ✓
                  </div>
                  <p className="text-foreground text-2xl font-bold">Set complete!</p>
                  <p className="text-sm" style={{ color: "rgba(58,46,42,0.45)" }}>
                    5 squats done — body refilled.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                      style={{
                        backgroundColor: "rgba(58,46,42,0.07)",
                        border: "1px solid rgba(58,46,42,0.10)",
                        color: "rgba(58,46,42,0.60)",
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      again
                    </button>
                    <button
                      type="button"
                      onClick={() => { markStepDone("refill"); navigate("/daily-check"); }}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground transition-opacity hover:opacity-80"
                      style={{ backgroundColor: ACCENT }}
                    >
                      back to daily check
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side stats */}
        <div className="lg:w-52 flex flex-row lg:flex-col gap-4">
          {/* Counter */}
          <div
            className="flex-1 lg:flex-none rounded-2xl p-5"
            style={{
              backgroundColor: "rgba(58,46,42,0.04)",
              border: "1px solid rgba(58,46,42,0.07)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(58,46,42,0.35)" }}>
              reps
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black" style={{ color: ACCENT }}>{count}</span>
              <span className="text-xl font-medium" style={{ color: "rgba(58,46,42,0.25)" }}>/ {TARGET}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(58,46,42,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: ACCENT }}
                animate={{ width: `${(count / TARGET) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Stage */}
          <div
            className="flex-1 lg:flex-none rounded-2xl p-5"
            style={{
              backgroundColor: "rgba(58,46,42,0.04)",
              border: "1px solid rgba(58,46,42,0.07)",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(58,46,42,0.35)" }}>
              position
            </p>
            <div className="flex lg:flex-col gap-2">
              {(["up", "down"] as const).map((s) => (
                <div
                  key={s}
                  className="flex-1 py-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                  style={
                    stage === s
                      ? { backgroundColor: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}55` }
                      : { backgroundColor: "rgba(58,46,42,0.04)", color: "rgba(58,46,42,0.20)", border: "1px solid transparent" }
                  }
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
