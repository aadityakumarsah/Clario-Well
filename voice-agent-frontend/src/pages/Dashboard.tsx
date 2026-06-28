import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Flame, Sparkles, PhoneOff, FileText,
  Loader2, Zap, Clock, Activity, LogOut, Sun, Cloud, CloudRain,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceJournal } from "@/hooks/useVoiceJournal";
import { listSessions, type SessionDetailData } from "@/lib/api";
import {
  sessionDetailToPastCard,
  moodWeatherIcon,
  buildTodaySummaryFromSessions,
  buildMoodTrendSeries,
  computeJournalStreak,
  type PastSessionCardModel,
} from "@/lib/sessionReportView";
import { SESSION_LANGUAGES, type SessionLanguage } from "@/lib/sessionLanguage";
import SessionReportModal from "@/components/SessionReportModal";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const PERSONAS = [
  {
    id: "chill_overthinker", name: "Chill Overthinker",
    desc: "Gets your spirals because they spiral too",
    greeting: "Open in a relaxed, understanding tone, then ask how their day was.",
  },
  {
    id: "vanilla", name: "Vanilla",
    desc: "Default Clario style — friendly, chatty, balanced",
    greeting: "Open with a friendly, casual hello, then ask how their day was.",
  },
  {
    id: "chaotic_friend", name: "Chaotic Friend",
    desc: "Unfiltered, dramatic, calls you out (with love)",
    greeting: "Open with a quick warm hello in your playful style, then ask how their day was.",
  },
  {
    id: "older_sibling", name: "Older Sibling",
    desc: "Caring, protective, gently calls you out",
    greeting: "Open with a warm, casual check-in, then ask how their day was.",
  },
  {
    id: "insight_coach", name: "Insight Coach",
    desc: "Cuts through the noise and shows you the pattern",
    greeting: "Open calmly and kindly, then ask how their day was.",
  },
  {
    id: "calm_observer", name: "Calm Observer",
    desc: "Quiet, grounded, sees what you're not saying",
    greeting: "Open with a soft, brief greeting, then simply ask how their day was.",
  },
];

const VOICES = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede"];

