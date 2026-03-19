"use client";

import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import type { Station } from "@/lib/stations";

interface PlayButtonProps {
  station: Station;
}

export function PlayButton({ station }: PlayButtonProps) {
  const { station: currentStation, isPlaying, play, pause } = usePlayer();
  const isCurrentStation = currentStation?.id === station.id;
  const showPause = isCurrentStation && isPlaying;

  return (
    <Button
      onClick={() => (showPause ? pause() : play(station))}
      disabled={!station.streamUrl}
    >
      {showPause ? (
        <Pause className="mr-2 h-4 w-4 fill-current" />
      ) : (
        <Play className="mr-2 h-4 w-4 fill-current" />
      )}
      {station.streamUrl
        ? showPause
          ? "Pause"
          : "Play"
        : "Stream unavailable"}
    </Button>
  );
}
