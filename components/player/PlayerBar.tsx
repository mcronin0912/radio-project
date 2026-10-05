"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-context";
import { Button } from "@/components/ui/button";
import { WaveformVisualizer } from "@/components/player/WaveformVisualizer";
import { ChevronUp, Pause, Play, Volume2, VolumeX } from "lucide-react";

export function PlayerBar() {
  const {
    media,
    isPlaying,
    volume,
    error,
    isReconnecting,
    pause,
    play,
    playChannel,
    setVolume,
    clearError,
    registerVideoHost,
    videoModalOpen,
    openTvModal,
  } = usePlayer();

  const videoThumbRef = useRef<HTMLDivElement>(null);
  const isTv = media?.kind === "tv";
  const showTvThumb = isTv && isPlaying && !videoModalOpen;

  useEffect(() => {
    const el = videoThumbRef.current;
    if (showTvThumb && el) {
      registerVideoHost("bar", el);
      return () => registerVideoHost("bar", null);
    }
    registerVideoHost("bar", null);
    return () => registerVideoHost("bar", null);
  }, [showTvThumb, registerVideoHost]);

  if (!media) return null;

  const name =
    media.kind === "radio" ? media.station.name : media.channel.name;
  const isMuted = volume === 0;
  const handleVolumeClick = () => (isMuted ? setVolume(1) : setVolume(0));

  const togglePlayback = () => {
    if (isPlaying) {
      pause();
      return;
    }
    if (media.kind === "radio") play(media.station);
    else playChannel(media.channel);
  };

  const reopenTv = () => {
    if (media.kind === "tv") openTvModal(media.channel);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-graphite bg-carbon shadow-subtle">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-6 pt-4 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showTvThumb ? (
            <button
              type="button"
              onClick={reopenTv}
              className="group relative h-10 w-[4.5rem] shrink-0 overflow-hidden rounded-badges bg-black outline-none transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:ring-mist"
              aria-label={`Open ${media.kind === "tv" ? media.channel.name : "channel"}`}
            >
              <div ref={videoThumbRef} className="absolute inset-0" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ChevronUp className="h-4 w-4 text-paper" strokeWidth={2.5} />
              </span>
              <span className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-black/70 text-paper group-hover:opacity-0">
                <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
              </span>
            </button>
          ) : (
            <div
              ref={videoThumbRef}
              className="hidden"
              aria-hidden
            />
          )}
          <button
            type="button"
            onClick={isTv ? reopenTv : undefined}
            disabled={!isTv}
            className={`min-w-0 flex-1 text-left ${
              isTv
                ? "rounded-sm outline-none transition-colors hover:text-paper focus-visible:ring-1 focus-visible:ring-mist"
                : ""
            }`}
            aria-label={isTv ? `Open ${name}` : undefined}
          >
            <p className="truncate text-[14px] font-medium tracking-tight text-paper">
              {name}
            </p>
            {isTv && (
              <p className="truncate text-[11px] font-normal text-fog">TV</p>
            )}
          </button>
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
            onClick={togglePlayback}
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
      {!isTv && (
        <div className="mx-auto max-w-page px-6 pb-3">
          <WaveformVisualizer />
        </div>
      )}
      {isTv && <div className="pb-3" />}
      {error && (
        <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-6 pb-4">
          <p className="text-[12px] font-normal text-coral-red">
            Stream unavailable. Check the URL or try another{" "}
            {isTv ? "channel" : "station"}.
          </p>
          <Button size="xs" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
