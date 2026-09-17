"use client";

import { Pause, Play } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChannelFavouriteButton } from "@/components/channels/ChannelFavouriteButton";
import { ChannelLogo } from "@/components/channels/ChannelLogo";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-context";
import { formatChannelCategoryLabel } from "@/lib/channel-categories";
import type { Channel } from "@/lib/channels";

interface ChannelCardProps {
  channel: Channel;
  onChannelSelect?: (slug: string) => void;
}

export function ChannelCard({ channel, onChannelSelect }: ChannelCardProps) {
  const { media, isPlaying, pause } = usePlayer();
  const isCurrent =
    media?.kind === "tv" && media.channel.slug === channel.slug;
  const isLive = isCurrent && isPlaying;

  const subtitle = [channel.network, channel.state, channel.streamQuality]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      className={cn(
        "transition-colors",
        isLive && "shadow-[inset_0_0_0_1px_var(--color-acid-lime)]"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ChannelLogo
              url={channel.logoUrl}
              className="h-12 w-12"
              size={48}
            />
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-[15px] font-medium tracking-tight text-paper">
                {channel.name}
              </h3>
              <p className="mt-0.5 text-[13px] font-normal text-fog">
                {subtitle || "—"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <ChannelFavouriteButton channel={channel} />
            <Button
              size="icon"
              variant={isLive ? "default" : "outline"}
              onClick={() => {
                if (isCurrent && isPlaying) {
                  pause();
                  return;
                }
                onChannelSelect?.(channel.slug);
              }}
              aria-label={
                isCurrent && isPlaying ? "Pause" : `Play ${channel.name}`
              }
            >
              {isCurrent && isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {channel.categories.slice(0, 3).map((g) => (
            <span
              key={g}
              className="rounded-badges bg-white/[0.05] px-1.5 py-0 text-[12px] font-normal leading-[1.4] text-fog"
            >
              {formatChannelCategoryLabel(g)}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <button
            type="button"
            onClick={() => onChannelSelect?.(channel.slug)}
            className="text-left text-[13px] font-normal text-mist transition-colors hover:text-paper"
          >
            View channel →
          </button>
          {isLive && (
            <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-normal text-fog">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse-green" />
              <span>Live</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