export default function Dashboard() {
  const { displayName, signOut } = useAuth();
  const {
    isRecording, isConnecting, isMuted, isGeneratingReport,
    reportData, error,
    startSession, endSession, toggleMute, clearReport, clearError,
  } = useVoiceJournal();

  const [pastCards, setPastCards] = useState<PastSessionCardModel[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [archiveSession, setArchiveSession] = useState<SessionDetailData | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [selectedLang, setSelectedLang] = useState<SessionLanguage>("en");

  const loadSessions = () => {
    setSessionsLoading(true);
    setSessionsError(null);
    listSessions()
      .then((rows) => setPastCards(rows.map(sessionDetailToPastCard)))
      .catch((e) => setSessionsError(e instanceof Error ? e.message : "Could not load sessions"))
      .finally(() => setSessionsLoading(false));
  };

  useEffect(() => { loadSessions(); }, [reportData]);
  useEffect(() => { if (reportData) setArchiveSession(null); }, [reportData]);

  const modalReport = archiveSession ?? reportData;
  const closeModal = () => { clearReport(); setArchiveSession(null); };

  const streak = useMemo(() => computeJournalStreak(pastCards.map((c) => c.detail)), [pastCards]);
  const todaySummary = useMemo(() => buildTodaySummaryFromSessions(pastCards.map((c) => c.detail)), [pastCards]);
  const moodTrend = useMemo(() => buildMoodTrendSeries(pastCards.map((c) => c.detail), 7), [pastCards]);
  const hasMoodData = useMemo(() => moodTrend.some((p) => p.mood != null), [moodTrend]);
  const hasNoSessions = !sessionsLoading && !sessionsError && pastCards.length === 0;

  const heatmap = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (34 - i));
      const count = pastCards.filter((c) => {
        const cd = new Date(c.detail.created_at); cd.setHours(0, 0, 0, 0);
        return cd.getTime() === d.getTime();
      }).length;
      return { date: d, count };
    });
  }, [pastCards]);

  const headerDate = useMemo(() =>
    new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()),
  []);

  const handleStart = () => {
    const p = PERSONAS.find((x) => x.id === selectedPersona) ?? PERSONAS[0];
    startSession(selectedPersona, selectedVoice, p.greeting, selectedLang);
  };

  const isActive = isRecording || isConnecting || isGeneratingReport;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground tracking-tight">clario</span>
          </div>
          <div className="flex items-center gap-4">
            {displayName && (
              <span className="font-body text-sm text-muted-foreground hidden sm:block">{displayName}</span>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-body text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Error toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/25 flex items-center justify-between"
              >
                <p className="font-body text-sm text-destructive">{error}</p>
                <button onClick={clearError} className="text-destructive hover:opacity-70 text-lg leading-none ml-4">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mb-10"
          >
            <motion.p variants={fadeUp} className="font-body text-sm text-muted-foreground">
              {displayName ? `Hey, ${displayName}` : "Hey"} — {headerDate}
            </motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-3xl md:text-4xl font-light text-foreground mt-1">
              How are you feeling <span className="italic">today?</span>
            </motion.h1>
          </motion.div>

          {/* Top grid: Voice panel + Streak */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Voice panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`${hasNoSessions || streak === 0 ? "lg:col-span-3" : "lg:col-span-2"} p-8 rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

              <div className="relative z-10 flex flex-col items-center text-center w-full">
                <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                  Ready when you are
                </p>

                {/* Mic button */}
                <button
                  onClick={handleStart}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 my-2 shadow-lg"
                  aria-label="Start voice session"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <p className="font-body text-sm text-muted-foreground mt-3 mb-8">
                  Tap to start your reflection
                </p>

                {/* Config selectors */}
                <div className="flex flex-col gap-5 w-full max-w-sm px-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <label className="text-[10px] uppercase font-body text-muted-foreground tracking-widest pl-1">Agent Persona</label>
                    <select
                      value={selectedPersona}
                      onChange={(e) => setSelectedPersona(e.target.value)}
                      className="w-full bg-background border border-border/50 text-foreground rounded-xl px-3 py-2.5 text-sm font-body cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-1 focus:border-primary/80 transition-all"
                    >
                      {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <p className="font-body text-[11px] text-muted-foreground pl-1 leading-relaxed">
                      {PERSONAS.find((p) => p.id === selectedPersona)?.desc}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-start gap-1.5 flex-1">
                      <label className="text-[10px] uppercase font-body text-muted-foreground tracking-widest pl-1">Voice</label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full bg-background border border-border/50 text-foreground rounded-xl px-3 py-2.5 text-sm font-body cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-1 focus:border-primary/80 transition-all"
                      >
                        {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col items-start gap-1.5 flex-1">
                      <label className="text-[10px] uppercase font-body text-muted-foreground tracking-widest pl-1">Language</label>
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value as SessionLanguage)}
                        className="w-full bg-background border border-border/50 text-foreground rounded-xl px-3 py-2.5 text-sm font-body cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-1 focus:border-primary/80 transition-all"
                      >
                        {SESSION_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Streak card */}
            {streak > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-4">
                  <svg width="96" height="96" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                      strokeLinecap="round" strokeDasharray={264}
                      strokeDashoffset={264 - (264 * Math.min(streak, 30) / 30)}
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * Math.min(streak, 30) / 30) }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <span className="font-display text-4xl font-semibold text-foreground">{streak}</span>
                <p className="font-body text-xs text-muted-foreground mt-1 mb-8">day streak</p>

                {!sessionsLoading && (
                  <div className="w-full">
                    <p className="font-body text-[10px] text-muted-foreground uppercase tracking-widest mb-3 text-left pl-2">Last 35 Days</p>
                    <div className="grid grid-cols-7 gap-1.5 place-items-center">
                      {heatmap.map((day, i) => (
                        <div
                          key={i}
                          title={`${day.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}: ${day.count > 0 ? "Completed" : "Missed"}`}
                          className={`w-3.5 h-3.5 rounded-[3px] border transition-all duration-300 hover:scale-110 ${
                            day.count > 0 ? "bg-primary border-primary/20" : "bg-primary/10 border-border/20"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest px-1 pt-2">
                      <span>{heatmap[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      <span>Today</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Empty state */}
          {hasNoSessions ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="mt-6 p-8 rounded-2xl bg-card border border-border/50"
            >
              <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">First reflection</p>
              <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-3">No saved sessions yet</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-xl">
                Start your first voice reflection to unlock your daily summary, mood trends, streak, and past reports.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Today's Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="mt-6 p-8 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {sessionsLoading || !todaySummary || todaySummary.isFromToday ? "Today's Summary" : "Latest Reflection"}
                  </h2>
                </div>
                {sessionsLoading && <p className="font-body text-sm text-muted-foreground">Loading your summary…</p>}
                {!sessionsLoading && todaySummary && !todaySummary.isFromToday && (
                  <p className="font-body text-sm text-muted-foreground mb-6">
                    Nothing logged today — showing last session from <span className="text-foreground/90 font-medium">{todaySummary.sessionDateLabel}</span>.
                  </p>
                )}
                {!sessionsLoading && todaySummary?.isFromToday && (
                  <p className="font-body text-sm text-muted-foreground mb-6">{todaySummary.sessionDateLabel}</p>
                )}

                {sessionsLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-muted/40 border border-border/20" />)}
                  </div>
                )}

                {!sessionsLoading && !todaySummary && (
                  <p className="font-body text-sm text-muted-foreground py-2">
                    Complete a voice reflection with a generated report to see your mood, themes, and insights here.
                  </p>
                )}

                {!sessionsLoading && todaySummary && (
                  <div className="flex flex-col gap-6">
                    {/* Theme of the day */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/40 rounded-2xl p-6 border border-border/30">
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.2em] text-primary mb-2">Theme of the day</p>
                        <h3 className="font-display text-4xl md:text-5xl font-light text-foreground capitalize tracking-tight">
                          {todaySummary.oneWordSummary || "Reflective"}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        {[
                          { icon: <Activity className="w-3.5 h-3.5" />, label: "Mood", value: todaySummary.mood.toFixed(1), delta: todaySummary.moodDelta },
                          { icon: <Zap className="w-3.5 h-3.5" />, label: "Energy", value: todaySummary.energyLevel != null ? `${todaySummary.energyLevel}/10` : "—" },
                          { icon: <Clock className="w-3.5 h-3.5" />, label: "Duration", value: todaySummary.durationSeconds ? `${Math.ceil(todaySummary.durationSeconds / 60)} min` : "—" },
                        ].map((stat, i) => (
                          <div key={i} className="flex flex-col gap-1 items-start md:items-end">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {stat.icon}
                              <span className="font-body text-[10px] uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-2xl text-foreground font-medium">{stat.value}</span>
                              {stat.delta != null && (
                                <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${stat.delta > 0 ? "bg-primary/10 text-primary" : stat.delta < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                                  {stat.delta > 0 ? "+" : ""}{stat.delta.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-card border border-border/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-4">Themes & Moments</p>
                        {todaySummary.keyBullets.length > 0 ? (
                          <ul className="space-y-3 relative z-10">
                            {todaySummary.keyBullets.map((line, i) => (
                              <li key={i} className="font-body text-sm text-foreground/90 leading-relaxed pl-3 border-l-2 border-primary/30">{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-body text-sm text-muted-foreground relative z-10">No themes listed in this report.</p>
                        )}
                      </div>
                      <div className="p-6 rounded-2xl bg-card border border-border/40 relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/5 rounded-tl-full pointer-events-none transition-transform group-hover:scale-110" />
                        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-4">Key Insight</p>
                        <p className="font-body text-base md:text-lg text-foreground/90 leading-relaxed italic relative z-10">
                          "{todaySummary.insightLine}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Mood Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="mt-6 p-8 rounded-2xl bg-card border border-border/50"
              >
                <h2 className="font-display text-xl font-semibold text-foreground">Mood Trends</h2>
                <p className="font-body text-sm text-muted-foreground mt-1 mb-6">Last 7 days · average mood from sessions with a saved report</p>
                {sessionsLoading && <div className="h-48 rounded-xl bg-muted/30 animate-pulse" />}
                {!sessionsLoading && !hasMoodData && (
                  <p className="font-body text-sm text-muted-foreground py-12 text-center border border-dashed border-border/60 rounded-xl">
                    No mood data yet. Complete a reflection and generate a report to see your trend.
                  </p>
                )}
                {!sessionsLoading && hasMoodData && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={moodTrend}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(30 8% 50%)" }} interval={0} angle={-25} textAnchor="end" height={52} />
                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(30 8% 50%)" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(38 33% 96%)", border: "1px solid hsl(35 20% 87%)", borderRadius: "0.75rem", fontSize: "12px" }}
                          formatter={(v) => v == null ? "No session" : `${Number(v).toFixed(1)} / 10`}
                        />
                        <Line
                          type="monotone" dataKey="mood" stroke="hsl(158 28% 32%)" strokeWidth={2}
                          connectNulls={false}
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            if (payload?.mood == null || cx == null || cy == null) return <g key={props.key} />;
                            return <circle key={props.key} cx={cx} cy={cy} r={4} fill="hsl(158 28% 32%)" />;
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* Past Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="mt-6"
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Past Sessions</h2>
                {sessionsLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground font-body text-sm py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions…
                  </div>
                )}
                {!sessionsLoading && sessionsError && (
                  <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20">
                    <p className="font-body text-sm">{sessionsError}</p>
                    <button onClick={loadSessions} className="mt-3 text-primary font-medium text-sm underline-offset-4 hover:underline font-body">Try again</button>
                  </div>
                )}
                {!sessionsLoading && !sessionsError && pastCards.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground py-6 text-center border border-dashed border-border/60 rounded-2xl">
                    No sessions yet. Start a voice reflection to see it here.
                  </p>
                )}
                {!sessionsLoading && !sessionsError && pastCards.length > 0 && (
                  <div className="space-y-3">
                    {pastCards.map((row, i) => {
                      const MoodIcon = moodWeatherIcon(row.moodScore);
                      return (
                        <motion.div
                          key={row.id}
                          initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                          className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-200 flex flex-col sm:flex-row sm:items-start gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <MoodIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                              <span className="font-body text-sm font-medium text-foreground">{row.labelDate}</span>
                              {row.moodScore != null && (
                                <span className="font-body text-xs text-muted-foreground">Mood: {row.moodScore.toFixed(1)}/10</span>
                              )}
                              {streak > 0 && (
                                <span className="font-body text-xs text-accent flex items-center gap-1">
                                  <Flame className="w-3 h-3" /> {streak}
                                </span>
                              )}
                            </div>
                            <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-3">{row.summary}</p>
                          </div>
                          <button
                            type="button"
                            disabled={!row.hasReport}
                            onClick={() => setArchiveSession(row.detail)}
                            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2.5 font-body text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            View report
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </main>

      {/* ── Active Session Overlay ───────────────────────────────── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between py-16 px-6"
          >
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

            {/* Status label */}
            <div className="relative z-10 text-center mt-8 w-full max-w-md mx-auto">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <p className="font-body text-sm uppercase tracking-[0.3em] text-primary mb-2">
                  {isGeneratingReport ? "Session Complete" : "Active Reflection"}
                </p>
                <h2 className="font-display text-4xl text-foreground">
                  {isGeneratingReport ? "Generating report…" : isConnecting ? "Connecting…" : "Listening…"}
                </h2>
              </motion.div>
            </div>

            {/* Pulsing orb */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-accent/40"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute inset-0 -m-8 rounded-full bg-primary/20"
                />
                <div className="w-32 h-32 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-2xl relative z-10">
                  {isGeneratingReport ? (
                    <Sparkles className="w-12 h-12" />
                  ) : isMuted ? (
                    <MicOff className="w-12 h-12 text-muted-foreground" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 pb-8 flex flex-col md:flex-row items-center justify-center gap-8 w-full md:min-h-[120px]">
              {!isGeneratingReport ? (
                <>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={toggleMute} disabled={isConnecting}
                      className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-colors group ${isMuted ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary/20 text-primary hover:bg-primary/30"} ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <p className="font-body text-xs text-muted-foreground mt-3">{isMuted ? "Unmute" : "Mute"}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={endSession}
                      className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg flex items-center justify-center transition-colors"
                    >
                      <PhoneOff className="w-8 h-8" />
                    </button>
                    <p className="font-body text-sm text-muted-foreground mt-4">End Session</p>
                  </div>

                  <div className="w-16 h-16 invisible hidden md:block" aria-hidden="true" />
                </>
              ) : (
                <p className="font-body text-sm text-muted-foreground animate-pulse">This might take a moment…</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modalReport && <SessionReportModal reportData={modalReport} onClose={closeModal} />}
      </AnimatePresence>
    </div>
  );
}
