"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type { Station } from "@/lib/stations";
import { SafariAudioAnalyser } from "@/lib/safari-audio-analyser";

const STORAGE_KEY = "community-radio-player";

function isSafari() {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Stream playback URL:
 * - Local/dev (no basePath): same-origin `/api/stream` so HTTP-only upstreams work (no mixed content).
 * - Static export (GitHub Pages, basePath set): no API route — use optional `NEXT_PUBLIC_STREAM_PROXY_URL`
 *   (HTTPS proxy that mirrors `app/api/stream`) or fall back to the raw URL (needs HTTPS or CSP upgrade).
 */
function streamPlaybackUrl(streamUrl: string): string {
  const encoded = encodeURIComponent(streamUrl);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const external = process.env.NEXT_PUBLIC_STREAM_PROXY_URL?.trim().replace(/\/$/, "");
  if (external) {
    return `${external}?url=${encoded}`;
  }
  if (basePath) {
    return streamUrl;
  }
  return `/api/stream?url=${encoded}`;
}

function persistStation(s: Station | null, playing: boolean) {
  if (typeof window === "undefined") return;
  if (!s || !playing) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: s.id,
      slug: s.slug,
      name: s.name,
      city: s.city,
      state: s.state,
      streamUrl: s.streamUrl,
    })
  );
}

function restoreStation(): Station | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.streamUrl) return null;
    return {
      id: data.id ?? data.slug,
      slug: data.slug ?? "",
      callsign: "",
      name: data.name ?? "",
      frequency: null,
      city: data.city ?? "",
      state: data.state ?? "",
      description: null,
      website: null,
      streamUrl: data.streamUrl,
      streamFormat: null,
      streamBitrate: null,
      metadataTier: 0,
      metadataUrl: null,
      logoUrl: null,
      genres: [],
      indigenous: false,
    };
  } catch {
    return null;
  }
}

