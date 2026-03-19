"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import type { Station } from "@/lib/stations";

interface PlayButtonProps {
  station: Station;
}

export function PlayButton({ station }: PlayButtonProps) {
  const { play } = usePlayer();

  return (
    <Button
      onClick={() => play(station)}
      disabled={!station.streamUrl}
    >
      <Play className="mr-2 h-4 w-4 fill-current" />
      {station.streamUrl ? "Play" : "Stream unavailable"}
    </Button>
  );
}
