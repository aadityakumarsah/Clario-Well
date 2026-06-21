import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import Navbar from "@/components/Navbar";
import SessionReportModal from "@/components/SessionReportModal";
import { Calendar } from "@/components/ui/calendar";
import { listSessions, type SessionDetailData } from "@/lib/api";
import { formatSessionListDate, sessionListSummary } from "@/lib/sessionReportView";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function localDateLabel(d: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return localDateKey(d);
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

const Journal = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarSessionDays, setCalendarSessionDays] = useState<Date[]>([]);
  const [daySessions, setDaySessions] = useState<SessionDetailData[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const [modalSession, setModalSession] = useState<SessionDetailData | null>(null);

  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCalendarLoading(true);
      setCalendarError(null);
      try {
        const all = await listSessions();
        if (cancelled) return;
        const uniqueDays = new Map<string, Date>();
        for (const row of all) {
          const d = new Date(row.created_at);
          if (Number.isNaN(d.getTime())) continue;
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          uniqueDays.set(localDateKey(dayStart), dayStart);
        }
        setCalendarSessionDays(Array.from(uniqueDays.values()));
      } catch (e) {
        if (!cancelled) {
          setCalendarError(e instanceof Error ? e.message : "Could not load calendar sessions");
        }
      } finally {
        if (!cancelled) setCalendarLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDayLoading(true);
      setDayError(null);
      try {
        const rows = await listSessions({
          date: localDateKey(selectedDate),
          tzOffsetMinutes: timezoneOffset,
        });
        if (!cancelled) setDaySessions(rows);
      } catch (e) {
        if (!cancelled) {
          setDayError(e instanceof Error ? e.message : "Could not load sessions for this date");
        }
      } finally {
        if (!cancelled) setDayLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, timezoneOffset]);

  return (
    <div className="min-h-screen bg-background relative">

      <Navbar />

      <div className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mb-8"
          >
            <motion.p variants={fadeUp} className="font-body text-sm text-muted-foreground">
              {t("dashboard.greeting")}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-light text-foreground mt-1"
            >
              Journal <span className="italic">calendar</span>
            </motion.h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 p-4 md:p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Pick a date</h2>
              </div>

              {calendarLoading && (
                <div className="h-[320px] rounded-xl bg-muted/30 animate-pulse" />
              )}

              {!calendarLoading && calendarError && (
                <p className="font-body text-sm text-destructive">{calendarError}</p>
              )}

              {!calendarLoading && !calendarError && (
                <>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    modifiers={{
                      hasSession: calendarSessionDays,
                    }}
                    modifiersClassNames={{
                      hasSession: "border border-primary/40 bg-primary/10",
                    }}
                    className="rounded-xl border border-border/40"
                  />
                  <p className="font-body text-xs text-muted-foreground mt-4">
                    Highlighted dates have at least one session.
                  </p>
                </>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-3 p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {localDateLabel(selectedDate)}
                </h2>
                {!dayLoading && !dayError && (
                  <span className="font-body text-xs text-muted-foreground">
                    {daySessions.length} session{daySessions.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {dayLoading && (
                <div className="flex items-center gap-2 text-muted-foreground font-body text-sm py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading sessions…
                </div>
              )}

              {!dayLoading && dayError && (
                <p className="font-body text-sm text-destructive">{dayError}</p>
              )}

              {!dayLoading && !dayError && daySessions.length === 0 && (
                <p className="font-body text-sm text-muted-foreground py-6 text-center border border-dashed border-border/60 rounded-2xl">
                  No sessions for this date.
                </p>
              )}

              {!dayLoading && !dayError && daySessions.length > 0 && (
                <div className="space-y-3">
                  {daySessions.map((session, i) => (
                    <motion.div
                      key={session.session_id}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-2xl bg-background border border-border/50 flex flex-col sm:flex-row sm:items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock3 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                          <span className="font-body text-sm font-medium text-foreground">
                            {formatSessionListDate(session.created_at)}
                          </span>
                          <span className="font-body text-xs text-muted-foreground">
                            {formatTime(session.created_at)}
                          </span>
                          {session.duration_seconds != null && (
                            <span className="font-body text-xs text-muted-foreground">
                              {Math.max(0, session.duration_seconds)}s
                            </span>
                          )}
                        </div>
                        <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {sessionListSummary(session)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!session.report}
                        onClick={() => setModalSession(session)}
                        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2.5 font-body text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        View report
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalSession && (
          <SessionReportModal reportData={modalSession} onClose={() => setModalSession(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Journal;
