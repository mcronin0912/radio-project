"use client";

import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import type { Channel } from "@/lib/channels";

interface ChannelPlayButtonProps {
  channel: Channel;
}

export function ChannelPlayButton({ channel }: ChannelPlayButtonProps) {
  const { media, isPlaying, playChannel, pause } = usePlayer();
  const isCurrent =
    media?.kind === "tv" && media.channel.slug === channel.slug;
  const showPause = isCurrent && isPlaying;

  return (
    <Button
      onClick={() => (showPause ? pause() : playChannel(channel))}
      disabled={!channel.streamUrl}
    >
      {showPause ? (
        <Pause className="mr-2 h-4 w-4 fill-current" />
      ) : (
        <Play className="mr-2 h-4 w-4 fill-current" />
      )}
      {channel.streamUrl
        ? showPause
          ? "Pause"
          : "Watch"
        : "Stream unavailable"}
    </Button>
  );
}
