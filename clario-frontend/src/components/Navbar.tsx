import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Languages, CheckSquare, LayoutDashboard,
  Wind, Brain, BookOpen, Settings, Smile, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import i18n from "@/i18n";
import { useState } from "react";

// ─── Desktop nav keeps all items ────────────────────────────────────────────
const DESKTOP_NAV = [
  { label: "Check",      path: "/daily-check" },
  { label: "Dashboard",  path: "/dashboard"   },
  { label: "Breathe",    path: "/breathe"     },
  { label: "Relief",     path: "/relief"      },
  { label: "Meditation", path: "/meditation"  },
  { label: "Journal",    path: "/journal"     },
  { label: "Settings",   path: "/settings"    },
];

// ─── Mobile tab bar: 5 items, Breathe/Relief/Meditation → "Mood" ────────────
const MOBILE_TABS = [
  { label: "Check",     path: "/daily-check",  Icon: CheckSquare   },
  { label: "Dashboard", path: "/dashboard",    Icon: LayoutDashboard },
  { label: "Mood",      path: null,            Icon: Smile          }, // opens sheet
  { label: "Journal",   path: "/journal",      Icon: BookOpen       },
  { label: "Settings",  path: "/settings",     Icon: Settings       },
] as const;

// ─── Mood sheet options ──────────────────────────────────────────────────────
const MOOD_OPTIONS_DARK = [
  {
    label: "Breathe",
    path: "/breathe",
    Icon: Wind,
    color: "hsl(var(--primary))",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.25)",
    desc: "Guided breathing for your emotion",
  },
  {
    label: "Relief",
    path: "/relief",
    Icon: Smile,
    color: "#34D399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.25)",
    desc: "Air drawing & creative mindfulness",
  },
  {
    label: "Meditation",
    path: "/meditation",
    Icon: Brain,
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
    desc: "Guided meditation sessions",
  },
];

const MOOD_OPTIONS_LIGHT = [
  {
    label: "Breathe",
    path: "/breathe",
    Icon: Wind,
    color: "#4A7B6F",
    bg: "rgba(74,123,111,0.08)",
    border: "rgba(74,123,111,0.2)",
    desc: "Guided breathing for your emotion",
  },
  {
    label: "Relief",
    path: "/relief",
    Icon: Smile,
    color: "#6F9A6E",
    bg: "rgba(111,154,110,0.08)",
    border: "rgba(111,154,110,0.2)",
    desc: "Air drawing & creative mindfulness",
  },
  {
    label: "Meditation",
    path: "/meditation",
    Icon: Brain,
    color: "#B79BBF",
    bg: "rgba(183,155,191,0.1)",
    border: "rgba(183,155,191,0.25)",
    desc: "Guided meditation sessions",
  },
];

// Pages that render their own full-screen UI — hide navbar entirely on mobile
const FULLSCREEN_PATHS = [
  "/breathe/",
  "/daily-check/morning",
  "/daily-check/refill",
  "/daily-check/night",
  "/meditation",
  "/relief/drawing",
  "/relief/blocks",
];

// Routes considered "Mood" for active highlight
const MOOD_PATHS = ["/breathe", "/relief", "/meditation"];

