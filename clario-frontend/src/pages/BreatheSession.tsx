/**
 * Breathing session — circle rides a sine wave (up=inhale, down=exhale).
 * Design: deep navy, palm silhouettes, stars, phase label at bottom.
 */

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { X, UserRound, Music2, VolumeX, Vibrate, ArrowLeft } from "lucide-react";

type Phase = "inhale" | "hold" | "exhale" | "rest";

type BreathPattern = {
  label: string;
  tagline: string;
  color: string;
  phases: { name: Phase; duration: number; text: string }[];
  totalMinutes: number;
};

const PATTERNS: Record<string, BreathPattern> = {
  // 4-6: longer exhale activates parasympathetic (vagus nerve) to ease anxiety
  anxiety: {
    label: "Anxiety",
    tagline: "Calm your nervous system",
    color: "#7C6FAC",
    totalMinutes: 2,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in" },
      { name: "exhale", duration: 6, text: "Breathe out slowly" },
    ],
  },
  // 4-8: doubled exhale cools the body and dissipates adrenaline
  anger: {
    label: "Anger",
    tagline: "Cool the fire within",
    color: "#A0688A",
    totalMinutes: 3,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in deep" },
      { name: "exhale", duration: 8, text: "Release it all out" },
    ],
  },
  // 4-6: slightly faster than anger, calms the edge
  irritation: {
    label: "Irritation",
    tagline: "Soften the edge",
    color: "#5C8A7A",
    totalMinutes: 3,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in" },
      { name: "exhale", duration: 6, text: "Let it go" },
    ],
  },
  // 4-5: gentle equal breathing — nurturing, not forced
  sadness: {
    label: "Sadness",
    tagline: "Let it move through",
    color: "#5A7FA8",
    totalMinutes: 3,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in gently" },
      { name: "exhale", duration: 5, text: "Breathe out" },
    ],
  },
  // 4-4: equal breathing — predictable rhythm grounds the mind during fear
  fear: {
    label: "Fear",
    tagline: "Ground yourself now",
    color: "#6A8A6A",
    totalMinutes: 3,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in" },
      { name: "exhale", duration: 4, text: "Breathe out" },
    ],
  },
  // 4-7: long exhale releases chest tension tied to worry
  worry: {
    label: "Worry",
    tagline: "Release what you can't control",
    color: "#8A7A5A",
    totalMinutes: 4,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in" },
      { name: "exhale", duration: 7, text: "Release the worry" },
    ],
  },
  // 4-4: centering equal breath — returns focus back to self
  envy: {
    label: "Envy",
    tagline: "Return to yourself",
    color: "#5A6A8A",
    totalMinutes: 3,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in" },
      { name: "exhale", duration: 4, text: "Breathe out" },
    ],
  },
  // 4-6: steady rhythm breaks the stress cycle
  stress: {
    label: "Stress",
    tagline: "Let the tension go",
    color: "#7C6FAC",
    totalMinutes: 3,
    phases: [
      { name: "inhale", duration: 4, text: "Breathe in" },
      { name: "exhale", duration: 6, text: "Breathe out" },
    ],
  },
};

// ─── wave geometry ─────────────────────────────────────────────────────────────
// SVG uses a 0–100 coordinate space; preserveAspectRatio="none" stretches it
// to fill its container exactly, so the wave always goes edge-to-edge.
// The circle is rendered as a separate HTML element at left:50% / top:<circleTopPct>%.

const AMP_Y = 28; // wave amplitude in SVG percentage units (0-100)
const MIDX = 50;  // circle always at 50% width

// Phase spring targets (single value drives both wave shape & circle position)
// sin(2π * x/100 + phase) at x=50 → sin(π + phase) → the circle Y:
//   circleY% = 50 – AMP_Y * sin(phase)
// Phase values:
//   inhale  = +π/2  → circleY = 50 – AMP_Y  (near top  = crest)
//   hold    =  0    → circleY = 50           (center    = S-curve zero-crossing)
//   exhale  = –π/2  → circleY = 50 + AMP_Y  (near bot  = trough)
const PHASE_TARGET: Record<Phase, number> = {
  inhale: Math.PI / 2,
  hold:   0,
  exhale: -Math.PI / 2,
  rest:   0,
};

