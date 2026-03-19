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

  const play = useCallback((s: Station) => {
    if (!s.streamUrl) {
      setError("Stream URL not available");
      return;
    }
    setError(null);
    setStation(s);

    const audio = audioRef.current;
    if (audio) {
      audio.src = s.streamUrl;
      audio.volume = volume;
      audio.play().catch((err) => {
        console.error("Playback failed:", err);
        setError("Stream unavailable");
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Handle stream errors only — don't sync pause/playing; live streams fire
  // those events during buffering and can cause render storms / UI freeze
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onError = () => {
      setError("Stream unavailable");
      setIsPlaying(false);
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
