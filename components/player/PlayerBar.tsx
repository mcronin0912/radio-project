"use client";

import { usePlayer } from "@/lib/player-context";
import { Button } from "@/components/ui/button";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

export function PlayerBar() {
  const { station, isPlaying, volume, error, pause, play, setVolume, clearError } =
    usePlayer();

  if (!station) return null;

  const isMuted = volume === 0;
  const handleVolumeClick = () => (isMuted ? setVolume(1) : setVolume(0));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black text-white">
      <div className="flex items-center justify-between gap-4 p-[40px]">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-white">{station.name}</p>
          <p className="text-sm truncate text-white/70">
            {station.city}, {station.state}
            {error ? (
              <span className="text-red-400"> · {error}</span>
            ) : isPlaying ? (
              " · Live"
            ) : (
              " · Paused"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleVolumeClick}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => (isPlaying ? pause() : play(station))}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!!error}
            className="bg-white text-black hover:bg-white/90 hover:text-black"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        </div>
      </div>
      {error && (
        <div className="flex items-center justify-between gap-2 px-[40px] pb-4">
          <p className="text-xs text-red-400">
            Stream unavailable. Check the URL or try another station.
          </p>
          <Button
            size="xs"
            variant="ghost"
            onClick={clearError}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
