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
        (s.city ?? "").toLowerCase().includes(term) ||
        (s.state ?? "").toLowerCase().includes(term)
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

/** Dropdown label when value is a state/territory code (matches cleaned JSON). */
const STATE_ALL_LABEL: Record<string, string> = {
  NSW: "All New South Wales",
  VIC: "All Victoria",
  QLD: "All Queensland",
  SA: "All South Australia",
  WA: "All Western Australia",
  NT: "All Northern Territory",
  TAS: "All Tasmania",
  ACT: "All ACT",
};

const AU_STATE_CODES = new Set([
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
  "ACT",
]);

/** City (lowercase) → region code; used when bucketing with cleaned state+city fields. */
const CITY_TO_REGION: Record<string, string> = {
  sydney: "NSW",
  newcastle: "NSW",
  wollongong: "NSW",
  "wagga wagga": "NSW",
  wagga: "NSW",
  gosford: "NSW",
  "central coast": "NSW",
  goulburn: "NSW",
  cooma: "NSW",
  nowra: "NSW",
  bowral: "NSW",
  dubbo: "NSW",
  illawarra: "NSW",
  braidwood: "NSW",
  melbourne: "VIC",
  geelong: "VIC",
  ballarat: "VIC",
  bendigo: "VIC",
  shepparton: "VIC",
  perth: "WA",
  subiaco: "WA",
  brisbane: "QLD",
  "gold coast": "QLD",
  townsville: "QLD",
  cairns: "QLD",
  toowoomba: "QLD",
  rockhampton: "QLD",
  mackay: "QLD",
  longreach: "QLD",
  adelaide: "SA",
  hobart: "TAS",
  launceston: "TAS",
  darwin: "NT",
  canberra: "ACT",
  "alice springs": "NT",
  alice: "NT",
  kalgoorlie: "WA",
  karratha: "WA",
  busselton: "WA",
  kimberley: "WA",
  "northern tasmania": "TAS",
};

/** Region bucket for a station (aligned with LOCATION_GROUPS keys + National + Other). */
function stationLocationGroup(s: StationRow): string {
  const stateRaw = (s.state ?? "").trim();
  const cityRaw = (s.city ?? "").trim();
  const stateUp = stateRaw.toUpperCase();

  if (stateUp && AU_STATE_CODES.has(stateUp)) return stateUp;

  const cityLower = cityRaw.toLowerCase();
  if (cityLower === "australia wide") return "National";

  if (cityLower && CITY_TO_REGION[cityLower]) return CITY_TO_REGION[cityLower];

  const glue = `${cityRaw} ${stateRaw}`.trim();
  if (glue && /national|australia wide|multi-state|nsw.*vic|vic.*nsw|nsw.*act/i.test(glue)) {
    return "National";
  }

  if (stateRaw) {
    const g = getLocationGroup(stateRaw);
    if (g !== "Other") return g;
  }
  if (cityRaw) {
    const g = getLocationGroup(cityRaw);
    if (g !== "Other") return g;
  }
  return "Other";
}

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
  { name: "Rock & alternative", patterns: [/rock/i, /^indie$/i, /metal/i, /grunge/i] },
  { name: "Community & local", patterns: [/community/i, /local programming/i, /^abc$/i] },
  {
    name: "News & talk",
    patterns: [/news/i, /talk/i, /conservative/i, /current affairs/i, /weather/i],
  },
  {
    name: "Decades & era",
    patterns: [/^\d{2}s$/i, /^\d{4}s$/i, /\d{2}s\s/, /70s|80s|90s|60s|50s/i, /decades/i],
  },
  { name: "Adult contemporary & pop", patterns: [/adult/i, /^pop$/i, /^hits$/i, /contemporary hit/i] },
  { name: "Christian", patterns: [/christian/i, /gospel/i] },
  { name: "Sport", patterns: [/sport/i] },
  { name: "Classical", patterns: [/^classical/i] },
  { name: "Classic & oldies", patterns: [/classic/i, /oldies/i] },
  { name: "Jazz & blues", patterns: [/jazz/i, /blues/i] },
  {
    name: "Electronic & dance",
    patterns: [/electronic/i, /^dance$/i, /house/i, /trance/i, /techno/i],
  },
  { name: "Country", patterns: [/country/i] },
  { name: "Indigenous", patterns: [/aboriginal/i, /indigenous/i] },
  {
    name: "World & hip-hop",
    patterns: [/world/i, /ethnic/i, /african/i, /latin/i, /hip hop/i, /hip-hop/i, /r&b/i],
  },
  { name: "Easy listening", patterns: [/easy listening/i] },
  { name: "Folk", patterns: [/^folk/i] },
  { name: "Kids & comedy", patterns: [/kids/i, /comedy/i] },
  { name: "Commercial", patterns: [/^commercial/i] },
  { name: "Music (general)", patterns: [/^music$/i, /^eclectic/i] },
];

