import type { LucideIcon } from "lucide-react";
import { Sun, Cloud, CloudRain } from "lucide-react";
import type { SessionDetailData } from "./api";

function isSameLocalCalendarDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export type TodaySummaryModel = {
  isFromToday: boolean;
  sessionDateLabel: string;
  mood: number;
  moodDelta: number | null;
  energyLevel: number | null;
  oneWordSummary: string | null;
  durationSeconds: number | null;
  wordsSpoken: number | null;
  keyBullets: string[];
  insightLine: string;
};

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function buildTodaySummaryFromSessions(sessions: SessionDetailData[]): TodaySummaryModel | null {
  const withReport = sessions.filter((s) => s.report);
  if (!withReport.length) return null;

  const now = new Date();
  const todaySession = withReport.find((s) => isSameLocalCalendarDay(s.created_at, now));
  const picked = todaySession ?? withReport[0];
  const r = picked.report!;

  const idx = withReport.findIndex((s) => s.session_id === picked.session_id);
  const prev = idx >= 0 && idx < withReport.length - 1 ? withReport[idx + 1] : null;
  const moodDelta = prev?.report != null ? r.average_mood_rating - prev.report.average_mood_rating : null;

  const keyBullets: string[] = [];
  if (r.themes_discussed?.length) {
    for (const t of r.themes_discussed) {
      const label = t.label?.trim();
      if (label) keyBullets.push(label);
      if (keyBullets.length >= 3) break;
    }
  }
  if (keyBullets.length < 3 && r.things_you_did_today?.length) {
    for (const th of r.things_you_did_today) {
      if (keyBullets.length >= 3) break;
      const raw = (th.narrative ?? th.label ?? "").trim();
      if (raw) keyBullets.push(truncate(raw, 100));
    }
  }
  if (!keyBullets.length && r.session_overview?.length) {
    for (const line of r.session_overview) {
      const one = line.replace(/\s+/g, " ").trim();
      if (one) keyBullets.push(truncate(one, 120));
      if (keyBullets.length >= 3) break;
    }
  }

  let insightLine = "";
  if (r.insights?.[0]?.body?.trim()) insightLine = r.insights[0].body.trim();
  else if (r.suggestions?.[0]?.trim()) insightLine = r.suggestions[0].trim();
  else if (r.personal_reflection?.trim()) {
    insightLine = truncate(r.personal_reflection.trim().split(/\n\s*\n+/)[0]?.trim() ?? "", 240);
  } else if (r.session_overview?.[0]) insightLine = r.session_overview[0].trim();
  insightLine = insightLine.replace(/^[""]|[""]$/g, "").trim();

  return {
    isFromToday: !!todaySession && picked.session_id === todaySession.session_id,
    sessionDateLabel: formatSessionListDate(picked.created_at),
    mood: Math.round(r.average_mood_rating * 10) / 10,
    moodDelta,
    energyLevel: r.energy_level ?? null,
    oneWordSummary: r.one_word_summary ?? null,
    durationSeconds: r.duration_seconds ?? picked.duration_seconds ?? null,
    wordsSpoken: r.user_words_spoken ?? null,
    keyBullets,
    insightLine: insightLine || "Keep reflecting — your next entry will add more color here.",
  };
}

export type PastSessionCardModel = {
  id: string;
  createdAtIso: string;
  labelDate: string;
  summary: string;
  moodScore: number | null;
  hasReport: boolean;
  detail: SessionDetailData;
};

export function formatSessionListDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d);
  } catch { return iso; }
}

export function sessionListSummary(detail: SessionDetailData): string {
  const r = detail.report;
  const firstOverview = r?.session_overview?.[0]?.trim();
  if (firstOverview) return firstOverview;
  const word = r?.one_word_summary?.trim();
  if (word) return `${word} — reflection logged.`;
  if (detail.conversation?.length) return "Voice session — open the report when it's ready.";
  return "Session started — no transcript yet.";
}

export function sessionDetailToPastCard(detail: SessionDetailData): PastSessionCardModel {
  const r = detail.report;
  return {
    id: detail.session_id,
    createdAtIso: detail.created_at,
    labelDate: formatSessionListDate(detail.created_at),
    summary: sessionListSummary(detail),
    moodScore: r != null ? Math.round(r.average_mood_rating * 10) / 10 : null,
    hasReport: r != null,
    detail,
  };
}

export function moodWeatherIcon(score: number | null): LucideIcon {
  if (score == null) return Cloud;
  if (score >= 7) return Sun;
  if (score >= 4) return Cloud;
  return CloudRain;
}

export type MoodTrendPoint = { day: string; mood: number | null };

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function buildMoodTrendSeries(sessions: SessionDetailData[], dayCount = 7): MoodTrendPoint[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(start.getDate() - (dayCount - 1));

  return Array.from({ length: dayCount }, (_, j) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + j);
    const label = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(d);
    const moods = sessions.filter((s) => s.report && sameLocalDay(new Date(s.created_at), d)).map((s) => s.report!.average_mood_rating);
    const mood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null;
    return { day: label, mood };
  });
}

function localCalendarKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function computeJournalStreak(sessions: SessionDetailData[]): number {
  const dayKeys = new Set<string>();
  for (const s of sessions) {
    if (!s.report) continue;
    const d = new Date(s.created_at);
    dayKeys.add(localCalendarKey(new Date(d.getFullYear(), d.getMonth(), d.getDate())));
  }
  if (!dayKeys.size) return 0;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  let anchor = dayKeys.has(localCalendarKey(todayStart)) ? todayStart : yesterday;
  let streak = 0;
  const check = new Date(anchor);
  while (dayKeys.has(localCalendarKey(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}
