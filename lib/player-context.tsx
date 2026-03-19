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

const STORAGE_KEY = "community-radio-player";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasRestored = useRef(false);

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
      audio.src = s.streamUrl;
      audio.volume = volume;
      audio.play().catch((err) => {
        console.error("Playback failed:", err);
        setError("Stream unavailable");
        setIsPlaying(false);
        persistStation(s, false);
      });
      setIsPlaying(true);
    }
  }, [volume]);

  const stationRef = useRef<Station | null>(null);
  stationRef.current = station;

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    if (stationRef.current) persistStation(stationRef.current, false);
  }, []);

  const setVolume = useCallback((v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Restore playing station after full page reload (e.g. browser back on static export)
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const saved = restoreStation();
    if (!saved) return;
    setStation(saved);
    const audio = audioRef.current;
    if (audio) {
      audio.src = saved.streamUrl;
      audio.volume = 1;
      audio.play().catch((err) => {
        console.error("Restore playback failed:", err);
        setError("Stream unavailable");
        setIsPlaying(false);
        persistStation(saved, false);
      });
      setIsPlaying(true);
    }
  }, []);

  // Handle stream errors only — don't sync pause/playing; live streams fire
  // those events during buffering and can cause render storms / UI freeze
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
