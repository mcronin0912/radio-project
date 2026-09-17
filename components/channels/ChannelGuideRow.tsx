"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelFavouriteButton } from "@/components/channels/ChannelFavouriteButton";
import { ChannelLogo } from "@/components/channels/ChannelLogo";
import { useChannelGuide } from "@/lib/use-channel-guide";
import { usePlayer } from "@/lib/player-context";
import { cn } from "@/lib/utils";
import type { Channel, GuideProgramme } from "@/lib/channels";

/** Shared with header so column edges stay aligned (fixed actions width). */
export const GUIDE_LIST_GRID =
  "sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.85fr)_5.75rem]";

interface ChannelGuideRowProps {
  channel: Channel;
  onChannelSelect?: (slug: string) => void;
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function ProgrammeCell({
  programme,
  loading,
  emptyLabel,
  live,
}: {
  programme: GuideProgramme | null;
  loading: boolean;
  emptyLabel: string;
  live?: boolean;
}) {
  if (loading) {
    return (
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0" aria-hidden />
          <p className="text-[13px] font-normal text-ash">…</p>
        </div>
      </div>
    );
  }
  if (!programme) {
    return (
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0" aria-hidden />
          <p className="text-[13px] font-normal text-ash">{emptyLabel}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
            live
              ? "animate-pulse bg-pulse-green"
              : "bg-transparent"
          )}
          aria-hidden={!live}
        />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[13px] font-medium tracking-tight",
              live ? "text-paper" : "text-mist"
            )}
          >
            {programme.title}
          </p>
          <p className="mt-0.5 font-mono text-[11px] font-normal tracking-tight text-fog">
            {formatTime(programme.start)} – {formatTime(programme.stop)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChannelGuideRow({
  channel,
  onChannelSelect,
}: ChannelGuideRowProps) {
  const { media, isPlaying, pause } = usePlayer();
  const { loading, nowPlaying, nextProgramme } = useChannelGuide(
    channel.slug,
    channel.hasGuide
  );

  const isCurrent =
    media?.kind === "tv" && media.channel.slug === channel.slug;
  const isLive = isCurrent && isPlaying;

  const details = [channel.network, channel.state, channel.streamQuality]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-3 border-b border-graphite px-3 py-3 transition-colors sm:gap-4 sm:px-4",
        GUIDE_LIST_GRID,
        isLive && "bg-white/[0.02]"
      )}
    >
      {/* Channel */}
      <button
        type="button"
        onClick={() => onChannelSelect?.(channel.slug)}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <ChannelLogo url={channel.logoUrl} className="h-10 w-10" size={40} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium tracking-tight text-paper">
            {channel.name}
          </p>
          {channel.state && !channel.name.includes(channel.state) && (
            <p className="mt-0.5 truncate text-[12px] font-normal text-fog">
              {channel.state}
            </p>
          )}
        </div>
      </button>

      {/* Now */}
      <div className="min-w-0 pl-[3.25rem] sm:pl-0">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.04em] text-ash sm:hidden">
          Now
        </p>
        <ProgrammeCell
          programme={nowPlaying}
          loading={loading}
          emptyLabel={channel.hasGuide === false ? "No guide" : "Nothing listed"}
          live={Boolean(nowPlaying)}
        />
      </div>

      {/* Next */}
      <div className="min-w-0 pl-[3.25rem] sm:pl-0">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.04em] text-ash sm:hidden">
          Next
        </p>
        <ProgrammeCell
          programme={nextProgramme}
          loading={loading}
          emptyLabel="—"
        />
      </div>

      {/* Details */}
      <div className="min-w-0 pl-[3.25rem] sm:pl-0">
        <p className="truncate text-[13px] font-normal text-fog">
          {details || "—"}
        </p>
        {channel.label && (
          <p className="mt-0.5 truncate text-[11px] font-normal text-ash">
            {channel.label}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center justify-end gap-1 pl-[3.25rem] sm:pl-0">
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
            isCurrent && isPlaying ? "Pause" : `Watch ${channel.name}`
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
  );
}
