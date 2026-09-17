/**
 * TV channel list — loaded from channels-from-api.json (i.mjh.nz AU Freeview, all states).
 * Programme guides: public/epg/{slug}.json — refresh with npm run channels:fetch
 */

export interface Channel {
  slug: string;
  channelId: string;
  name: string;
  network: string | null;
  categories: string[];
  website: string | null;
  logoUrl: string | null;
  streamUrl: string;
  streamQuality: string | null;
  state: string | null;
  feed: string | null;
  label: string | null;
  /** True when public/epg/{slug}.json exists from last fetch */
  hasGuide?: boolean;
}

export type ChannelRow = Channel;

export interface GuideProgramme {
  start: string;
  stop: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
}

export interface ChannelGuide {
  slug: string;
  epgId: string;
  region: string;
  updatedAt: string;
  programmes: GuideProgramme[];
}

export function findNowPlaying(
  programmes: GuideProgramme[],
  at: Date = new Date()
): GuideProgramme | null {
  const t = at.getTime();
  return (
    programmes.find((p) => {
      const start = new Date(p.start).getTime();
      const stop = new Date(p.stop).getTime();
      return start <= t && t < stop;
    }) ?? null
  );
}

export function upcomingProgrammes(
  programmes: GuideProgramme[],
  at: Date = new Date(),
  limit = 12
): GuideProgramme[] {
  const t = at.getTime();
  return programmes
    .filter((p) => new Date(p.stop).getTime() > t)
    .slice(0, limit);
}

/** Programme after the one currently on air (or the next upcoming if nothing is live). */
export function findNextProgramme(
  programmes: GuideProgramme[],
  at: Date = new Date()
): GuideProgramme | null {
  const nowPlaying = findNowPlaying(programmes, at);
  const upcoming = upcomingProgrammes(programmes, at, 3);
  if (!upcoming.length) return null;
  if (!nowPlaying) return upcoming[0] ?? null;
  return (
    upcoming.find(
      (p) => p.start !== nowPlaying.start || p.title !== nowPlaying.title
    ) ?? null
  );
}
