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
    channel.hasGuide,
    channel.channelId
  );

  const isCurrent =
    media?.kind === "tv" && media.channel.slug === channel.slug;
  const isLive = isCurrent && isPlaying;

  const details = [channel.network, channel.state, channel.streamQuality]
    .filter(Boolean)
    .join(" · ");
  const mobileMeta = [
    channel.network,
    channel.state && !channel.name.includes(channel.state) ? channel.state : null,
    channel.label,
  ]
    .filter(Boolean)
    .join(" · ");
  const nextLine = loading
    ? "…"
    : nextProgramme
      ? `${nextProgramme.title} · ${formatTime(nextProgramme.start)}`
      : "—";

  const renderActions = () => (
    <>
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
    </>
  );

  return (
    <>
    <div
      className={cn(
        "flex items-start gap-2 border-b border-graphite px-3 py-3 sm:hidden",
        isLive && "bg-white/[0.02]"
      )}
    >
      <button
        type="button"
        onClick={() => onChannelSelect?.(channel.slug)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <ChannelLogo url={channel.logoUrl} className="h-10 w-10 shrink-0" size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium tracking-tight text-paper">
            {channel.name}
          </p>
          <div className="mt-1">
            <ProgrammeCell
              programme={nowPlaying}
              loading={loading}
              emptyLabel={channel.hasGuide === false ? "No guide" : "Nothing listed"}
              live={Boolean(nowPlaying)}
            />
          </div>
          <p className="mt-1 truncate text-[12px] font-normal leading-[1.4] text-fog">
            <span className="text-ash">Next </span>
            <span className="text-mist">{nextLine}</span>
          </p>
          {mobileMeta ? (
            <p className="mt-0.5 truncate text-[12px] font-normal leading-[1.4] text-ash">
              {mobileMeta}
            </p>
          ) : null}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-0.5">{renderActions()}</div>
    </div>
    <div
      className={cn(
        "hidden items-center gap-4 border-b border-graphite px-4 py-3 transition-colors sm:grid",
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

      <div className="min-w-0">
        <ProgrammeCell
          programme={nowPlaying}
          loading={loading}
          emptyLabel={channel.hasGuide === false ? "No guide" : "Nothing listed"}
          live={Boolean(nowPlaying)}
        />
      </div>

      <div className="min-w-0">
        <ProgrammeCell
          programme={nextProgramme}
          loading={loading}
          emptyLabel="—"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-normal text-fog">
          {details || "—"}
        </p>
        {channel.label && (
          <p className="mt-0.5 truncate text-[11px] font-normal text-ash">
            {channel.label}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1">{renderActions()}</div>
    </div>
    </>
  );
}
