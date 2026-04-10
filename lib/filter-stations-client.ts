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
    result = result.filter(
      (s) => s.state === options.state || s.city === options.state
    );
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

const LOCATION_GROUPS: Record<string, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  SA: "South Australia",
  WA: "Western Australia",
  NT: "Northern Territory",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
};

function getLocationGroup(loc: string): string {
  if (/NSW|NEW SOUTH WALES/i.test(loc)) return "NSW";
  if (/VIC|VICTORIA|MELBOURNE/i.test(loc)) return "VIC";
  if (/QLD|QUEENSLAND|BRISBANE|CAIRNS|TOWNSVILLE|GOLD COAST/i.test(loc)) return "QLD";
  if (/SA|SOUTH AUSTRALIA|ADELAIDE/i.test(loc)) return "SA";
  if (/WA|WESTERN AUSTRALIA|PERTH/i.test(loc)) return "WA";
  if (/NT|NORTHERN TERRITORY|DARWIN/i.test(loc)) return "NT";
  if (/TAS|TASMANIA|HOBART|LAUNCESTON/i.test(loc)) return "TAS";
  if (/ACT|CANBERRA|AUSTRALIAN CAPITAL/i.test(loc)) return "ACT";
  if (/NATIONAL|AUSTRALIA WIDE|AU-VIC|NSW.*VIC|MULTI/i.test(loc)) return "National";
  return "Other";
}

const GENRE_GROUPS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "Rock", patterns: [/rock/i] },
  { name: "Community", patterns: [/community/i] },
  { name: "News & Talk", patterns: [/news/i, /talk/i, /conservative/i] },
  { name: "Decades & Era", patterns: [/^\d{2}s$/i, /^\d{4}s$/i, /70s|80s|90s|60s|50s/i, /decades/i] },
  { name: "Adult Contemporary", patterns: [/adult/i] },
  { name: "Christian", patterns: [/christian/i] },
  { name: "Sport", patterns: [/sport/i] },
  { name: "Classic & Oldies", patterns: [/classic/i, /oldies/i] },
  { name: "Jazz & Blues", patterns: [/jazz/i, /blues/i] },
  { name: "Electronic & Dance", patterns: [/electronic/i, /dance/i, /house/i, /trance/i] },
  { name: "Country", patterns: [/country/i] },
  { name: "Indigenous & Aboriginal", patterns: [/aboriginal/i, /indigenous/i] },
  { name: "World & Ethnic", patterns: [/world/i, /ethnic/i, /african/i, /latin/i] },
];

function getGenreGroup(genre: string): string {
  const g = genre.toLowerCase();
  for (const { name, patterns } of GENRE_GROUPS) {
    if (patterns.some((p) => p.test(g))) return name;
  }
  return "Other";
}

export interface FilterOptionGroup {
  group: string;
  options: Array<{ value: string; count: number }>;
}

export function getFilterOptionsFromStations(stations: StationRow[]): {
  states: string[];
  genres: string[];
  locationGroups: FilterOptionGroup[];
  genreGroups: FilterOptionGroup[];
} {
  const locationCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};
  for (const s of stations) {
    for (const loc of [s.state, s.city].filter((v) => (v ?? "").trim())) {
      locationCounts[loc!] = (locationCounts[loc!] || 0) + 1;
    }
    for (const g of s.genres ?? []) {
      const key = g.trim().toLowerCase();
      if (key) genreCounts[key] = (genreCounts[key] || 0) + 1;
    }
  }

  const states = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
  const genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const groupOrder = ["NSW", "VIC", "QLD", "SA", "WA", "NT", "TAS", "ACT", "National", "Other"];
  const locationByGroup: Record<string, Array<{ value: string; count: number }>> = {};
  for (const [loc, count] of Object.entries(locationCounts).sort((a, b) => b[1] - a[1])) {
    const group = getLocationGroup(loc);
    if (!locationByGroup[group]) locationByGroup[group] = [];
    locationByGroup[group].push({ value: loc, count });
  }
  const locationGroups: FilterOptionGroup[] = groupOrder
    .filter((g) => locationByGroup[g]?.length)
    .map((group) => ({
      group: group === "Other" ? "Other" : (LOCATION_GROUPS[group] ?? group),
      options: locationByGroup[group],
    }));

  const genreGroupOrder = [
    ...GENRE_GROUPS.map((g) => g.name),
    "Other",
  ];
  const genreByGroup: Record<string, Array<{ value: string; count: number }>> = {};
  for (const [g, count] of Object.entries(genreCounts).sort((a, b) => b[1] - a[1])) {
    const group = getGenreGroup(g);
    if (!genreByGroup[group]) genreByGroup[group] = [];
    genreByGroup[group].push({ value: g, count });
  }
  const genreGroups: FilterOptionGroup[] = genreGroupOrder
    .filter((g) => genreByGroup[g]?.length)
    .map((group) => ({
      group,
      options: genreByGroup[group],
    }));

  return { states, genres, locationGroups, genreGroups };
}
