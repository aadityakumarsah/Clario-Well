import { supabase } from "./supabase";

const BASE = (import.meta.env.VITE_BACKEND_BASE_URL as string) ?? "";

async function headers(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) h["Authorization"] = `Bearer ${session.access_token}`;
  return h;
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text?.trim()) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

// ── Voice sessions ──────────────────────────────────────────────────────────

export interface VoiceSessionStart {
  session_id: string;
  user_id: string;
  created_at: string;
}

export async function startVoiceSession(): Promise<VoiceSessionStart> {
  if (!BASE) throw new Error("Backend URL not configured (VITE_BACKEND_BASE_URL missing)");
  const res = await fetch(`${BASE}/sessions/start`, {
    method: "POST",
    headers: await headers(),
  }).catch((err) => { throw new Error(`Cannot reach backend: ${err.message}`); });
  const json = await safeJson(res);
  if (!json.success || !(json.data as Record<string, unknown>)?.session_id) {
    throw new Error((json.message as string) ?? `Backend error ${res.status}`);
  }
  return json.data as unknown as VoiceSessionStart;
}

export type MoodLabel =
  | "anxious" | "calm" | "hopeful" | "reflective" | "frustrated"
  | "overwhelmed" | "grateful" | "sad" | "excited" | "angry"
  | "disappointed" | "happy" | "surprised" | "confused" | "bored" | "neutral";

export interface CallReportMoodPoint { score: number; label: MoodLabel; }
export interface CallReportTheme { label: string; summary: string; }
export interface CallReportThing {
  narrative: string;
  label?: string;
  category: "work" | "social" | "health" | "personal" | "other";
  sentiment: "positive" | "neutral" | "negative";
}
export interface CallReportInsight { type: "pattern" | "moment" | "suggestion"; body: string; }

export interface CallReportData {
  session_id: string;
  duration_seconds: number;
  user_words_spoken: number;
  session_overview: [string, string, string];
  one_word_summary: string;
  average_mood_rating: number;
  energy_level: number;
  mood_across_session: CallReportMoodPoint[];
  themes_discussed: CallReportTheme[];
  things_you_did_today: CallReportThing[];
  gratitude: string[];
  insights: CallReportInsight[];
  suggestions: string[];
  personal_reflection?: string;
}

export interface ConversationTurn { role: string; message: string; created_at: string; }

export interface SessionDetailData {
  session_id: string;
  user_id: string;
  created_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  report: CallReportData | null;
  conversation: ConversationTurn[];
}

export async function listSessions(params?: {
  date?: string;
  tzOffsetMinutes?: number;
}): Promise<SessionDetailData[]> {
  if (!BASE) return [];
  try {
    const search = new URLSearchParams();
    if (params?.date) search.set("date", params.date);
    if (typeof params?.tzOffsetMinutes === "number") {
      search.set("tz_offset_minutes", String(params.tzOffsetMinutes));
    }
    const qs = search.toString();
    const res = await fetch(`${BASE}/sessions${qs ? `?${qs}` : ""}`, { headers: await headers() });
    const json = await safeJson(res);
    if (!json.success) throw new Error((json.message as string) ?? "Failed to load sessions");
    return json.data as unknown as SessionDetailData[];
  } catch (e) {
    console.warn("listSessions:", e);
    return [];
  }
}

export async function generateSessionReport(sessionId: string): Promise<SessionDetailData> {
  if (!BASE) throw new Error("Backend URL not configured");
  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(sessionId)}/report`, {
    method: "POST",
    headers: await headers(),
  }).catch((err) => { throw new Error(`Network error: ${err.message}`); });
  const json = await safeJson(res);
  if (!json.success) throw new Error((json.message as string) ?? `Server error ${res.status}`);
  return json.data as unknown as SessionDetailData;
}
