/**
 * Space Blocks — AR block building with MediaPipe Hands
 * Gesture map:
 *   Index pointing (☝️)  → move cursor over isometric grid
 *   Pinch (✊)            → place block at cursor
 *   Open palm (🖐)        → delete top block at cursor
 *
 * The isometric 3D grid floats over the live camera feed.
 * Hand position is mapped linearly to grid XZ coords.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import PremiumGate from "@/components/PremiumGate";

declare const Hands: any;
declare const Camera: any;

// ─── Grid config ────────────────────────────────────────────────────────────
const GW = 6; // grid width  (x)
const GD = 6; // grid depth  (z)
const GH = 8; // max stack height (y)

// ─── Block palette (top / left-face / right-face) ───────────────────────────
const BLOCKS = [
  { name: "Grass",    top: "#69C362", lft: "#3E9E38", rgt: "#2D7A29" },
  { name: "Stone",    top: "#C2C2C2", lft: "#8A8A8A", rgt: "#676767" },
  { name: "Wood",     top: "#C4A97D", lft: "#9C7C4E", rgt: "#7A5C30" },
  { name: "Sand",     top: "#FFF08A", lft: "#E8CC45", rgt: "#C9A800" },
  { name: "Gold",     top: "#FFE066", lft: "#F0B800", rgt: "#C98200" },
  { name: "Ice",      top: "#A8DDFF", lft: "#57B8F0", rgt: "#0D85D4" },
  { name: "Lava",     top: "#FF6B35", lft: "#D93700", rgt: "#A01E00" },
  { name: "Diamond",  top: "#80FFEA", lft: "#00BFA5", rgt: "#00796B" },
];

type Cell = number | null;

const makeGrid = (): Cell[][][] =>
  Array.from({ length: GW }, () =>
    Array.from({ length: GH }, () =>
      Array.from({ length: GD }, () => null)
    )
  );

// ─── Gesture helpers ────────────────────────────────────────────────────────
const isPointing = (lm: any[]) =>
  lm[8].y < lm[6].y &&
  lm[12].y > lm[10].y &&
  lm[16].y > lm[14].y &&
  lm[20].y > lm[18].y;

const isPinch = (lm: any[], thr = 0.06) =>
  Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) < thr;

const isPalm = (lm: any[]) =>
  !isPinch(lm) &&
  lm[8].y < lm[6].y &&
  lm[12].y < lm[10].y &&
  lm[16].y < lm[14].y &&
  lm[20].y < lm[18].y;

// ─── Component ───────────────────────────────────────────────────────────────
function ReliefBlocksInner() {
  const navigate = useNavigate();
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const gridRef     = useRef<Cell[][][]>(makeGrid());
  const cursorRef   = useRef({ x: Math.floor(GW / 2), z: Math.floor(GD / 2) });
  const selTypeRef  = useRef(0);
  const blockCntRef = useRef(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [gesture,     setGesture]     = useState<"idle" | "point" | "pinch" | "palm">("idle");
  const [selType,     setSelType]     = useState(0);
  const [blockCount,  setBlockCount]  = useState(0);
  const [feedback,    setFeedback]    = useState<{ msg: string; color: string } | null>(null);

  const pinchCool  = useRef(false);
  const deleteCool = useRef(false);
  const rafRef     = useRef(0);

  const toast = (msg: string, color: string) => {
    setFeedback({ msg, color });
    setTimeout(() => setFeedback(null), 750);
  };

  const topY = (x: number, z: number) => {
    for (let y = GH - 1; y >= 0; y--)
      if (gridRef.current[x][y][z] !== null) return y + 1;
    return 0;
  };

  const placeBlock = useCallback((x: number, z: number) => {
    const y = topY(x, z);
    if (y >= GH) { toast("Column full!", "#F87171"); return; }
    gridRef.current[x][y][z] = selTypeRef.current;
    blockCntRef.current++;
    setBlockCount(blockCntRef.current);
    toast("Placed ✓", BLOCKS[selTypeRef.current].top);
  }, []);

  const deleteBlock = useCallback((x: number, z: number) => {
    const y = topY(x, z) - 1;
    if (y < 0) return;
    gridRef.current[x][y][z] = null;
    blockCntRef.current = Math.max(0, blockCntRef.current - 1);
    setBlockCount(blockCntRef.current);
    toast("Removed", "#F87171");
  }, []);

  const clearAll = () => {
    gridRef.current = makeGrid();
    blockCntRef.current = 0;
    setBlockCount(0);
  };

  // ─── Draw loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Responsive tile dimensions
      // TILE_W sized so grid fills ~88% screen width; steeper angle (TILE_H=0.65*TILE_W)
      const TW  = Math.min(70, (W * 0.88) / (GW + GD - 1));
      const TH  = TW * 0.65;   // tile height (steeper than classic iso = more vertical room)
      const BH  = TW * 0.85;   // block height in pixels

      // Center the grid: iso origin so gx=GW/2, gz=GD/2 is horizontally centred
      // and the full scene (blocks + ground) is vertically centred
      const groundH   = (GW + GD - 2) * TH / 2;   // height of ground diamond
      const maxStackH = (GH - 1) * BH;              // tallest possible stack
      const sceneH    = groundH + maxStackH;
      const OX = W / 2;
      const OY = H * 0.5 + groundH * 0.5 - sceneH * 0.35;

      // Isometric project: top-centre of block column at (gx, gy, gz)
      const iso = (gx: number, gy: number, gz: number) => ({
        sx: (gx - gz) * TW / 2 + OX,
        sy: (gx + gz) * TH / 2 - gy * BH + OY,
      });

      // Draw ground tiles (back-to-front by depth)
      for (let depth = 0; depth <= GW + GD - 2; depth++) {
        for (let x = 0; x < GW; x++) {
          const z = depth - x;
          if (z < 0 || z >= GD) continue;
          const { sx, sy } = iso(x, 0, z);
          const hw = TW / 2, hh = TH / 2;
          const isCursor = cursorRef.current.x === x && cursorRef.current.z === z;

          // Tile fill
          ctx.fillStyle = isCursor ? "rgba(100,220,100,0.32)" : "rgba(40,100,50,0.18)";
          ctx.beginPath();
          ctx.moveTo(sx,      sy - hh);
          ctx.lineTo(sx + hw, sy);
          ctx.lineTo(sx,      sy + hh);
          ctx.lineTo(sx - hw, sy);
          ctx.closePath();
          ctx.fill();

          // Tile border
          ctx.strokeStyle = isCursor ? "rgba(100,220,100,0.7)" : "rgba(80,160,80,0.22)";
          ctx.lineWidth   = isCursor ? 1.5 : 0.6;
          ctx.stroke();
        }
      }

      // Collect blocks + ghost, sort back-to-front
      const items: { gx: number; gy: number; gz: number; type: number; ghost: boolean }[] = [];

      for (let z = 0; z < GD; z++)
        for (let x = 0; x < GW; x++)
          for (let y = 0; y < GH; y++) {
            const t = gridRef.current[x][y][z];
            if (t !== null) items.push({ gx: x, gy: y, gz: z, type: t, ghost: false });
          }

      // Ghost block at cursor top
      const cur = cursorRef.current;
      const ghostY = topY(cur.x, cur.z);
      if (ghostY < GH)
        items.push({ gx: cur.x, gy: ghostY, gz: cur.z, type: selTypeRef.current, ghost: true });

      // Painter's sort: ascending depth (gx+gz), then ascending gy
      items.sort((a, b) => {
        const da = a.gx + a.gz, db = b.gx + b.gz;
        return da !== db ? da - db : a.gy - b.gy;
      });

      // Draw each block
      for (const { gx, gy, gz, type, ghost } of items) {
        // Top-centre of this block is at (gx, gy+1, gz)
        const { sx, sy } = iso(gx, gy + 1, gz);
        const hw = TW / 2, hh = TH / 2;
        const bt = BLOCKS[type];
        ctx.globalAlpha = ghost ? 0.48 : 1;

        // ── Top face ──
        ctx.fillStyle = bt.top;
        ctx.beginPath();
        ctx.moveTo(sx,      sy - hh);
        ctx.lineTo(sx + hw, sy);
        ctx.lineTo(sx,      sy + hh);
        ctx.lineTo(sx - hw, sy);
        ctx.closePath();
        ctx.fill();

        // ── Left face (front-left, darker) ──
        ctx.fillStyle = bt.lft;
        ctx.beginPath();
        ctx.moveTo(sx - hw, sy);
        ctx.lineTo(sx,      sy + hh);
        ctx.lineTo(sx,      sy + hh + BH);
        ctx.lineTo(sx - hw, sy + BH);
        ctx.closePath();
        ctx.fill();

        // ── Right face (front-right, darkest) ──
        ctx.fillStyle = bt.rgt;
        ctx.beginPath();
        ctx.moveTo(sx,      sy + hh);
        ctx.lineTo(sx + hw, sy);
        ctx.lineTo(sx + hw, sy + BH);
        ctx.lineTo(sx,      sy + hh + BH);
        ctx.closePath();
        ctx.fill();

        // ── Outline (subtle depth) ──
        if (!ghost) {
          ctx.globalAlpha = 0.18;
          ctx.strokeStyle = "#000";
          ctx.lineWidth   = 0.7;
          // top face
          ctx.beginPath();
          ctx.moveTo(sx, sy - hh);
          ctx.lineTo(sx + hw, sy);
          ctx.lineTo(sx, sy + hh);
          ctx.lineTo(sx - hw, sy);
          ctx.closePath();
          ctx.stroke();
          // vertical edges + bottom
          ctx.beginPath();
          ctx.moveTo(sx - hw, sy);      ctx.lineTo(sx - hw, sy + BH);
          ctx.moveTo(sx,      sy + hh); ctx.lineTo(sx,      sy + hh + BH);
          ctx.moveTo(sx + hw, sy);      ctx.lineTo(sx + hw, sy + BH);
          ctx.moveTo(sx - hw, sy + BH);
          ctx.lineTo(sx, sy + hh + BH);
          ctx.lineTo(sx + hw, sy + BH);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.globalAlpha = 1;
      }

      // Cursor ring around ghost block top
      if (ghostY < GH) {
        const { sx, sy } = iso(cur.x, ghostY + 1, cur.z);
        const hw = TW / 2 + 3, hh = TH / 2 + 2;
        ctx.strokeStyle = BLOCKS[selTypeRef.current].top;
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 0.75;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(sx,      sy - hh);
        ctx.lineTo(sx + hw, sy);
        ctx.lineTo(sx,      sy + hh);
        ctx.lineTo(sx - hw, sy);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ─── Canvas resize ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ─── MediaPipe Hands ─────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof Hands === "undefined" || typeof Camera === "undefined") return;

    const hands = new Hands({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.6,
    });

    hands.onResults((results: any) => {
      if (!results.multiHandLandmarks?.length) {
        setGesture("idle");
        return;
      }

      const lm = results.multiHandLandmarks[0];

      // Mirror X (camera is mirrored in display)
      const hx = 1 - lm[8].x;
      const hy = lm[8].y;

      // Linear mapping: hand 0-1 → grid 0 to GW/GD-1
      const gx = Math.max(0, Math.min(GW - 1, Math.floor(hx * GW)));
      const gz = Math.max(0, Math.min(GD - 1, Math.floor(hy * GD)));
      cursorRef.current = { x: gx, z: gz };

      const pinching = isPinch(lm);
      const palm     = !pinching && isPalm(lm);
      const pointing = !pinching && !palm && isPointing(lm);

      if (pinching) {
        setGesture("pinch");
        if (!pinchCool.current) {
          pinchCool.current = true;
          placeBlock(gx, gz);
          setTimeout(() => { pinchCool.current = false; }, 650);
        }
      } else if (palm) {
        setGesture("palm");
        if (!deleteCool.current) {
          deleteCool.current = true;
          deleteBlock(gx, gz);
          setTimeout(() => { deleteCool.current = false; }, 650);
        }
      } else if (pointing) {
        setGesture("point");
      } else {
        setGesture("idle");
      }
    });

    let stopped = false;
    const camera = new Camera(video, {
      onFrame: async () => {
        if (stopped) return;
        try { await hands.send({ image: video }); } catch { /* ignore post-close */ }
      },
      width: 1280, height: 720,
    });
    camera.start().then(() => setCameraReady(true));

    return () => {
      stopped = true;
      camera.stop();
      setTimeout(() => { try { hands.close(); } catch { /* */ } }, 50);
    };
  }, [placeBlock, deleteBlock]);

  // ─── Gesture label ────────────────────────────────────────────────────────
  const gestureLabel = () => {
    if (gesture === "pinch") return "✊ Placing…";
    if (gesture === "palm")  return "🖐 Deleting…";
    if (gesture === "point") return "☝️ Moving cursor";
    return "Show your hand";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Live camera */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)", opacity: cameraReady ? 0.48 : 0 }}
        muted
        playsInline
      />

      {/* Isometric block canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 10 }}
      />

      {/* Camera loading */}
      {!cameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin mb-3"
            style={{ borderColor: "#69C362", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "rgba(58,46,42,0.50)" }}>
            Starting camera…
          </p>
        </div>
      )}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-5 pb-3"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)" }}
      >
        <button
          onClick={() => navigate("/relief")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm"
          style={{ background: "rgba(58,46,42,0.10)", color: "rgba(58,46,42,0.70)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center">
          <div className="text-foreground font-bold text-base">🧱 {blockCount}</div>
          <div className="text-xs tabular-nums" style={{ color: "rgba(58,46,42,0.38)" }}>
            {gestureLabel()}
          </div>
        </div>

        <button
          onClick={clearAll}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(58,46,42,0.08)" }}
        >
          <Trash2 className="w-4 h-4" style={{ color: "rgba(58,46,42,0.45)" }} />
        </button>
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.msg + feedback.color}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.88 }}
            className="absolute top-20 left-1/2 z-40 px-4 py-1.5 rounded-full text-xs font-bold pointer-events-none"
            style={{
              x: "-50%",
              color: feedback.color,
              background: feedback.color + "22",
              border: `1px solid ${feedback.color}44`,
            }}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block type palette */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {BLOCKS.map((bt, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.88 }}
              onClick={() => { selTypeRef.current = i; setSelType(i); }}
              className="rounded-lg transition-all"
              style={{
                width:  selType === i ? 38 : 28,
                height: selType === i ? 38 : 28,
                background: `linear-gradient(145deg, ${bt.top}, ${bt.rgt})`,
                border: selType === i ? "2.5px solid white" : "2px solid rgba(58,46,42,0.15)",
                boxShadow: selType === i ? `0 0 14px ${bt.top}99` : "none",
                transition: "all 0.18s",
              }}
            />
          ))}
        </div>

        <div
          className="flex gap-4 px-5 py-2 rounded-2xl text-xs"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(58,46,42,0.45)" }}
        >
          <span>✊ Pinch = place</span>
          <span>🖐 Palm = delete</span>
        </div>
      </div>
    </div>
  );
}

export default function ReliefBlocks() {
  return (
    <PremiumGate
      feature="Space Blocks"
      icon="🧊"
      description="Build a 3D world with your bare hands using AR and MediaPipe. A premium experience for when words aren't enough."
    >
      <ReliefBlocksInner />
    </PremiumGate>
  );
}
