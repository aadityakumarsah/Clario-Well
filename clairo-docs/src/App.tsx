import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import lottie from "lottie-web";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CodeXml,
  Copy,
  Database,
  KeyRound,
  Laptop,
  Layers3,
  LockKeyhole,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Rocket,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Target,
  Terminal,
  Timer,
  Heart,
  Wind,
  Brush,
  PenTool,
  Activity,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumPrebook } from "@/components/PremiumPrebook";

gsap.registerPlugin(ScrollTrigger);

type Icon = typeof Sprout;
type NavItem = { id: string; label: string; icon: Icon };

const learnerNavigation: NavItem[] = [
  { id: "start", label: "Getting started", icon: Rocket },
  { id: "product-tour", label: "Visual product tour", icon: Smartphone },
  { id: "daily-ritual", label: "Your daily ritual", icon: Target },
  { id: "breathe", label: "Calibrated breathing", icon: Wind },
  { id: "relief", label: "Creative relief", icon: Brush },
  { id: "premium", label: "Premium pre-booking", icon: Sparkles },
  { id: "privacy", label: "Privacy & control", icon: ShieldCheck },
];



const heroVideoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4";
const playStoreUrl = "#";
const bloomPalette = ["#E795A6", "#EEA3B2", "#D77C93", "#F3B0BC", "#E38CA0"];

type TourStep = {
  id: string;
  group: "Daily Ritual" | "Calming Breath" | "Creative Relief" | "Insights & Journaling";
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  callout: string;
};

function PlayStoreMark() {
  return <svg viewBox="0 0 36 40" aria-hidden="true"><path fill="#52C7EA" d="M3 3.5 21.7 20 3 36.5Z" /><path fill="#83D353" d="m21.7 20 5.4 4.8L8.2 36.2 3 36.5Z" /><path fill="#F7C74A" d="m3 3.5 5.2.3 18.9 11.4-5.4 4.8Z" /><path fill="#F46D6D" d="M27.1 15.2c4.7 2.8 4.7 6.8 0 9.6L21.7 20Z" /></svg>;
}

function AppStoreMark() {
  return <svg viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="m10 29 9-18 8 18M13 23h13M23 9l2.2-3.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" /></svg>;
}

