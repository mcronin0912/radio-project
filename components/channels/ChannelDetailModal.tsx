"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelFavouriteButton } from "@/components/channels/ChannelFavouriteButton";
import { ChannelPlayButton } from "@/components/channels/ChannelPlayButton";
import { ChannelGuidePanel } from "@/components/channels/ChannelGuidePanel";
import { ChannelLogo } from "@/components/channels/ChannelLogo";
import { usePlayer } from "@/lib/player-context";
import { useChannelGuide } from "@/lib/use-channel-guide";
import { formatChannelCategoryLabel } from "@/lib/channel-categories";
import type { Channel } from "@/lib/channels";

interface ChannelDetailModalProps {
  channel: Channel;
  onClose: () => void;
}

export function ChannelDetailModal({
  channel,
  onClose,
}: ChannelDetailModalProps) {
  const {
    media,
    isPlaying,
    playChannel,
    registerVideoHost,
    setVideoModalOpen,
    getVideoElement,
  } = usePlayer();
  const videoHostRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const startedForSlug = useRef<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isCurrent =
    media?.kind === "tv" && media.channel.slug === channel.slug;

  const { loading, error, nowPlaying, upcoming, guide } = useChannelGuide(
    channel.slug,
    channel.hasGuide
  );

  useEffect(() => {
    setVideoModalOpen(true);
    return () => setVideoModalOpen(false);
  }, [setVideoModalOpen]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Register the visible video host BEFORE paint so playback never starts in display:none.
  useLayoutEffect(() => {
    const el = videoHostRef.current;
    if (el) registerVideoHost("modal", el);
    return () => registerVideoHost("modal", null);
  }, [registerVideoHost, channel.slug]);

  // Start (or switch) stream only after the host is mounted.
  useEffect(() => {
    if (!channel.streamUrl) return;
    if (startedForSlug.current === channel.slug) return;
    startedForSlug.current = channel.slug;
    playChannel(channel);
  }, [channel, playChannel]);

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const wrap = videoWrapRef.current;
      if (wrap?.requestFullscreen) {
        await wrap.requestFullscreen();
        return;
      }
      const video = getVideoElement() as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null;
      video?.webkitEnterFullscreen?.();
    } catch (e) {
      console.warn("Fullscreen failed:", e);
    }
  }

  const subtitle = [channel.network, channel.state, channel.streamQuality]
    .filter(Boolean)
    .join(" · ");

  const titleLine = nowPlaying?.title
    ? `${channel.name} – ${nowPlaying.title}`
    : channel.name;

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-void [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="channel-modal-title"
    >
      <div className="mx-auto min-h-full max-w-page px-4 py-8 pb-32 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="mr-2 h-4 w-4" />
          Back to directory
        </Button>

        <div
          ref={videoWrapRef}
          className={
            isFullscreen
              ? "relative h-screen w-screen bg-black"
              : "relative mt-6 aspect-video w-full overflow-hidden rounded-cards bg-black"
          }
        >
          <div ref={videoHostRef} className="absolute inset-0 bg-black" />
        </div>

        <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          <ChannelLogo
            url={channel.logoUrl}
            className="h-24 w-24 rounded-cards p-2 shadow-subtle"
            iconClassName="h-10 w-10"
            size={96}
          />
          <div className="min-w-0 flex-1">
            <h1
              id="channel-modal-title"
              className="text-[32px] font-medium leading-[1.13] tracking-[-0.022em] text-paper"
            >
              {titleLine}
            </h1>
            <p className="mt-2 text-[15px] font-normal text-fog">
              {subtitle || "Australian TV"}
              {nowPlaying?.subtitle ? ` · ${nowPlaying.subtitle}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ...channel.categories.map((g) =>
                  formatChannelCategoryLabel(g)
                ),
                channel.network,
                channel.state,
              ]
                .filter(Boolean)
                .filter((tag, i, arr) => arr.indexOf(tag) === i)
                .map((tag) => (
                  <span
                    key={tag as string}
                    className="rounded-badges bg-white/[0.05] px-1.5 py-0 text-[12px] font-normal text-fog"
                  >
                    {tag}
                  </span>
                ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <ChannelFavouriteButton channel={channel} bordered />
              <ChannelPlayButton channel={channel} />
              <Button
                type="button"
                variant="outline"
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? (
                  <Minimize2 className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="mr-2 h-3.5 w-3.5" />
                )}
                {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </Button>
              {channel.website && (
                <a
                  href={channel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-buttons border border-graphite bg-transparent px-3 py-2 text-[13px] font-normal text-mist transition-colors hover:border-smoke hover:bg-white/[0.02]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {isCurrent && isPlaying && (
                <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-normal text-fog">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse-green" />
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <ChannelGuidePanel
          loading={loading}
          error={error}
          hasGuide={channel.hasGuide ?? Boolean(guide)}
          programmes={upcoming}
          nowPlaying={nowPlaying}
        />

        {channel.label && (
          <p className="mt-8 text-[13px] font-normal text-fog">
            Note: {channel.label}
          </p>
        )}
      </div>
    </div>
  );
}
