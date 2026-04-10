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

const hasProxy = !process.env.NEXT_PUBLIC_BASE_PATH;

function proxyUrl(streamUrl: string): string {
  if (!hasProxy) return streamUrl;
  return `/api/stream?url=${encodeURIComponent(streamUrl)}`;
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
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasRestored = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const connectedRef = useRef(false);
  const safariRef = useRef<SafariAudioAnalyser | null>(null);

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
    setError(null);
    setStation(s);
    persistStation(s, true);

    const audio = audioRef.current;
    if (audio) {
      ensureAudioContext();

      const proxied = proxyUrl(s.streamUrl);
      audio.src = proxied;
      audio.volume = volume;

      if (isSafari()) {
        // Safari: createMediaElementSource is broken for streams.
        // Use fetch + decodeAudioData via the proxy instead.
        safariRef.current?.stop();
        const sa = new SafariAudioAnalyser(audioCtxRef.current!);
        safariRef.current = sa;
        setAnalyser(sa.getAnalyser());

        audio.play().then(() => {
          sa.start(proxied);
        }).catch((err) => {
          console.error("Playback failed:", err);
          setError("Stream unavailable");
          setIsPlaying(false);
          persistStation(s, false);
        });
      } else {
        // Chrome/Firefox: createMediaElementSource works fine
        connectChromeAnalyser();
        audio.play().catch((err) => {
          console.error("Playback failed:", err);
          setError("Stream unavailable");
          setIsPlaying(false);
          persistStation(s, false);
        });
      }
      setIsPlaying(true);
    }
  }, [volume, ensureAudioContext, connectChromeAnalyser]);

  const stationRef = useRef<Station | null>(null);
  stationRef.current = station;

  const pause = useCallback(() => {
    audioRef.current?.pause();
    safariRef.current?.stop();
    setIsPlaying(false);
    if (stationRef.current) persistStation(stationRef.current, false);
  }, []);

  const setVolume = useCallback((v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (audioRef.current) audioRef.current.volume = val;
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
      audio.src = proxyUrl(saved.streamUrl);
      audio.volume = 1;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onError = () => {
      setError("Stream unavailable");
      setIsPlaying(false);
      if (stationRef.current) persistStation(stationRef.current, false);
    };

    audio.addEventListener("error", onError);
    return () => audio.removeEventListener("error", onError);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        station,
        isPlaying,
        volume,
        error,
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
