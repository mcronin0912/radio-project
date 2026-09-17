"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChannelGuide, GuideProgramme } from "@/lib/channels";
import {
  findNextProgramme,
  findNowPlaying,
  upcomingProgrammes,
} from "@/lib/channels";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function useChannelGuide(slug: string | null, hasGuide?: boolean) {
  const [guide, setGuide] = useState<ChannelGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
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

    fetch(`${BASE}/epg/${encodeURIComponent(slug)}.json`)
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
  }, [slug, hasGuide]);

  const nowPlaying: GuideProgramme | null = guide
    ? findNowPlaying(guide.programmes, now)
    : null;
  const nextProgramme: GuideProgramme | null = guide
    ? findNextProgramme(guide.programmes, now)
    : null;
  const upcoming: GuideProgramme[] = guide
    ? upcomingProgrammes(guide.programmes, now)
    : [];

  const refreshClock = useCallback(() => setNow(new Date()), []);

  return {
    guide,
    loading,
    error,
    nowPlaying,
    nextProgramme,
    upcoming,
    now,
    refreshClock,
  };
}
