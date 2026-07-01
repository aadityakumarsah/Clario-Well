/**
 * GardenScene — web port of the clario-mobile garden.
 * Uses the same Lottie assets and layout proportions as the React Native version.
 * Milestones (dayCount) match NC_MAJOR_MILESTONES exactly.
 */
import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";

interface GardenSceneProps {
  completed: number; // 0–3 (steps done today)
  dayCount?: number; // consecutive streak days — drives milestone unlocks
}

const FLOWER_SLOTS = [
  { leftPct: 26, bottomPct: 9,  scale: 0.40, src: "/garden/nc-flower-grow-a.json", delayMs: 0   },
  { leftPct: 42, bottomPct: 10, scale: 0.38, src: "/garden/nc-flower-grow-b.json", delayMs: 500 },
  { leftPct: 55, bottomPct: 8,  scale: 0.36, src: "/garden/nc-flower-grow-a.json", delayMs: 250 },
];

function useLottie(
  src: string,
  opts: { loop?: boolean; autoplay?: boolean; goToEnd?: boolean } = {},
) {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    anim.current = lottie.loadAnimation({
      container: ref.current,
      renderer: "svg",
      loop: opts.loop ?? true,
      autoplay: opts.autoplay ?? true,
      path: src,
    });

    if (opts.goToEnd) {
      anim.current.addEventListener("DOMLoaded", () => {
        anim.current?.goToAndStop(anim.current.totalFrames - 1, true);
      });
    }

    return () => {
      anim.current?.destroy();
      anim.current = null;
    };
  }, [src, opts.loop, opts.autoplay, opts.goToEnd]);

  return ref;
}

function LottieEl({
  src, style, loop = true, goToEnd = false,
}: { src: string; style: React.CSSProperties; loop?: boolean; goToEnd?: boolean }) {
  const ref = useLottie(src, { loop, autoplay: true, goToEnd });
  return <div ref={ref} style={style} />;
}

// Moving bee — pure CSS animation
function MovingBee({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "18%",
        top: "22%",
        width: "16%",
        height: "16%",
        zIndex: 24,
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes bee-float {
          0%   { transform: translate(0,0) rotate(0deg); }
          25%  { transform: translate(30%,-8%) rotate(12deg); }
          50%  { transform: translate(55%,10%) rotate(-8deg); }
          75%  { transform: translate(15%,5%) rotate(5deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        .bee-anim { animation: bee-float 6s ease-in-out infinite; }
      `}</style>
      <div className="bee-anim" style={{ width: "100%", height: "100%" }}>
        <LottieEl src="/garden/nc-honey-bee.json" style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

// Swaying flower (idle state = go to last frame + CSS sway)
function Flower({ slot, delayMs }: { slot: typeof FLOWER_SLOTS[0]; delayMs: number }) {
  const w = 135 * slot.scale;
  const h = 184 * slot.scale;
  const id = `sway-${slot.leftPct}`;

  return (
    <div
      style={{
        position: "absolute",
        left: `${slot.leftPct}%`,
        bottom: `${slot.bottomPct}%`,
        width: w,
        height: h,
        zIndex: 22,
        transformOrigin: "bottom center",
      }}
    >
      <style>{`
        @keyframes ${id} {
          0%,100% { transform: rotate(0deg) translateX(0); }
          33%      { transform: rotate(5deg) translateX(3px); }
          66%      { transform: rotate(-5deg) translateX(-3px); }
        }
        .${id} { animation: ${id} 3.4s ease-in-out ${delayMs}ms infinite; transform-origin: bottom center; }
      `}</style>
      <div className={id} style={{ width: "100%", height: "100%" }}>
        <LottieEl
          src={slot.src}
          style={{ width: w, height: h }}
          loop={false}
          goToEnd={true}
        />
      </div>
    </div>
  );
}

export default function GardenScene({ completed, dayCount = 1 }: GardenSceneProps) {
  const hasTeapot  = dayCount >= 1;
  const hasFloral  = dayCount >= 4;
  const hasBee     = dayCount >= 7;
  const hasAutumn  = dayCount >= 12;
  const hasBerry   = dayCount >= 45;
  const hasAutumn2 = dayCount >= 80;
  const hasFrog    = dayCount >= 90;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 240,
        overflow: "hidden",
        backgroundColor: "#E8DFC8",
        backgroundImage: "url(/garden/nc-garden-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
      }}
    >
      {/* Gradient fade into page bg at bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 60%, hsl(var(--background)) 100%)",
          zIndex: 30,
          pointerEvents: "none",
        }}
      />

      {/* Tree — always visible, wind-swaying Lottie, left side */}
      <LottieEl
        src="/garden/nc-tree-wind.json"
        style={{
          position: "absolute",
          left: "-2%",
          bottom: "4%",
          width: "56%",
          height: "94%",
          zIndex: 8,
        }}
      />

      {/* Autumn leaves (day 12+) — upper right */}
      {hasAutumn && (
        <div style={{ position: "absolute", right: "6%", top: "5%", width: "22%", height: "24%", zIndex: 9, transform: "rotate(14deg)" }}>
          <LottieEl src="/garden/nc-autumn.json" style={{ width: "100%", height: "100%" }} />
        </div>
      )}

      {/* Second autumn (day 80+) — upper left */}
      {hasAutumn2 && (
        <div style={{ position: "absolute", left: "6%", top: "5%", width: "22%", height: "24%", zIndex: 9, transform: "rotate(-14deg)" }}>
          <LottieEl src="/garden/nc-autumn.json" style={{ width: "100%", height: "100%" }} />
        </div>
      )}

      {/* Floral ornament (day 4+) — mid left */}
      {hasFloral && (
        <img
          src="/garden/nc-floral.png"
          alt=""
          style={{
            position: "absolute",
            left: "4%",
            bottom: "25%",
            width: "11%",
            height: "28%",
            objectFit: "contain",
            zIndex: 7,
          }}
        />
      )}

      {/* Berry sprigs (day 45+) — center + far right */}
      {hasBerry && (
        <>
          <img src="/garden/nc-berry.png" alt="" style={{ position: "absolute", left: "40%", bottom: "10%", width: "18%", height: "26%", objectFit: "contain", zIndex: 11 }} />
          <img src="/garden/nc-berry.png" alt="" style={{ position: "absolute", right: "2%",  bottom: "10%", width: "16%", height: "24%", objectFit: "contain", zIndex: 11 }} />
        </>
      )}

      {/* Frog (day 90+) */}
      {hasFrog && (
        <LottieEl
          src="/garden/nc-frog.json"
          style={{ position: "absolute", right: "34%", bottom: "3%", width: "28%", height: "30%", zIndex: 23 }}
        />
      )}

      {/* Teapot (day 1+) — bottom right */}
      {hasTeapot && (
        <LottieEl
          src="/garden/nc-teapot.json"
          style={{ position: "absolute", right: "-2%", bottom: "-2%", width: "44%", height: "65%", zIndex: 20 }}
        />
      )}

      {/* Flowers — one per completed daily step */}
      {FLOWER_SLOTS.slice(0, completed).map((slot, idx) => (
        <Flower key={idx} slot={slot} delayMs={slot.delayMs} />
      ))}

      {/* Moving bee (day 7+) */}
      <MovingBee visible={hasBee} />
    </div>
  );
}