interface PlayerState {
  station: Station | null;
  isPlaying: boolean;
  volume: number;
  error: string | null;
  isReconnecting: boolean;
  analyser: AnalyserNode | null;
  play: (station: Station) => void;
  pause: () => void;
  setVolume: (v: number) => void;
  clearError: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [station, setStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasRestored = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const connectedRef = useRef(false);
  const safariRef = useRef<SafariAudioAnalyser | null>(null);
  const intendedPlayingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const volumeRef = useRef(1);
  const scheduleReconnectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current != null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return;
    }
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    audioCtxRef.current = ctx;
  }, []);

  const connectChromeAnalyser = useCallback(() => {
    const audio = audioRef.current;
    const ctx = audioCtxRef.current;
    if (!audio || !ctx || connectedRef.current) return;

    try {
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      node.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(audio);
      source.connect(node);
      node.connect(ctx.destination);
      connectedRef.current = true;
      setAnalyser(node);
    } catch (e) {
      console.warn("Web Audio setup failed:", e);
    }
  }, []);

  const play = useCallback((s: Station) => {
    if (!s.streamUrl) {
      setError("Stream URL not available");
      return;
    }
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    intendedPlayingRef.current = true;
    setError(null);
    setIsReconnecting(false);
    setStation(s);
    persistStation(s, true);

    const audio = audioRef.current;
    if (audio) {
      ensureAudioContext();

      const proxied = streamPlaybackUrl(s.streamUrl);
      audio.src = proxied;
      audio.volume = volume;

      const onPlayFailed = (err: unknown) => {
        console.error("Playback failed:", err);
        if (intendedPlayingRef.current && s.streamUrl) {
          scheduleReconnectRef.current?.();
          return;
        }
        setError("Stream unavailable");
        setIsPlaying(false);
        setIsReconnecting(false);
        persistStation(s, false);
      };

      if (isSafari()) {
        // Safari: createMediaElementSource is broken for streams.
        // Use fetch + decodeAudioData via the proxy instead.
        safariRef.current?.stop();
        const sa = new SafariAudioAnalyser(audioCtxRef.current!);
        safariRef.current = sa;
        setAnalyser(sa.getAnalyser());
        // SafariAudioAnalyser.start runs from the audio "play" event so lock screen / Control Center
        // resume stays in sync with the waveform tap.
        audio.play().catch(onPlayFailed);
      } else {
        // Chrome/Firefox: createMediaElementSource works fine
        connectChromeAnalyser();
        audio.play().catch(onPlayFailed);
      }
      setIsPlaying(true);
    }
  }, [volume, ensureAudioContext, connectChromeAnalyser, clearReconnectTimer]);

  const stationRef = useRef<Station | null>(null);
  stationRef.current = station;

  const pause = useCallback(() => {
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    intendedPlayingRef.current = false;
    setIsReconnecting(false);
    audioRef.current?.pause();
    safariRef.current?.stop();
    setIsPlaying(false);
    if (stationRef.current) persistStation(stationRef.current, false);
  }, [clearReconnectTimer]);

  const setVolume = useCallback((v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const saved = restoreStation();
    if (!saved?.streamUrl) return;
    setStation(saved);
    const audio = audioRef.current;
    if (audio) {
      audio.src = streamPlaybackUrl(saved.streamUrl);
      audio.volume = 1;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const scheduleReconnect = () => {
      if (!intendedPlayingRef.current) return;
      if (!stationRef.current?.streamUrl) return;

      clearReconnectTimer();
      const attempt = reconnectAttemptRef.current;
      reconnectAttemptRef.current = attempt + 1;
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));

      setIsReconnecting(true);
      setError(null);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (!intendedPlayingRef.current || !stationRef.current?.streamUrl) return;

        const el = audioRef.current;
        if (!el) return;

        const st = stationRef.current;
        if (!st.streamUrl) return;
        const base = streamPlaybackUrl(st.streamUrl);
        const hashIdx = base.indexOf("#");
        const proxied =
          hashIdx >= 0
            ? `${base.slice(0, hashIdx)}#r=${Date.now()}`
            : `${base}#r=${Date.now()}`;

        safariRef.current?.stop();
        try {
          el.pause();
          el.src = proxied;
          el.volume = volumeRef.current;
          el.load();
        } catch (e) {
          console.warn("Stream reconnect load failed:", e);
          scheduleReconnect();
          return;
        }

        void el.play().catch(() => {
          if (intendedPlayingRef.current) scheduleReconnect();
        });
      }, delay);
    };

    scheduleReconnectRef.current = scheduleReconnect;

    const onError = () => {
      if (!intendedPlayingRef.current) {
        setError("Stream unavailable");
        setIsPlaying(false);
        setIsReconnecting(false);
        if (stationRef.current) persistStation(stationRef.current, false);
        return;
      }
      scheduleReconnect();
    };

    const onEnded = () => {
      if (intendedPlayingRef.current) scheduleReconnect();
    };

    const onPlay = () => {
      intendedPlayingRef.current = true;
      reconnectAttemptRef.current = 0;
      setError(null);
      setIsReconnecting(false);
      setIsPlaying(true);
      if (stationRef.current) persistStation(stationRef.current, true);
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.playbackState = "playing";
        } catch {
          /* noop */
        }
      }
      void audioCtxRef.current?.resume();
      if (isSafari() && audioCtxRef.current) {
        const url = audio.currentSrc || audio.src;
        if (!url) return;
        if (!safariRef.current) {
          const sa = new SafariAudioAnalyser(audioCtxRef.current);
          safariRef.current = sa;
          setAnalyser(sa.getAnalyser());
        }
        void safariRef.current.start(url);
      }
    };

    const onPause = () => {
      safariRef.current?.stop();
      setIsPlaying(false);
      if (!intendedPlayingRef.current && stationRef.current) {
        persistStation(stationRef.current, false);
      }
      if ("mediaSession" in navigator) {
        try {
          if (!intendedPlayingRef.current) {
            navigator.mediaSession.playbackState = "paused";
          }
        } catch {
          /* noop */
        }
      }
    };

    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      scheduleReconnectRef.current = null;
      clearReconnectTimer();
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [clearReconnectTimer]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => {
        void audio.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audio.pause();
      });
    } catch {
      /* unsupported */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    if (!station || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const artwork =
      origin.length > 0
        ? [
            {
              src: `${origin}/apple-touch-icon.png`,
              sizes: "180x180",
              type: "image/png",
            },
          ]
        : [];
    // iOS lock screen: "artist" is the subline under the title — use location, not callsign
    // (many stations encode callsign + MHz in callsign, which duplicates the title).
    const locationLine = [station.city?.trim(), station.state?.trim()]
      .filter(Boolean)
      .join(", ");
    const artist = locationLine || "Australia";

    const cs = station.callsign?.trim() ?? "";
    const nameLow = station.name.toLowerCase();
    const csLow = cs.toLowerCase();
    const album =
      cs && cs.length <= 48 && !nameLow.includes(csLow.slice(0, Math.min(csLow.length, 16)))
        ? cs
        : "Live stream";

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist,
        album,
        artwork,
      });
    } catch {
      /* ignore */
    }
  }, [station]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        station,
        isPlaying,
        volume,
        error,
        isReconnecting,
        analyser,
        play,
        pause,
        setVolume,
        clearError,
      }}
    >
      {children}
      <audio ref={audioRef} preload="none" aria-hidden className="hidden" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