const productTour: TourStep[] = [
  { id: "morning-energy", group: "Daily Ritual", image: "/picture/1-7inch.png", eyebrow: "Morning Check-In", title: "Morning Energy — Hydration & Presence", description: "Begin your day with conscious presence. Clario prompts you to drink water—not to check off a box, but as a deliberate act of self-kindness before the day's noise begins.", callout: "Start your morning with a quiet anchor and gentle hydration." },
  { id: "midday-refill", group: "Daily Ritual", image: "/picture/2-7inch.png", eyebrow: "Midday Check-In", title: "Day Refill — Reconnect with your Body", description: "Interrupt the midday fog with a 40-second movement break: five camera-tracked squats. Our built-in hand and skeleton tracker reminds you that you have a body that needs care.", callout: "A brief, screen-interrupted pause to ground your physical self." },
  { id: "night-summary", group: "Daily Ritual", image: "/picture/3-7inch.png", eyebrow: "Night Check-In", title: "Night Summary — Live Voice Journaling", description: "Talk freely and unburden yourself. Clario's Gemini-powered voice agent listens with absolute privacy, then mirrors back patterns, gentle insights, and emotional weights.", callout: "Speak your thoughts aloud without structured prompts or judgment." },
  { id: "garden-bloom", group: "Daily Ritual", image: "/picture/4-7inch.png", eyebrow: "Visual Progress", title: "Home Garden — Watch Effort Bloom", description: "Each check-in nurtures your home garden. Plants grow and flowers open as you show up for yourself. If you miss a day, the garden doesn't wilt—it just waits.", callout: "A pressure-free visual reflection of showing up for yourself." },
  { id: "calibrated-breathe", group: "Calming Breath", image: "/picture/5-7inch.png", eyebrow: "Biofeedback", title: "Calibrated Breathing for Every Emotion", description: "Not a generic timer. Clario selects a breathing ratio (like 4s inhale to 6s exhale for anxiety) calibrated to your current nervous system state to stimulate the vagus nerve.", callout: "Breathing patterns scientifically tailored to soothe specific feelings." },
  { id: "guided-audio", group: "Calming Breath", image: "/picture/6-7inch.png", eyebrow: "Sensory Cues", title: "Audio Guidance for Mindful Rhythm", description: "Close your eyes and breathe. Real recorded inhale and exhale audio cues play at the exact right moment, designed to respect iOS/Android audio limits and keep you present.", callout: "Full acoustic cues so you can calm down without looking at your screen." },
  { id: "air-drawing", group: "Creative Relief", image: "/picture/7-7inch.png", eyebrow: "In-Browser Tracking", title: "Air Drawing — Draw in the Sky", description: "When words are not enough, draw in the air using your camera. Clario uses MediaPipe Hands locally inside the browser to track your fingers in real time.", callout: "Translate your abstract emotions into fluid, beautiful strokes." },
  { id: "gemini-reports", group: "Creative Relief", image: "/picture/8-7inch.png", eyebrow: "AI Vision", title: "Vision-Powered Reflection Reports", description: "Submit your air drawing for advanced Gemini Vision analysis. Receive a beautiful, highly personalized emotional report analyzing the colors, density, and flow of your drawing.", callout: "Receive a deeply understanding, artistic translation of your creation." },
  { id: "space-blocks", group: "Creative Relief", image: "/picture/9-7inch.png", eyebrow: "Augmented Reality", title: "Space Blocks — Shape 3D Worlds", description: "Build in augmented reality in your physical room with simple hand gestures. Point to move the cursor, pinch to place a block, and open your palm to erase blocks.", callout: "Unwind by stacking tactile blocks on an isometric AR grid." },
  { id: "ar-grid-mechanics", group: "Creative Relief", image: "/picture/10-7inch.png", eyebrow: "Gesture Control", title: "Tactile Interactive Blocks", description: "Interact with eight beautiful block types on an isometric canvas. Zero server roundtrips ensure high-performance hand tracking that operates entirely in-browser.", callout: "Play, create, and find relief through physical block stacking." },
  { id: "guided-meditation", group: "Creative Relief", image: "/picture/11-7inch.png", eyebrow: "Stillness", title: "Meditation Sessions on Demand", description: "When breath work isn't enough, stop completely. Access guided meditation sessions designed to silence active thoughts and halt emotional spirals.", callout: "Guided stillness ready whenever you need to fully stop." },
  { id: "mood-dashboard", group: "Insights & Journaling", image: "/picture/12-7inch.png", eyebrow: "Emotional History", title: "Emotional Story Dashboard", description: "Visualize your check-in consistency, mood trends, and call reports over time. Your emotional history is summarized as insight, not data surveillance.", callout: "Track your mind's patterns across days and weeks privately." },
  { id: "dark-journal", group: "Insights & Journaling", image: "/picture/13-7inch.png", eyebrow: "Quiet Expression", title: "Private Searchable Journal", description: "A gorgeous, minimal journal that is dark mode by default because most reflections happen at night. Write down the things you can't say out loud.", callout: "A beautiful, intimate journal to capture late-night thoughts." },
  { id: "pwa-installable", group: "Insights & Journaling", image: "/picture/14-7inch.png", eyebrow: "Desktop & Mobile", title: "Install Clario Anywhere as a PWA", description: "Add Clario to your home screen using Chrome or Safari. Our service worker and manifest allow Clario to run fullscreen with no browser borders, like a native app.", callout: "Install Clario as a lightweight, beautiful companion on your devices." },
];

