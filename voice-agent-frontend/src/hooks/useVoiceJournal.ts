import { useState, useRef, useEffect, useCallback } from "react";
import { MediaHandler, GeminiClient } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";
import { startVoiceSession, generateSessionReport, type SessionDetailData } from "@/lib/api";
import { preferredLanguageGreetingPrefix, type SessionLanguage } from "@/lib/sessionLanguage";

export function useVoiceJournal() {
  const { displayName, session } = useAuth();
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
  const reportWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportWaitResolveRef = useRef<(() => void) | null>(null);
  // Incremented on every end/cancel — lets an in-flight startSession know it is stale.
  const sessionGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  const clearReport = useCallback(() => setReportData(null), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    mountedRef.current = true;
    mediaHandlerRef.current = new MediaHandler();
    geminiClientRef.current = new GeminiClient({
      onOpen: () => {
        setIsConnected(true);
        geminiClientRef.current?.sendConfig({
          session_id: voiceSessionIdRef.current,
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
        // The connection died — make sure the mic is actually released.
        mediaHandlerRef.current?.stopAudio();
      },
      onError: () => {
        setError("Connection failed. Are the backend services running?");
        setIsConnected(false);
        setIsRecording(false);
        setIsConnecting(false);
        mediaHandlerRef.current?.stopAudio();
      },
    });

    return () => {
      mountedRef.current = false;
      sessionGenerationRef.current += 1;
      reportWaitResolveRef.current?.();
      if (reportWaitTimerRef.current) clearTimeout(reportWaitTimerRef.current);
      geminiClientRef.current?.disconnect();
      mediaHandlerRef.current?.stopAudio();
      mediaHandlerRef.current?.stopAudioPlayback();
      mediaHandlerRef.current?.dispose();
    };
  }, []);

  const startSession = useCallback(
    async (persona?: string, voice?: string, greeting?: string, language: SessionLanguage = "en") => {
      if (!mediaHandlerRef.current || !geminiClientRef.current) return;
      const generation = sessionGenerationRef.current;
      setError(null);
      const prefix = preferredLanguageGreetingPrefix(language);
      greetingRef.current = greeting ? `${prefix}${greeting}` : null;

      try {
        setIsConnecting(true);
        const { session_id } = await startVoiceSession();
        if (generation !== sessionGenerationRef.current) return;

        voiceSessionIdRef.current = session_id;

        await mediaHandlerRef.current.initializeAudio();
        if (generation !== sessionGenerationRef.current) return;

        geminiClientRef.current.connect(
          session?.access_token ?? undefined,
          voice,
          persona,
          language,
          displayName ?? undefined,
        );
        if (generation !== sessionGenerationRef.current) return;

        await mediaHandlerRef.current.startAudio((data) => {
          if (geminiClientRef.current?.isConnected()) geminiClientRef.current.send(data);
        });
        if (generation !== sessionGenerationRef.current) return;

        setIsRecording(true);
        setIsConnecting(false);
      } catch (e) {
        if (generation !== sessionGenerationRef.current) return;
        voiceSessionIdRef.current = null;
        setError(e instanceof Error ? e.message : "Could not start voice session.");
        setIsRecording(false);
        setIsConnecting(false);
        mediaHandlerRef.current?.stopAudio();
      }
    },
    [displayName, session?.access_token]
  );

  const endSession = useCallback(async () => {
    sessionGenerationRef.current += 1;
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
        // Give the backend a few seconds to finish saving the conversation.
        // The wait is cancellable (resolves early on unmount) so we never set
        // state on a dead component.
        await new Promise<void>((resolve) => {
          reportWaitResolveRef.current = resolve;
          reportWaitTimerRef.current = setTimeout(resolve, 7000);
        });
        if (!mountedRef.current) return;
        const data = await generateSessionReport(sessionId);
        if (!mountedRef.current) return;
        setReportData(data);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to generate report.");
      } finally {
        if (mountedRef.current) setIsGeneratingReport(false);
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
