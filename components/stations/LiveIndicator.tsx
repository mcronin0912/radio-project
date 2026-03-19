"use client";

import { usePlayer } from "@/lib/player-context";
import type { Station } from "@/lib/stations";

interface LiveIndicatorProps {
  station: Station;
}

export function LiveIndicator({ station }: LiveIndicatorProps) {
  const { station: currentStation, isPlaying } = usePlayer();
  const isCurrentStation = currentStation?.id === station.id;

  if (!isCurrentStation || !isPlaying) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      <span>Live</span>
    </div>
  );
}
