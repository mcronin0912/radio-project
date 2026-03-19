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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{station.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {station.city}, {station.state}
            {error ? (
              <span className="text-destructive"> · {error}</span>
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
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="default"
            onClick={() => (isPlaying ? pause() : play(station))}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!!error}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        </div>
      </div>
      {error && (
        <div className="flex items-center justify-between gap-2 px-4 pb-2">
          <p className="text-xs text-destructive">
            Stream unavailable. Check the URL or try another station.
          </p>
          <Button size="xs" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
