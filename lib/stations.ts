/**
 * Station list — loaded from stations-from-api.json (Radio Browser API).
 * No database required for MVP. Run scripts/fetch-radio-browser-stations.js to refresh.
 */

import stationsData from "../stations-from-api.json";

export interface Station {
  id: string;
  slug: string;
  callsign: string;
  name: string;
  frequency: string | null;
  city: string;
  state: string;
  description: string | null;
  website: string | null;
  streamUrl: string | null;
  streamFormat: string | null;
  streamBitrate: number | null;
  metadataTier: number;
  metadataUrl: string | null;
  logoUrl: string | null;
  genres: string[];
  indigenous: boolean;
}

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url || url === "null") return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

interface StationRow {
  slug: string;
  callsign: string;
  name: string;
  frequency?: string | null;
  city?: string;
  state?: string;
  description?: string | null;
  website?: string | null;
  streamUrl?: string | null;
  streamFormat?: string | null;
  streamBitrate?: number | null;
  metadataTier?: number;
  metadataUrl?: string | null;
  logoUrl?: string | null;
  genres?: string[];
  indigenous?: boolean;
}

function toStation(row: StationRow): Station {
  return {
    id: row.slug,
    slug: row.slug,
    callsign: row.callsign,
    name: row.name,
    frequency: row.frequency || null,
    city: row.city ?? "",
    state: row.state ?? "",
    description: row.description ?? null,
    website: row.website ?? null,
    streamUrl: row.streamUrl ?? null,
    streamFormat: row.streamFormat ?? null,
    streamBitrate: row.streamBitrate ?? null,
    metadataTier: row.metadataTier ?? 0,
    metadataUrl: row.metadataUrl ?? null,
    logoUrl: isValidImageUrl(row.logoUrl) ? row.logoUrl : null,
    genres: row.genres ?? [],
    indigenous: row.indigenous ?? false,
  };
}

let stationsCache: Station[] | null = null;

export function getStations(): Station[] {
  if (!stationsCache) {
    stationsCache = (stationsData as StationRow[]).map((row) => toStation(row));
  }
  return stationsCache;
}

export function getStationBySlug(slug: string): Station | undefined {
  return getStations().find((s) => s.slug === slug);
}

export function getStationById(id: string): Station | undefined {
  return getStations().find((s) => s.id === id);
}

export function filterStations(options: {
  search?: string;
  genre?: string;
  state?: string;
  indigenous?: boolean;
}): Station[] {
  let stations = getStations();

  if (options.genre) {
    const genre = options.genre.toLowerCase();
    stations = stations.filter((s) =>
      s.genres.some((g) => g.toLowerCase() === genre)
    );
  }

  if (options.state) {
    stations = stations.filter((s) => s.state === options.state);
  }

  if (options.search && options.search.trim()) {
    const term = options.search.trim().toLowerCase();
    stations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.callsign.toLowerCase().includes(term) ||
        s.city.toLowerCase().includes(term)
    );
  }

  if (options.indigenous) {
    stations = stations.filter((s) => s.indigenous);
  }

  return stations.sort((a, b) => {
    const aHasLoc = !!(a.city || a.state);
    const bHasLoc = !!(b.city || b.state);
    if (aHasLoc !== bHasLoc) return aHasLoc ? -1 : 1; // with location first
    return a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
  });
}

export function getFilterOptions(): { states: string[]; genres: string[] } {
  const stations = getStations();
  const stateCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};
  for (const s of stations) {
    if (s.state?.trim()) stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
    for (const g of s.genres || []) {
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