const Navbar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [currentLang, setCurrentLang] = useState(i18n.language || "en");
  const [moodOpen, setMoodOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = currentLang === "en" ? "ne" : "en";
    setCurrentLang(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem("clario-lang", newLang);
  };

  const isFullscreen = FULLSCREEN_PATHS.some((p) => location.pathname.startsWith(p));
  const isMoodActive = MOOD_PATHS.some((p) => location.pathname.startsWith(p));
  const MOOD_OPTIONS = isDark ? MOOD_OPTIONS_DARK : MOOD_OPTIONS_LIGHT;

  const handleMoodOption = (path: string) => {
    setMoodOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* ── Desktop top bar ──────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:block fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="font-display text-2xl font-semibold tracking-tight text-foreground hover:text-primary transition-colors duration-200 shrink-0"
          >
            Clario
          </Link>

          <div className="flex items-center gap-7 flex-1 justify-center">
            {DESKTOP_NAV.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`text-sm tracking-wide transition-colors duration-200 whitespace-nowrap ${
                  location.pathname === path || location.pathname.startsWith(path + "/")
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <Languages className="w-3.5 h-3.5" />
              {currentLang === "en" ? "EN" : "ने"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile top strip ─────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/40 flex items-center justify-between px-4 py-3">
          <Link
            to="/dashboard"
            className="font-display text-xl font-semibold tracking-tight text-foreground"
          >
            Clario
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Languages className="w-3.5 h-3.5" />
              {currentLang === "en" ? "EN" : "ने"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Mood bottom sheet ────────────────────────────────────────── */}
      <AnimatePresence>
        {moodOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mood-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              onClick={() => setMoodOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="mood-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="md:hidden fixed left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-8"
              style={{
                bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
                background: isDark ? "hsl(var(--card))" : "rgba(250,246,241,0.98)",
                border: isDark ? "1px solid hsl(var(--border))" : "1px solid rgba(58,46,42,0.12)",
                borderBottom: "none",
              }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(58,46,42,0.15)" }} />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-base" style={{ color: isDark ? "hsl(var(--foreground))" : "#3A2E2A" }}>Mood & Wellness</p>
                  <p className="text-xs mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(58,46,42,0.5)" }}>
                    Choose an activity
                  </p>
                </div>
                <button
                  onClick={() => setMoodOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(58,46,42,0.07)" }}
                >
                  <X className="w-4 h-4" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(58,46,42,0.5)" }} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {MOOD_OPTIONS.map(({ label, path, Icon, color, bg, border, desc }) => (
                  <motion.button
                    key={path}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMoodOption(path)}
                    className="flex items-center gap-4 w-full rounded-2xl px-4 py-3.5 text-left"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: color + "22" }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: isDark ? "hsl(var(--foreground))" : "#3A2E2A" }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(58,46,42,0.5)" }}>
                        {desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      {!isFullscreen && (
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{
            backgroundColor: isDark ? "hsl(var(--background) / 0.92)" : "rgba(250,246,241,0.94)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: isDark ? "1px solid hsl(var(--border))" : "1px solid rgba(58,46,42,0.1)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="flex items-stretch">
            {MOBILE_TABS.map(({ label, path, Icon }) => {
              const isMoodTab = path === null;
              const active = isMoodTab
                ? (moodOpen || isMoodActive)
                : (location.pathname === path || location.pathname.startsWith(path + "/"));

              if (isMoodTab) {
                return (
                  <button
                    key="mood"
                    type="button"
                    onClick={() => setMoodOpen((o) => !o)}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative"
                  >
                    <motion.div
                      animate={{ scale: active ? 1.12 : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: active ? (isDark ? "#34D399" : "#6F9A6E") : (isDark ? "rgba(255,255,255,0.32)" : "rgba(58,46,42,0.35)") }}
                        strokeWidth={active ? 2.2 : 1.6}
                      />
                    </motion.div>
                    <span
                      className="text-[9px] font-medium"
                      style={{
                        color: active ? (isDark ? "#34D399" : "#6F9A6E") : (isDark ? "rgba(255,255,255,0.28)" : "rgba(58,46,42,0.35)"),
                        letterSpacing: "0.03em",
                      }}
                    >
                      {label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute top-0 h-[2px] w-8 rounded-full"
                        style={{ backgroundColor: isDark ? "#34D399" : "#6F9A6E" }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={path}
                  to={path}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-opacity"
                  style={{ minWidth: 0 }}
                >
                  <motion.div
                    animate={{ scale: active ? 1.12 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: active ? (isDark ? "hsl(var(--primary))" : "#4A7B6F") : (isDark ? "rgba(255,255,255,0.32)" : "rgba(58,46,42,0.35)") }}
                      strokeWidth={active ? 2.2 : 1.6}
                    />
                  </motion.div>
                  <span
                    className="text-[9px] font-medium truncate w-full text-center"
                    style={{
                      color: active ? (isDark ? "hsl(var(--primary))" : "#4A7B6F") : (isDark ? "rgba(255,255,255,0.28)" : "rgba(58,46,42,0.35)"),
                      letterSpacing: "0.03em",
                    }}
                  >
                    {label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 h-[2px] w-8 rounded-full"
                      style={{ backgroundColor: isDark ? "#A78BFA" : "#4A7B6F" }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </>
  );
};

export default Navbar;
