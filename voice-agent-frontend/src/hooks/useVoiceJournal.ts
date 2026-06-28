import { useState, useRef, useEffect, useCallback } from "react";
import { MediaHandler, GeminiClient } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";
import { startVoiceSession, generateSessionReport, type SessionDetailData } from "@/lib/api";
import { preferredLanguageGreetingPrefix, type SessionLanguage } from "@/lib/sessionLanguage";

export function useVoiceJournal() {
  const { displayName } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<SessionDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaHandlerRef = useRef<MediaHandler | null>(null);
  const geminiClientRef = useRef<GeminiClient | null>(null);
  const voiceSessionIdRef = useRef<string | null>(null);
  const greetingRef = useRef<string | null>(null);

  const clearReport = useCallback(() => setReportData(null), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    mediaHandlerRef.current = new MediaHandler();
    geminiClientRef.current = new GeminiClient({
      onOpen: () => {
        setIsConnected(true);
        geminiClientRef.current?.sendConfig({
          session_id: voiceSessionIdRef.current,
          testProfile: "debug-agent-metadata-001",
          clientBuild: "voice-journal",
        });
        if (greetingRef.current) {
          geminiClientRef.current?.sendText(`System: ${greetingRef.current}`, { persist: false });
        }
      },
      onMessage: (event) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "interrupted") mediaHandlerRef.current?.stopAudioPlayback();
          } catch (_) {}
        } else {
          mediaHandlerRef.current?.playAudio(event.data as ArrayBuffer);
        }
      },
      onClose: () => {
        setIsConnected(false);
        setIsRecording(false);
        setIsConnecting(false);
      },
      onError: () => {
        setError("Connection failed. Are the backend services running?");
        setIsConnected(false);
        setIsRecording(false);
        setIsConnecting(false);
      },
    });

    return () => {
      geminiClientRef.current?.disconnect();
      mediaHandlerRef.current?.stopAudio();
    };
  }, []);

  const startSession = useCallback(
    async (persona?: string, voice?: string, greeting?: string, language: SessionLanguage = "en") => {
      if (!mediaHandlerRef.current || !geminiClientRef.current) return;
      setError(null);
      const prefix = preferredLanguageGreetingPrefix(language);
      greetingRef.current = greeting ? `${prefix}${greeting}` : null;

      try {
        setIsConnecting(true);
        const { session_id } = await startVoiceSession();
        voiceSessionIdRef.current = session_id;

        await mediaHandlerRef.current.initializeAudio();
        geminiClientRef.current.connect(undefined, voice, persona, language, displayName ?? undefined);

        await mediaHandlerRef.current.startAudio((data) => {
          if (geminiClientRef.current?.isConnected()) geminiClientRef.current.send(data);
        });

        setIsRecording(true);
        setIsConnecting(false);
      } catch (e) {
        voiceSessionIdRef.current = null;
        setError(e instanceof Error ? e.message : "Could not start voice session.");
        setIsRecording(false);
        setIsConnecting(false);
      }
    },
    [displayName]
  );

  const endSession = useCallback(async () => {
    const sessionId = voiceSessionIdRef.current;
    voiceSessionIdRef.current = null;

    mediaHandlerRef.current?.stopAudio();
    mediaHandlerRef.current?.stopAudioPlayback();
    geminiClientRef.current?.disconnect();

    setIsRecording(false);
    setIsConnected(false);
    setIsConnecting(false);
    setIsMuted(false);

    if (sessionId) {
      try {
        setIsGeneratingReport(true);
        await new Promise((resolve) => setTimeout(resolve, 7000));
        const data = await generateSessionReport(sessionId);
        setReportData(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate report.");
      } finally {
        setIsGeneratingReport(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      mediaHandlerRef.current?.setMuted(next);
      return next;
    });
  }, []);

  return {
    isRecording,
    isConnected,
    isConnecting,
    isMuted,
    isGeneratingReport,
    reportData,
    error,
    startSession,
    endSession,
    toggleMute,
    clearReport,
    clearError,
  };
}
