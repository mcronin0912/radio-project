"use client";

import { usePlayer } from "@/lib/player-context";
import type { Station } from "@/lib/stations";

interface LiveIndicatorProps {
  station: Station;
}

export function LiveIndicator({ station }: LiveIndicatorProps) {
  const { media, isPlaying } = usePlayer();
  const isCurrentStation =
    media?.kind === "radio" && media.station.id === station.id;

  if (!isCurrentStation || !isPlaying) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-normal text-fog">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse-green" />
      <span>Live</span>
    </div>
  );
}
