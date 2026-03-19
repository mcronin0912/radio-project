/**
 * Client-side filter logic for stations (used when no API/server available, e.g. static export)
 */

export interface StationRow {
  slug: string;
  callsign: string;
  name: string;
  frequency?: string | null;
  city?: string;
  state?: string;
  website?: string | null;
  streamUrl?: string | null;
  streamFormat?: string | null;
  streamBitrate?: number | null;
  logoUrl?: string | null;
  genres?: string[];
  indigenous?: boolean;
}

export function filterStationsClient(
  stations: StationRow[],
  options: { search?: string; genre?: string; state?: string; indigenous?: boolean }
): StationRow[] {
  let result = [...stations];

  if (options.genre) {
    const genre = options.genre.toLowerCase();
    result = result.filter((s) =>
      (s.genres ?? []).some((g) => g.toLowerCase() === genre)
    );
  }

  if (options.state) {
    result = result.filter((s) => s.state === options.state);
  }

  if (options.search?.trim()) {
    const term = options.search.trim().toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.callsign.toLowerCase().includes(term) ||
        (s.city ?? "").toLowerCase().includes(term)
    );
  }

  if (options.indigenous) {
    result = result.filter((s) => s.indigenous);
  }

  return result.sort((a, b) => {
    const aHasLoc = !!((a.city ?? "").trim() || (a.state ?? "").trim());
    const bHasLoc = !!((b.city ?? "").trim() || (b.state ?? "").trim());
    if (aHasLoc !== bHasLoc) return aHasLoc ? -1 : 1;
    return (a.state ?? "").localeCompare(b.state ?? "") || a.name.localeCompare(b.name);
  });
}

export function getFilterOptionsFromStations(stations: StationRow[]): {
  states: string[];
  genres: string[];
} {
  const stateCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};
  for (const s of stations) {
    if ((s.state ?? "").trim()) stateCounts[s.state!] = (stateCounts[s.state!] || 0) + 1;
    for (const g of s.genres ?? []) {
      const key = g.trim().toLowerCase();
      if (key) genreCounts[key] = (genreCounts[key] || 0) + 1;
    }
  }
  const states = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
  const genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);
  return { states, genres };
}