function buildWavePath(phase: number): string {
  const N = 100;
  const parts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = i; // 0–100
    const y = 50 + AMP_Y * Math.sin((2 * Math.PI * x) / 100 + phase);
    parts.push(i === 0 ? `M${x},${y.toFixed(2)}` : `L${x},${y.toFixed(2)}`);
  }
  return parts.join(" ");
}

function circleTopFromPhase(phase: number): number {
  // sin(π + phase) = –sin(phase)
  return 50 - AMP_Y * Math.sin(phase);
}

// ─── deterministic stars ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 38 }, (_, i) => ({
  x: ((i * 173 + 53) % 100),
  y: ((i * 97 + 11) % 75),
  r: 0.6 + (i % 4) * 0.45,
  op: 0.18 + (i % 5) * 0.12,
}));

// ─── component ────────────────────────────────────────────────────────────────
export default function BreatheSession() {
  const { emotion = "anxiety" } = useParams<{ emotion: string }>();
  const navigate = useNavigate();
  const pattern = PATTERNS[emotion] ?? PATTERNS.anxiety;

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(pattern.phases[0].duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const totalSeconds = pattern.totalMinutes * 60;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const phaseIdxRef = useRef(0);
  const countdownRef = useRef(pattern.phases[0].duration); // mirrors countdown state for interval use
  const currentPhase = pattern.phases[phaseIdx];

  // ── Ambient audio ──────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  // ── Breath cue audio (inhale / exhale) ─────────────────────────────────────
  // Two separate elements pre-created in the user-gesture tap so iOS allows play()
  const inhaleAudioRef  = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef  = useRef<HTMLAudioElement | null>(null);
  const skipFirstCueRef = useRef(false); // inhale already playing from start()

  // ── Voice guide (Gemini TTS) ────────────────────────────────────────────────
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const voiceCacheRef = useRef<Record<string, string>>({});  // phrase → object URL
  // Single reusable Audio element — created & unlocked during the user gesture
  const guideAudioRef = useRef<HTMLAudioElement | null>(null);

  const GUIDE_PHRASES: Record<Phase, string> = {
    inhale: "Take a deep breath in",
    hold:   "Hold your breath",
    exhale: "Breathe out slowly",
    rest:   "Rest and relax",
  };

  const fetchVoiceGuide = async () => {
    const BASE = (import.meta.env.VITE_BACKEND_BASE_URL as string) ?? "http://localhost:8000";
    const phrases = [...new Set(pattern.phases.map((p) => GUIDE_PHRASES[p.name]))];
    await Promise.all(
      phrases.map(async (text) => {
        if (voiceCacheRef.current[text]) return;
        try {
          const res = await fetch(`${BASE}/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice: "Zephyr" }),
          });
          if (!res.ok) return;
          const blob = await res.blob();
          voiceCacheRef.current[text] = URL.createObjectURL(blob);
        } catch { /* silent fail */ }
      })
    );
  };

  const playGuidePhrase = (text: string) => {
    const url = voiceCacheRef.current[text];
    if (!url || !guideAudioRef.current) return;
    const a = guideAudioRef.current;
    a.pause();
    a.src = url;
    a.currentTime = 0;
    a.play().catch(() => {});
  };

  // 1-frame silent WAV — played synchronously on tap to unlock iOS audio
  const SILENCE = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

  const toggleVoice = async () => {
    if (voiceOn) {
      guideAudioRef.current?.pause();
      setVoiceOn(false);
      return;
    }

    // Create element and play silence SYNCHRONOUSLY inside the tap —
    // this is the only way iOS grants audio permission for future plays.
    if (!guideAudioRef.current) {
      guideAudioRef.current = new Audio();
      guideAudioRef.current.volume = 0.9;
    }
    guideAudioRef.current.src = SILENCE;
    guideAudioRef.current.play().catch(() => {});

    // Now fetch TTS clips asynchronously (element already unlocked above)
    setVoiceLoading(true);
    await fetchVoiceGuide();
    setVoiceLoading(false);
    setVoiceOn(true);

    // Play current phase right away
    if (running) playGuidePhrase(GUIDE_PHRASES[currentPhase.name]);
  };

  // Play guide clip on each phase change (timer-driven — Audio already unlocked)
  useEffect(() => {
    if (!voiceOn || !running) return;
    playGuidePhrase(GUIDE_PHRASES[currentPhase.name]);
  }, [phaseIdx, running, voiceOn]);

  // Revoke cached object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(voiceCacheRef.current).forEach(URL.revokeObjectURL);
      guideAudioRef.current?.pause();
    };
  }, []);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio("/breadth/breadth.m4a");
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Play/pause based on running state and soundOn
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (running && soundOn) {
      audio.play().catch(() => {}); // ignore autoplay policy errors
    } else {
      audio.pause();
    }
  }, [running, soundOn]);

  // Stop audio when done
  useEffect(() => {
    if (done) audioRef.current?.pause();
  }, [done]);

  const toggleSound = () => setSoundOn((prev) => !prev);

  // Single phase spring drives both wave shape and circle position (~2s transition)
  const phaseSpring = useSpring(0, { stiffness: 12, damping: 11 });
  const wavePath = useTransform(phaseSpring, buildWavePath);
  // Circle top % derived from phase: 50 – AMP_Y * sin(phase)
  const circleTopPct = useTransform(phaseSpring, circleTopFromPhase);
  const circleTopStr = useTransform(circleTopPct, (v) => `${v}%`);

  useEffect(() => {
    if (!running) return;
    phaseSpring.set(PHASE_TARGET[currentPhase.name]);
  }, [phaseIdx, running]);

  // ── Play inhale / exhale cue audio on phase change ─────────────────────────
  useEffect(() => {
    if (!running) return;
    const name = currentPhase.name;
    if (name === "inhale") {
      // skip the very first fire — inhale already playing from start()
      if (skipFirstCueRef.current) { skipFirstCueRef.current = false; return; }
      exhaleAudioRef.current?.pause();
      const a = inhaleAudioRef.current;
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
    } else if (name === "exhale") {
      inhaleAudioRef.current?.pause();
      const a = exhaleAudioRef.current;
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
    }
  }, [phaseIdx, running]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      if (elapsedRef.current >= totalSeconds) {
        clearInterval(timerRef.current!);
        setRunning(false);
        setDone(true);
        phaseSpring.set(0);
        return;
      }

      const cur = countdownRef.current;
      if (cur <= 1) {
        // Phase transition
        const next = (phaseIdxRef.current + 1) % pattern.phases.length;
        phaseIdxRef.current = next;
        const nextDur = pattern.phases[next].duration;
        countdownRef.current = nextDur;
        setPhaseIdx(next);
        setCountdown(nextDur);
      } else {
        // Pre-cue: play inhale audio 2s before exhale ends so it doesn't feel late
        if (cur === 2) {
          const nextIdx = (phaseIdxRef.current + 1) % pattern.phases.length;
          if (pattern.phases[nextIdx].name === "inhale") {
            const a = inhaleAudioRef.current;
            if (a) { a.currentTime = 0; a.play().catch(() => {}); }
            skipFirstCueRef.current = true; // effect will skip — already playing
          }
        }
        countdownRef.current = cur - 1;
        setCountdown(cur - 1);
      }
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [running]);

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    phaseIdxRef.current = 0;
    elapsedRef.current = 0;
    countdownRef.current = pattern.phases[0].duration;
    setPhaseIdx(0);
    setCountdown(pattern.phases[0].duration);
    setElapsed(0);
    setDone(false);
    phaseSpring.set(PHASE_TARGET[pattern.phases[0].name]);

    // Create + unlock both cue elements inside this user-gesture tap.
    // iOS only allows audio.play() when called synchronously in a gesture.
    const inhale = new Audio("/breadth/deepbreadth.m4a");
    inhale.volume = 0.85;
    inhaleAudioRef.current = inhale;
    inhale.play().catch(() => {}); // first inhale plays immediately
    skipFirstCueRef.current = true; // tell the effect to skip this first fire

    const exhale = new Audio("/breadth/exhale.m4a");
    exhale.volume = 0;             // silent unlock
    exhaleAudioRef.current = exhale;
    exhale.play().then(() => {
      exhale.pause();
      exhale.currentTime = 0;
      exhale.volume = 0.85;        // restore for real playback later
    }).catch(() => {});

    setRunning(true);
  };

  const timeLeft = totalSeconds - elapsed;
  const timeLeftStr = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;

  return (
    <div
      className="min-h-screen w-full flex flex-col relative overflow-hidden select-none"
      style={{ backgroundColor: "#0B1628" }}
    >
      {/* ── Stars ──────────────────────────────────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`} cy={`${s.y}%`}
            r={s.r} fill="white" opacity={s.op}
          />
        ))}
      </svg>

      {/* ── Palm silhouettes ───────────────────────────────────────────────── */}
      <svg
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{ height: "62%", zIndex: 1 }}
        viewBox="0 0 375 480"
        preserveAspectRatio="xMidYMin slice"
      >
        {/* LEFT palm cluster */}
        <g fill="#07101f">
          {/* main frond — upper right */}
          <path d="M -25,-15 C 20,5 80,-30 220,10 C 190,55 80,50 10,35 Z" opacity="0.95" />
          {/* second frond — spreading right */}
          <path d="M -25,-15 C 10,30 100,20 280,55 C 240,100 110,95 30,70 Z" opacity="0.88" />
          {/* third frond — drooping down */}
          <path d="M -25,-15 C 0,50 20,120 50,230 C 5,220 -15,160 -20,70 Z" opacity="0.85" />
          {/* fourth frond — lower right */}
          <path d="M -25,-15 C 30,60 90,100 170,200 C 110,210 40,165 5,100 Z" opacity="0.78" />
          {/* small leaf — far right */}
          <path d="M -25,-15 C 60,10 160,0 310,30 C 270,65 150,60 50,40 Z" opacity="0.7" />
        </g>

        {/* RIGHT palm cluster */}
        <g fill="#07101f">
          {/* main frond — upper left */}
          <path d="M 400,-15 C 355,5 295,-30 155,10 C 185,55 295,50 365,35 Z" opacity="0.95" />
          {/* second frond — spreading left */}
          <path d="M 400,-15 C 365,30 275,20 95,55 C 135,100 265,95 345,70 Z" opacity="0.88" />
          {/* third frond — drooping down */}
          <path d="M 400,-15 C 375,50 355,120 325,230 C 370,220 390,160 395,70 Z" opacity="0.85" />
          {/* fourth frond — lower left */}
          <path d="M 400,-15 C 345,60 285,100 205,200 C 265,210 335,165 370,100 Z" opacity="0.78" />
          {/* small leaf — far left */}
          <path d="M 400,-15 C 315,10 215,0 65,30 C 105,65 225,60 325,40 Z" opacity="0.7" />
        </g>
      </svg>

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate("/daily-check")}
        className="absolute top-5 left-5 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full transition-opacity hover:opacity-60 text-sm"
        style={{ backgroundColor: "rgba(58,46,42,0.08)", color: "rgba(58,46,42,0.60)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Home
      </button>

      {/* ── Close button ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate("/breathe")}
        className="absolute top-5 right-5 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
        style={{ backgroundColor: "rgba(58,46,42,0.08)" }}
      >
        <X className="w-5 h-5 text-foreground" />
      </button>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-col items-center pt-12 pb-2 px-6">
        {/* Bullseye / target icon */}
        <div className="relative flex items-center justify-center mb-1">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" stroke={pattern.color} strokeWidth="1.2" fill="none" opacity="0.4" />
            <circle cx="20" cy="20" r="12" stroke={pattern.color} strokeWidth="1.2" fill="none" opacity="0.55" />
            <circle cx="20" cy="20" r="6"  stroke={pattern.color} strokeWidth="1.2" fill="none" opacity="0.7" />
            <circle cx="20" cy="20" r="2"  fill={pattern.color} opacity="0.8" />
          </svg>
        </div>
        <p className="text-xs mb-5" style={{ color: "rgba(58,46,42,0.35)" }}>
          {pattern.totalMinutes} min
        </p>

        {/* Emotion title */}
        <h1 className="text-4xl font-bold text-foreground mb-1" style={{ letterSpacing: "-0.3px" }}>
          {pattern.label}
        </h1>
        <p className="text-sm text-center" style={{ color: "rgba(160,180,220,0.6)" }}>
          {pattern.tagline}
        </p>
      </div>

      {/* ── Wave + circle ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative z-10" style={{ minHeight: 240 }}>
        {/* Wave line — viewBox 0 0 100 100, preserveAspectRatio=none → always edge-to-edge */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          style={{ overflow: "visible" }}
        >
          <motion.path
            d={wavePath}
            stroke={pattern.color}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            fill="none"
            opacity={running ? 0.72 : 0.3}
            strokeLinecap="round"
          />
        </svg>

        {/* Circle orb — HTML div so it stays perfectly circular at any viewport */}
        <motion.div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: circleTopStr,
            x: "-50%",
            y: "-50%",
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "#0B1628",
            border: `1.5px solid ${pattern.color}`,
            opacity: running ? 1 : 0.45,
            boxShadow: `0 0 22px 4px ${pattern.color}22`,
          }}
        />
      </div>

      {/* ── Phase label + timer ────────────────────────────────────────────── */}
      <div className="relative z-20 flex flex-col items-center pb-3">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.p
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-3xl font-semibold text-foreground mb-1"
            >
              Done ✓
            </motion.p>
          ) : (
            <motion.p
              key={running ? currentPhase.name : "idle"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-semibold text-foreground mb-1"
            >
              {running ? currentPhase.text : "—"}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-sm tabular-nums mb-6" style={{ color: "rgba(58,46,42,0.28)" }}>
          {running && !done ? timeLeftStr : `${pattern.totalMinutes}:00`}
        </p>

        {/* CTA button */}
        {!running && !done && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={start}
            className="mb-5 px-8 py-3 rounded-2xl text-foreground font-semibold text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: pattern.color + "33", border: `1px solid ${pattern.color}55`, color: "rgba(58,46,42,0.90)" }}
          >
            start · {pattern.totalMinutes} min
          </motion.button>
        )}
        {done && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={() => navigate("/breathe")}
            className="mb-5 px-8 py-3 rounded-2xl text-foreground font-semibold text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: pattern.color + "33", border: `1px solid ${pattern.color}55` }}
          >
            back to breathe
          </motion.button>
        )}

        {/* Bottom icon bar */}
        <div className="flex items-center gap-4 pb-8">
          {/* Voice guide toggle */}
          <button
            type="button"
            aria-label={voiceOn ? "disable voice guide" : "enable voice guide"}
            onClick={toggleVoice}
            disabled={voiceLoading}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:opacity-80"
            style={{
              backgroundColor: voiceOn ? pattern.color + "22" : "rgba(58,46,42,0.06)",
              border: `1px solid ${voiceOn ? pattern.color + "55" : "rgba(58,46,42,0.07)"}`,
              opacity: voiceLoading ? 0.6 : 1,
            }}
          >
            {voiceLoading
              ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: pattern.color, borderTopColor: "transparent" }} />
              : <UserRound className="w-5 h-5" style={{ color: voiceOn ? pattern.color : "rgba(58,46,42,0.35)" }} />
            }
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            aria-label={soundOn ? "mute sound" : "unmute sound"}
            onClick={toggleSound}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:opacity-80"
            style={{
              backgroundColor: soundOn ? pattern.color + "22" : "rgba(58,46,42,0.06)",
              border: `1px solid ${soundOn ? pattern.color + "55" : "rgba(58,46,42,0.07)"}`,
            }}
          >
            {soundOn
              ? <Music2  className="w-5 h-5" style={{ color: pattern.color }} />
              : <VolumeX className="w-5 h-5" style={{ color: "rgba(58,46,42,0.30)" }} />
            }
          </button>

          {/* Haptic (decorative) */}
          <button
            type="button"
            aria-label="haptic"
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: "rgba(58,46,42,0.06)", border: "1px solid rgba(58,46,42,0.07)" }}
          >
            <Vibrate className="w-5 h-5" style={{ color: pattern.color }} />
          </button>
        </div>
      </div>
    </div>
  );
}
