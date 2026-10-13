import type { GuideProgramme } from "@/lib/channels";

/**
 * Baked /epg/*.json only covers about 36 hours. The PWA has no
 * background refresh, so a stale file makes every row say "Nothing listed".
 * i.mjh.nz publishes a small gzipped guide (CORS open on the raw file)
 * that the list and modal can share.
 */
const LIVE_GUIDE_URL =
  "https://raw.githubusercontent.com/matthuisman/i.mjh.nz/refs/heads/master/au/all/tv.json.gz";

const PAST_MS = 2 * 60 * 60 * 1000;
const FUTURE_MS = 36 * 60 * 60 * 1000;

type TvJsonEntry = { programs?: unknown };

let liveGuides: Promise<Map<string, GuideProgramme[]>> | null = null;

function programmesFromEntry(
  programs: unknown,
  now: Date
): GuideProgramme[] {
  if (!Array.isArray(programs) || programs.length < 2) return [];
  const windowStart = now.getTime() - PAST_MS;
  const windowEnd = now.getTime() + FUTURE_MS;
  const sorted = programs
    .filter(
      (p): p is [number, string] =>
        Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "string"
    )
    .map((p) => ({ startSec: p[0], title: p[1] }))
    .sort((a, b) => a.startSec - b.startSec);

  const out: GuideProgramme[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = new Date(sorted[i].startSec * 1000);
    const stopSec =
      i + 1 < sorted.length
        ? sorted[i + 1].startSec
        : sorted[i].startSec + 30 * 60;
    const stop = new Date(stopSec * 1000);
    if (stop.getTime() < windowStart || start.getTime() > windowEnd) continue;
    out.push({
      start: start.toISOString(),
      stop: stop.toISOString(),
      title: sorted[i].title,
      subtitle: null,
      description: null,
      category: null,
    });
  }
  return out;
}

async function gunzipToText(buf: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("gzip decode unavailable");
  }
  const stream = new Blob([buf])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

function loadLiveGuides(): Promise<Map<string, GuideProgramme[]>> {
  if (!liveGuides) {
    const now = new Date();
    liveGuides = fetch(LIVE_GUIDE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Live guide unavailable");
        return response.arrayBuffer();
      })
      .then(gunzipToText)
      .then((text) => {
        const data = JSON.parse(text) as Record<string, TvJsonEntry>;
        const map = new Map<string, GuideProgramme[]>();
        for (const [id, entry] of Object.entries(data)) {
          const programmes = programmesFromEntry(entry?.programs, now);
          if (programmes.length) map.set(id, programmes);
        }
        return map;
      })
      .catch((error) => {
        liveGuides = null;
        throw error;
      });
  }
  return liveGuides;
}

export function getLiveProgrammes(
  channelId: string
): Promise<GuideProgramme[] | null> {
  return loadLiveGuides().then((map) => map.get(channelId) ?? null);
}

/** True when the file still contains a programme that has not ended. */
export function guideStillCurrent(
  programmes: GuideProgramme[],
  at: Date
): boolean {
  if (!programmes.length) return false;
  const last = programmes[programmes.length - 1];
  return new Date(last.stop).getTime() > at.getTime();
}