function getGenreGroup(genre: string): string {
  const g = genre.toLowerCase();
  for (const { name, patterns } of GENRE_GROUPS) {
    if (patterns.some((p) => p.test(g))) return name;
  }
  return "Other";
}

function normalizeLocationOptionValue(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const up = t.toUpperCase();
  if (AU_STATE_CODES.has(up)) return up;
  return t;
}

function sortLocationOptions(opts: Array<{ value: string; count: number }>) {
  return [...opts].sort((a, b) => {
    const aCode = AU_STATE_CODES.has(a.value.toUpperCase());
    const bCode = AU_STATE_CODES.has(b.value.toUpperCase());
    if (aCode && !bCode) return -1;
    if (!aCode && bCode) return 1;
    return a.value.localeCompare(b.value, undefined, { sensitivity: "base" });
  });
}

/** Human-readable location row in the select (value stays as stored for filtering). */
export function formatLocationOptionLabel(value: string): string {
  const v = value.trim();
  const up = v.toUpperCase();
  if (STATE_ALL_LABEL[up]) return STATE_ALL_LABEL[up];
  if (v.toLowerCase() === "australia wide") return "Australia wide";
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-readable genre label (filter value stays lowercase slug). */
export function formatGenreOptionLabel(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "r&b") return "R&B";
  if (v === "abc") return "ABC";
  return v
    .split(/\s+/)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
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
      const key = normalizeLocationOptionValue(loc!);
      locationCounts[key] = (locationCounts[key] || 0) + 1;
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
  const locationByGroup: Record<string, Map<string, number>> = {};
  const bumpLoc = (groupKey: string, locRaw: string) => {
    const loc = normalizeLocationOptionValue(locRaw);
    if (!loc) return;
    if (!locationByGroup[groupKey]) locationByGroup[groupKey] = new Map();
    const m = locationByGroup[groupKey]!;
    m.set(loc, (m.get(loc) ?? 0) + 1);
  };

  for (const s of stations) {
    const group = stationLocationGroup(s);
    const st = (s.state ?? "").trim();
    const city = (s.city ?? "").trim();
    if (st) bumpLoc(group, st);
    if (city) bumpLoc(group, city);
  }

  const locationGroups: FilterOptionGroup[] = groupOrder
    .filter((g) => locationByGroup[g]?.size)
    .map((groupKey) => {
      const m = locationByGroup[groupKey]!;
      const options = sortLocationOptions(
        Array.from(m.entries()).map(([value, count]) => ({ value, count }))
      );
      return {
        group:
          groupKey === "National"
            ? "National & multi-state"
            : groupKey === "Other"
              ? "Other locations"
              : (LOCATION_GROUPS[groupKey] ?? groupKey),
        options,
      };
    });

  const genreGroupOrder = [...GENRE_GROUPS.map((g) => g.name), "Other"];
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
