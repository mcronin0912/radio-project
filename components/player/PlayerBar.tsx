"use client";

import { usePlayer } from "@/lib/player-context";
import { Button } from "@/components/ui/button";
import { WaveformVisualizer } from "@/components/player/WaveformVisualizer";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

export function PlayerBar() {
  const {
    station,
    isPlaying,
    volume,
    error,
    isReconnecting,
    pause,
    play,
    setVolume,
    clearError,
  } = usePlayer();

  if (!station) return null;

  const isMuted = volume === 0;
  const handleVolumeClick = () => (isMuted ? setVolume(1) : setVolume(0));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-graphite bg-carbon shadow-subtle">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-6 pt-4 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="truncate text-[14px] font-medium tracking-tight text-paper">
            {station.name}
          </p>
          {isReconnecting && (
            <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-normal text-fog">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid-lime" />
              <span className="font-mono text-[12px] tracking-tight">
                Reconnecting…
              </span>
            </div>
          )}
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
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-page px-6 pb-3">
        <WaveformVisualizer />
      </div>
      {error && (
        <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-6 pb-4">
          <p className="text-[12px] font-normal text-coral-red">
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