function StatusPill({ children, tone = "available" }: { children: ReactNode; tone?: "available" | "planned" }) {
  const palette = tone === "available"
    ? "border-[#CFE1CB] bg-[#F1F8EF] text-vokai-forest"
    : "border-[#F0D9A8] bg-[#FFF8E8] text-[#9C7026]";

  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${palette}`}><span className="size-1.5 rounded-full bg-current" />{children}</span>;
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800 bg-[#1F2B23] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium text-stone-300">{title}</span>
        <button onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-stone-300 transition hover:bg-white/10 hover:text-white" aria-label={`Copy ${title}`}>
          {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-[#E8F2E5]"><code>{code}</code></pre>
    </div>
  );
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="mb-2 text-xs font-bold tracking-[0.16em] text-vokai-forest uppercase">{eyebrow}</p>
      <h2 className="font-display text-3xl tracking-tight text-vokai-ink sm:text-4xl">{title}</h2>
      <div className="mt-3 text-[15px] leading-7 text-stone-600">{children}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, children, status }: { icon: Icon; title: string; children: ReactNode; status?: "available" | "planned" }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_2px_10px_rgba(51,67,49,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-xl bg-vokai-moss text-vokai-forest"><Icon className="size-5" /></div>{status && <StatusPill tone={status}>{status}</StatusPill>}</div>
      <h3 className="font-semibold text-vokai-ink">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-stone-600">{children}</div>
    </div>
  );
}

function ProductTour() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = productTour[activeIndex];
  const selectStep = (index: number) => setActiveIndex((index + productTour.length) % productTour.length);
  const groups: TourStep["group"][] = ["Daily Ritual", "Calming Breath", "Creative Relief", "Insights & Journaling"];
  return (
    <section id="product-tour" className="scroll-mt-24 border-b border-stone-200 py-16">
      <SectionTitle eyebrow="See Clario in action" title="A visual guide through every part of your emotional journey.">Choose a feature on the right to see the exact screen and a quick explanation of what that part of Clario does.</SectionTitle>
      <div className="grid gap-8 xl:grid-cols-[minmax(290px,.8fr)_minmax(0,1.2fr)] xl:items-start">
        <div className="xl:sticky xl:top-24">
          <div className="tour-stage relative">
            <Button variant="outline" size="icon" className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 rounded-full border-stone-200 bg-white/90 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white" onClick={() => selectStep(activeIndex - 1)} aria-label="Show previous guide screen"><ChevronLeft className="size-5 text-stone-700" /></Button>
            <Button variant="outline" size="icon" className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 rounded-full border-stone-200 bg-white/90 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white" onClick={() => selectStep(activeIndex + 1)} aria-label="Show next guide screen"><ChevronRight className="size-5 text-stone-700" /></Button>

            <div className="tour-visual-row">
              <div className="tour-phone-shell">
                <img key={active.id} className="tour-phone-image" src={active.image} alt={`${active.title} screen in Clario`} />
              </div>
              <div className="tour-callout" aria-live="polite"><ArrowRight className="tour-callout-arrow size-4" aria-hidden="true" /><span>{active.callout}</span></div>
            </div>
            <div className="mt-6 text-center text-xs font-semibold text-stone-500">
              {activeIndex + 1} of {productTour.length}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-[#D5E5D1] bg-[#F1F8EF] p-4">
            <p className="text-[11px] font-bold tracking-[0.15em] text-vokai-forest uppercase">{active.eyebrow}</p>
            <h3 className="mt-1 font-display text-2xl text-vokai-ink">{active.title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">{active.description}</p>
          </div>
        </div>

        <div className="space-y-7">
          {groups.map((group) => {
            const steps = productTour.map((step, index) => ({ step, index })).filter(({ step }) => step.group === group);
            return <div key={group}>
              <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-stone-400 uppercase">{group}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map(({ step, index }) => {
                  const isActive = index === activeIndex;
                  return <button key={step.id} type="button" onClick={() => selectStep(index)} aria-label={`View Clario features: ${step.title}`} className={`tour-step-card text-left ${isActive ? "tour-step-card-active" : ""}`} aria-pressed={isActive}>
                    <div className="tour-step-thumb"><img src={step.image} alt={`${step.title} thumbnail preview`} /><span className="tour-step-number">{String(index + 1).padStart(2, "0")}</span>{isActive && <span className="tour-step-viewing">Viewing</span>}</div>
                    <div className="min-w-0"><p className="text-[10px] font-bold tracking-[0.13em] text-vokai-forest uppercase">{step.eyebrow}</p><h3 className="mt-1 text-sm font-semibold leading-5 text-vokai-ink">{step.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{step.description}</p></div>
                  </button>;
                })}
              </div>
            </div>;
          })}
        </div>
      </div>
    </section>
  );
}

function FooterFlower() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/footer-animation-growing-flower/Flower growing Lottie JSON animation.json",
    });
    return () => anim.destroy();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 mt-12 border border-[#E7E9E0] bg-[#F5F2EB]/40 rounded-3xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
      <div ref={containerRef} className="size-56 max-w-[280px]" />
      <p className="mt-5 font-display text-xl italic text-[#9B6F64] max-w-lg leading-relaxed font-medium">
        "To everyone currently feeling down, but holding onto the quiet courage to make their life better over the next 90 days: you are simply preparing to bloom. Take it one gentle day at a time, and watch yourself grow."
      </p>
      <p className="mt-2 text-xs text-stone-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 justify-center">
        <span className="size-1.5 rounded-full bg-rose-400" /> For the hard days · Clario
      </p>
    </div>
  );
}

function NavLinks({ items }: { items: NavItem[] }) {
  return (
    <nav className="space-y-1">
      {items.map(({ id, label, icon: Icon }) => (
        <a key={id} href={`#${id}`} aria-label={`Navigate to ${label} section`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-white hover:text-vokai-ink">
          <Icon className="size-4 text-stone-400" /> {label}
        </a>
      ))}
    </nav>
  );
}

