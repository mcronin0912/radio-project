"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChannelGuide, GuideProgramme } from "@/lib/channels";
import {
  findNextProgramme,
  findNowPlaying,
  upcomingProgrammes,
} from "@/lib/channels";
import { getLiveProgrammes, guideStillCurrent } from "@/lib/live-tv-guide";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function useChannelGuide(
  slug: string | null,
  hasGuide?: boolean,
  channelId?: string | null
) {
  const [guide, setGuide] = useState<ChannelGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reloadToken, setReloadToken] = useState(0);
  const [liveProgrammes, setLiveProgrammes] = useState<GuideProgramme[] | null>(
    null
  );
  const [liveState, setLiveState] = useState<
    "idle" | "loading" | "ready" | "error"
  >(channelId ? "loading" : "idle");

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Desktop refreshes EPG in the background; refetch when that finishes.
  useEffect(() => {
    const unsub = window.radioDesktop?.onEpgUpdated?.(() => {
      setReloadToken((n) => n + 1);
      setNow(new Date());
    });
    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!slug || hasGuide === false) {
      setGuide(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = `${BASE}/epg/${encodeURIComponent(slug)}.json?r=${reloadToken}`;

    fetch(url)
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) {
            setGuide(null);
            setError(null);
          }
          return;
        }
        if (!r.ok) throw new Error("Guide unavailable");
        const data = (await r.json()) as ChannelGuide;
        if (!cancelled) setGuide(data);
      })
      .catch(() => {
        if (!cancelled) {
          setGuide(null);
          setError("Guide unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, hasGuide, reloadToken]);

  // One shared download for every row. Baked JSON is preferred while it
  // still covers "now"; otherwise the live programmes replace it.
  useEffect(() => {
    if (!channelId) {
      setLiveProgrammes(null);
      setLiveState("idle");
      return;
    }
    let cancelled = false;
    setLiveState("loading");
    getLiveProgrammes(channelId)
      .then((programmes) => {
        if (cancelled) return;
        setLiveProgrammes(programmes);
        setLiveState("ready");
      })
      .catch(() => {
        if (!cancelled) setLiveState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const bakedCovers =
    guide != null && guideStillCurrent(guide.programmes, now);
  const programmes: GuideProgramme[] = bakedCovers
    ? guide.programmes
    : liveProgrammes ?? guide?.programmes ?? [];

  const waitingForLive =
    !bakedCovers && liveState === "loading" && Boolean(channelId);

  const nowPlaying: GuideProgramme | null = programmes.length
    ? findNowPlaying(programmes, now)
    : null;
  const nextProgramme: GuideProgramme | null = programmes.length
    ? findNextProgramme(programmes, now)
    : null;
  const upcoming: GuideProgramme[] = programmes.length
    ? upcomingProgrammes(programmes, now)
    : [];

  const refreshClock = useCallback(() => setNow(new Date()), []);

  return {
    guide,
    loading: waitingForLive || (loading && !(liveProgrammes && liveProgrammes.length)),
    error,
    nowPlaying,
    nextProgramme,
    upcoming,
    now,
    refreshClock,
    guideAvailable:
      bakedCovers || (liveProgrammes?.length ?? 0) > 0 || guide != null,
  };
}