function App() {
  const [sidebarHidden, setSidebarHidden] = useState(true);
  const [heroSoundEnabled, setHeroSoundEnabled] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [appStoreComingSoon, setAppStoreComingSoon] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const guideRevealRef = useRef<HTMLDivElement>(null);
  const bloomLayerRef = useRef<HTMLDivElement>(null);
  const lastTrailPetalAtRef = useRef(0);
  const navigateToPremium = () => {
    window.history.pushState({}, "", "#premium");
    window.requestAnimationFrame(() => document.getElementById("premium")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const attemptHeroPlayback = () => {
    const video = heroVideoRef.current;
    if (!video || heroSoundEnabled) return;
    video.muted = false;
    video.volume = 0.8;
    void video.play().then(() => setHeroSoundEnabled(true)).catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    attemptHeroPlayback();
    const unlockSound = () => attemptHeroPlayback();
    const unlockEvents: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown", "wheel", "scroll"];
    unlockEvents.forEach((eventName) => window.addEventListener(eventName, unlockSound, { once: true, passive: true }));
    return () => unlockEvents.forEach((eventName) => window.removeEventListener(eventName, unlockSound));
  }, []);

  const createCursorBloom = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !bloomLayerRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bloom = document.createElement("span");
    bloom.className = "cursor-bloom";
    bloom.style.left = `${event.clientX}px`;
    bloom.style.top = `${event.clientY}px`;

    const flower = document.createElement("span");
    flower.className = "cursor-bloom-flower";
    bloom.appendChild(flower);

    const burstPaths = Array.from({ length: 9 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 11 + Math.random() * 27;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance * (0.65 + Math.random() * 0.55),
        rotation: -95 + Math.random() * 190,
        scale: 0.45 + Math.random() * 0.65,
      };
    });

    Array.from({ length: 9 }, (_, index) => index).forEach((index) => {
      const petal = document.createElement("span");
      petal.className = "cursor-bloom-petal";
      petal.style.setProperty("--bloom-color", bloomPalette[index % bloomPalette.length]);
      petal.style.setProperty("--bloom-angle", `${Math.round(Math.random() * 180 - 90)}deg`);
      petal.style.setProperty("--bloom-width", `${7 + Math.round(Math.random() * 7)}px`);
      petal.style.setProperty("--bloom-height", `${4 + Math.round(Math.random() * 5)}px`);
      flower.appendChild(petal);
    });

    const core = document.createElement("span");
    core.className = "cursor-bloom-core";
    flower.appendChild(core);
    bloomLayerRef.current.appendChild(bloom);

    const petals = Array.from(flower.querySelectorAll<HTMLElement>(".cursor-bloom-petal"));
    gsap.set(flower, { transformOrigin: "center center", scale: 0.2, rotation: -20 });
    gsap.to(flower, { scale: 1.02, rotation: 14, duration: 0.26, ease: "back.out(2)" });
    gsap.to(petals, {
      x: (index) => burstPaths[index].x,
      y: (index) => burstPaths[index].y,
      rotation: (index) => burstPaths[index].rotation,
      scale: (index) => burstPaths[index].scale,
      duration: 0.3,
      ease: "power2.out",
      stagger: 0.01,
    });
    gsap.to(bloom, { autoAlpha: 0, duration: 0.14, delay: 0.2, ease: "power2.in", onComplete: () => bloom.remove() });
  };

  const createCursorPetalTrail = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !bloomLayerRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const now = performance.now();
    if (now - lastTrailPetalAtRef.current < 170) return;
    lastTrailPetalAtRef.current = now;

    const petalCount = Math.random() > 0.8 ? 2 : 1;
    Array.from({ length: petalCount }, (_, index) => index).forEach((index) => {
      const petal = document.createElement("span");
      petal.className = "cursor-trail-petal";
      petal.style.left = `${event.clientX + (index ? 4 : -2)}px`;
      petal.style.top = `${event.clientY + (index ? -3 : 2)}px`;
      petal.style.setProperty("--bloom-color", bloomPalette[Math.floor(Math.random() * bloomPalette.length)]);
      petal.style.setProperty("--bloom-width", `${7 + Math.round(Math.random() * 5)}px`);
      petal.style.setProperty("--bloom-height", `${4 + Math.round(Math.random() * 4)}px`);
      bloomLayerRef.current?.appendChild(petal);

      gsap.fromTo(petal,
        { autoAlpha: 0.9, scale: 0.5, rotation: -80 + Math.random() * 160 },
        {
          autoAlpha: 0,
          x: -15 + Math.random() * 30,
          y: 12 + Math.random() * 22,
          rotation: -160 + Math.random() * 320,
          scale: 0.9 + Math.random() * 0.35,
          duration: 0.48,
          ease: "power2.out",
          onComplete: () => petal.remove(),
        },
      );
    });
  };

  const showAppStoreComingSoon = () => {
    setAppStoreComingSoon(true);
    window.setTimeout(() => setAppStoreComingSoon(false), 2200);
  };

  return (
    <div className="docs-theme min-h-screen" onPointerDown={createCursorBloom} onPointerMove={createCursorPetalTrail}>
      <div ref={bloomLayerRef} className="cursor-bloom-layer" aria-hidden="true" />
      <header className="landing-header">
        <div className="landing-header-inner">
          <a href="#start" className="landing-brand" aria-label="Clario - Your Daily Emotional Companion">
            <span className="landing-brand-mark"><Heart className="size-5 text-rose-400 fill-rose-400" /></span>
            <span className="font-display font-semibold tracking-wide">Clario</span>
          </a>
          <nav className="landing-nav" aria-label="Landing page navigation">
            <a href="#product-tour" aria-label="Explore Clario product features and visual tour">Features</a>
            <a href="#daily-journey" aria-label="Track your emotional daily progress and garden">Progress</a>
            <a href="#breathe" aria-label="Calibrated breathing exercises">Breathe</a>
            <a href="#relief" aria-label="Creative relief modules">Relief</a>
            <a href="#privacy" aria-label="Review our privacy principles and data control">Privacy</a>
          </nav>
          <div className="landing-header-actions">
            <a className="landing-prebook-link" href="#premium" aria-label="Pre-book Clario Premium emotional companion plan" onClick={(event) => { event.preventDefault(); navigateToPremium(); }}><Sparkles className="size-3.5" /> Pre-book</a>
            <div className={`landing-store-menu ${storeMenuOpen ? "is-open" : ""}`}>
              <button type="button" className="landing-journey-button" onClick={() => setStoreMenuOpen((open) => !open)} aria-expanded={storeMenuOpen} aria-haspopup="menu" aria-label="Toggle download options menu for Clario application">
                Begin journey <ChevronDown className="size-4" />
              </button>
              <div className="landing-store-popover" role="menu" aria-label="Download Clario">
                <button type="button" className="store-option" onClick={navigateToPremium} role="menuitem" aria-label="Pre-book Clario Premium"><Sparkles className="size-5" /><span>Pre-book Premium</span></button>
                <a className="store-option" href={playStoreUrl} target="_blank" rel="noreferrer" role="menuitem" aria-label="Get Clario on Google Play"><PlayStoreMark /><span>Google Play</span></a>
                <button type="button" className="store-option" onClick={showAppStoreComingSoon} role="menuitem" aria-label="Get Clario on the App Store"><AppStoreMark /><span>App Store</span></button>
                {appStoreComingSoon && <p className="landing-store-notice" role="status">App Store coming soon</p>}
              </div>
            </div>
          </div>
          <a className="landing-mobile-prebook" href="#premium" aria-label="Pre-book Clario Premium coding plan on mobile" onClick={(event) => { event.preventDefault(); navigateToPremium(); }}><Sparkles className="size-3.5" /><span>Pre-book</span></a>
        </div>
      </header>

      <section ref={heroSectionRef} id="start" className="docs-hero" onPointerDown={attemptHeroPlayback}>
        <video ref={heroVideoRef} className="docs-hero-video object-cover" autoPlay loop playsInline controls={false} muted={!heroSoundEnabled} preload="auto" disablePictureInPicture disableRemotePlayback aria-hidden="true">
          <source src={heroVideoUrl} type="video/mp4" />
        </video>
        <div className="docs-hero-scrim bg-black/40" aria-hidden="true" />
        <div ref={heroContentRef} className="docs-hero-content">
          <div className="docs-hero-copy">
            <h1>Make room for your <span>feelings.</span><span className="sr-only"> Emotion support with Clario</span></h1>
            <p>Personalized, private mental wellness built for the moments when you are running on empty. Guide your breathing, express yourself through interactive gestures, and reflect out loud with a secure voice companion.</p>
          </div>
          <a className="landing-hero-cta" href="#daily-journey" aria-label="Begin your emotional journey with Clario"><Play className="size-4 fill-current animate-pulse" /> Begin journey</a>
        </div>
        <a className="landing-scroll-cue animate-bounce" href="#guide" aria-label="Scroll to the Clario guide"><ChevronDown /></a>
      </section>

      <div ref={guideRevealRef} className={`docs-guide-shell mx-auto grid max-w-[1440px] ${sidebarHidden ? "lg:grid-cols-1" : "lg:grid-cols-[260px_minmax(0,1fr)]"}`}>
        <aside id="docs-sidebar" className={`hidden fixed inset-x-0 top-[5.5rem] z-30 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-b-[1.5rem] border-b border-stone-200 bg-[#F8F6F0] p-4 shadow-[0_20px_44px_rgba(36,51,40,.18)] ${sidebarHidden ? "lg:hidden" : "lg:sticky lg:top-0 lg:block lg:h-screen lg:rounded-none lg:border-r lg:border-b-0 lg:px-5 lg:py-8 lg:shadow-none"}`}>
          <p className="mb-3 px-3 text-[11px] font-bold tracking-[0.16em] text-stone-400 uppercase">For users</p>
          <NavLinks items={learnerNavigation} />

          <div className="mt-8 rounded-2xl bg-vokai-ink p-4 text-white">
            <p className="text-xs font-semibold text-[#B8D6B6]">A note on privacy</p>
            <p className="mt-1 text-sm leading-5 text-stone-200">Your reflections should feel supportive, never silently surveilled. Clario does not track your apps, and your audio transcripts stay fully private.</p>
            <a href="#privacy" aria-label="Read our core privacy and user control principles" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#CBE3C7] hover:text-white">Read privacy principles <ArrowRight className="size-3" /></a>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-9 sm:px-8 lg:px-14 lg:py-14">
          <section id="guide" className="scroll-mt-6 border-b border-stone-200 pb-16">
            <div className="mb-10 flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div><p className="text-[11px] font-bold tracking-[0.16em] text-vokai-forest uppercase">The Clario guide</p><p className="mt-1 text-sm text-stone-500">Everything you need to build a calm daily emotional practice.</p></div>
              <Button variant="outline" size="icon" className="hidden lg:inline-flex" onClick={() => setSidebarHidden((hidden) => !hidden)} aria-controls="docs-sidebar" aria-expanded={!sidebarHidden} aria-label={sidebarHidden ? "Show guide" : "Hide guide"}>
                {sidebarHidden ? <PanelLeftOpen /> : <PanelLeftClose />}
              </Button>
            </div>
            <SectionTitle eyebrow="Start here" title="Nurture your mind with presence.">Clario weaves AI conversation, biofeedback, and creative expression into a single daily ritual: three check-ins, a tailored breathing session, and a serene visual garden.</SectionTitle>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <FeatureCard icon={Heart} title="Three gentle daily anchors" status="available">Morning hydration, a 40-second midday movement break, and a private evening voice summary with a secure AI companion.</FeatureCard>
              <FeatureCard icon={Wind} title="Science-backed breathing" status="available">Exercises calibrated to your exact emotion—from anxiety to sadness—designed to physically cool the nervous system.</FeatureCard>
              <FeatureCard icon={Brush} title="Creative expression relief" status="available">In-browser finger air drawing with Gemini Vision reflection, and augmented reality block building using local gesture tracking.</FeatureCard>
            </div>
          </section>

          <ProductTour />

          <PremiumPrebook />

          <section id="daily-journey" className="scroll-mt-24 border-b border-stone-200 py-16">
            <SectionTitle eyebrow="01 · Your daily ritual" title="Three gentle anchors throughout your day.">Clario is designed around the moments when you are running on empty—helping you ground yourself with zero pressure or gamification hooks.</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative rounded-2xl border border-stone-200 bg-white p-5"><span className="absolute right-4 top-4 text-3xl font-display text-vokai-moss">01</span><h3 className="font-semibold text-vokai-ink">Morning hydration</h3><p className="mt-2 text-sm leading-6 text-stone-600">Drink water not to cross off a checklist, but as a deliberate act of care before the busy day starts.</p></div>
              <div className="relative rounded-2xl border border-stone-200 bg-white p-5"><span className="absolute right-4 top-4 text-3xl font-display text-vokai-moss">02</span><h3 className="font-semibold text-vokai-ink">Midday body refill</h3><p className="mt-2 text-sm leading-6 text-stone-600">Complete 5 squats tracked locally by your camera. The goal is to remind you that you have a physical body that needs you.</p></div>
              <div className="relative rounded-2xl border border-stone-200 bg-white p-5"><span className="absolute right-4 top-4 text-3xl font-display text-vokai-moss">03</span><h3 className="font-semibold text-vokai-ink">Night voice summary</h3><p className="mt-2 text-sm leading-6 text-stone-600">Speak out loud. A Gemini-powered voice companion listens securely to your day and mirrors back compassionate insights.</p></div>
            </div>
            <div className="mt-5 rounded-2xl border border-[#D7E7D3] bg-[#F2F9F0] p-5 text-sm leading-6 text-stone-700"><strong className="text-vokai-ink">The Clario Philosophy:</strong> Most wellness apps crave constant screen-time. Clario is built for the minimum effective dose of presence. You complete your ritual, close the app, and go live your life.</div>
          </section>

          <section id="breathe" className="scroll-mt-24 border-b border-stone-200 py-16">
            <SectionTitle eyebrow="02 · Calibrated breathing" title="Evidence-based breathing patterns for every emotion.">Select exactly how you feel, and Clario structures a breathing technique tuned to soothe that specific state. Recorded audio cues keep you present without looking at your screen.</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard icon={Wind} title="Anxiety & Stress (4-6)" status="available">Extended exhalations actively stimulate the vagus nerve to slow your heart rate fast.</FeatureCard>
              <FeatureCard icon={AlertCircle} title="Anger & Irritation (4-8)" status="available">The longest exhalation to immediately cool down a hyperactive sympathetic nervous system.</FeatureCard>
              <FeatureCard icon={Smile} title="Sadness & Worry (4-5)" status="available">Gentle parasympathetic dominance to help shift your mind from repetitive worry loops.</FeatureCard>
            </div>
          </section>

          <section id="relief" className="scroll-mt-24 border-b border-stone-200 py-16">
            <SectionTitle eyebrow="03 · Creative relief" title="When words are not enough, use your hands.">Express your feelings physically. Real-time, in-browser hand tracking allows you to draw or build 3D spaces with absolute fluidity.</SectionTitle>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-3xl bg-vokai-ink p-7 text-white">
                <Brush className="size-7 text-[#BFE2BC]" />
                <h3 className="mt-8 font-display text-3xl">In-browser MediaPipe hand gestures.</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-stone-300">
                  Draw in the air or build interactive blocks in augmented reality (AR) entirely through camera-based tracking. Zero server roundtrips ensure high-performance, low-latency movement.
                </p>
              </div>
              <div className="space-y-4">
                <FeatureCard icon={PenTool} title="Air Drawing & Vision Reports" status="available">
                  Trace lines in the sky with your finger. Gemini Vision analyzes your final strokes to provide a highly reflective emotional summary.
                </FeatureCard>
                <FeatureCard icon={Box} title="Space Blocks AR" status="available">
                  A 3D sandbox in your physical living room. Point to focus, pinch to stack blocks, and open your palm to clear them.
                </FeatureCard>
              </div>
            </div>
          </section>

          <section id="privacy" className="scroll-mt-24 border-b border-stone-200 py-16">
            <SectionTitle eyebrow="04 · Privacy & control" title="Your wellness data should serve you, not surveil you.">Clario is designed around complete, end-to-end data ownership. We do not sell your entries, and we do not monitor your screen activity.</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <LockKeyhole className="size-5 text-vokai-forest" />
                <h3 className="mt-4 font-semibold text-vokai-ink">Secure Local Auth</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">Your profile, setting choices, and calendar entries are secured by Supabase JWT tokens.</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <ShieldCheck className="size-5 text-vokai-forest" />
                <h3 className="mt-4 font-semibold text-vokai-ink">In-Browser AI Processing</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">Hand tracking runs entirely inside your browser tab. Video streams are never sent or recorded by our backend.</p>
              </div>
              <div className="rounded-2xl border border-[#F0D9A8] bg-[#FFF9EB] p-5">
                <AlertCircle className="size-5 text-[#9C7026]" />
                <h3 className="mt-4 font-semibold text-vokai-ink">Compassionate Companion</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">No hidden trackers, no push notifications begging you to return, and zero monetization of your vulnerability.</p>
              </div>
            </div>
          </section>

          <FooterFlower />

          <footer className="border-t border-stone-200 py-8 text-sm text-stone-500 mt-10">
            Built with care. For the hard days. <a href="https://github.com/aadityakumarsah/clario" aria-label="View Clario open-source repository on GitHub" className="font-medium text-vokai-forest hover:underline">View Clario on GitHub</a>.
          </footer>
        </main>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-vokai-forest text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-vokai-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vokai-forest focus-visible:ring-offset-2 ${
          showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="size-5" />
      </button>
    </div>
  );
}

export default App;
