/**
 * Normalize stations-from-api.json: Australian city/state fields + consolidated genres.
 * Run: node scripts/clean-stations.js
 * Writes project root + public/stations-from-api.json
 */

const fs = require("fs");
const path = require("path");

const ROOT_JSON = path.join(__dirname, "..", "stations-from-api.json");
const PUBLIC_JSON = path.join(__dirname, "..", "public", "stations-from-api.json");

const FULL_STATE_TO_CODE = {
  "new south wales": "NSW",
  queensland: "QLD",
  victoria: "VIC",
  "western australia": "WA",
  "south australia": "SA",
  tasmania: "TAS",
  "northern territory": "NT",
  "australian capital territory": "ACT",
};

const CODE_SET = new Set(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]);

/** Known cities / regions → state (lowercase keys) */
const CITY_TO_STATE = {
  sydney: "NSW",
  newcastle: "NSW",
  wollongong: "NSW",
  wagga: "NSW",
  "wagga wagga": "NSW",
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
  subiaco: "WA",
  perth: "WA",
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
  alice: "NT",
  "alice springs": "NT",
  kalgoorlie: "WA",
  karratha: "WA",
  busselton: "WA",
  kimberley: "WA",
  "northern tasmania": "TAS",
};

/** Strings that appear as genres but are really places / noise — drop */
const GENRE_LOCATION_NOISE = new Set(
  [
    "gold coast",
    "brisbane",
    "sydney",
    "melbourne",
    "canberra",
    "cairns",
    "darwin",
    "hobart",
    "newcastle",
    "geelong",
    "launceston",
    "bendigo",
    "dubbo",
    "gosford",
    "goulburn",
    "adelaide",
    "perth",
    "ballarat",
    "toowoomba",
    "mackay",
    "kalgoorlie",
    "karratha",
    "longreach",
    "busselton",
    "illawarra",
    "braidwood",
    "rockhampton",
    "alice springs",
    "nsw",
    "vic",
    "qld",
    "sa",
    "wa",
    "tas",
    "nt",
    "act",
    "australia",
    "australian music",
  ].map((s) => s.toLowerCase())
);

function toTitleCaseWords(s) {
  if (!s || !String(s).trim()) return "";
  return String(s)
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Parse a single location line into { city, state }.
 * state is AU code or "".
 */
function parseLocationString(raw) {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  if (!s) return { city: "", state: "" };

  const lower = s.toLowerCase();

  if (FULL_STATE_TO_CODE[lower]) {
    return { city: "", state: FULL_STATE_TO_CODE[lower] };
  }

  if (CODE_SET.has(s.toUpperCase()) && s.length <= 3) {
    return { city: "", state: s.toUpperCase() };
  }

  const codeMatch = s.match(/^(.+?)\s+(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)$/i);
  if (codeMatch) {
    return {
      city: toTitleCaseWords(codeMatch[1]),
      state: codeMatch[2].toUpperCase(),
    };
  }

  for (const [full, code] of Object.entries(FULL_STATE_TO_CODE)) {
    if (lower === full) return { city: "", state: code };
    const prefix = `${full} `;
    if (lower.startsWith(prefix)) {
      const rest = s.slice(full.length).trim();
      return { city: toTitleCaseWords(rest), state: code };
    }
  }

  if (CITY_TO_STATE[lower]) {
    return { city: toTitleCaseWords(s), state: CITY_TO_STATE[lower] };
  }

  if (lower === "australia wide" || lower === "national") {
    return { city: "Australia wide", state: "" };
  }

  return { city: toTitleCaseWords(s), state: "" };
}

function normalizeLocation(cityRaw, stateRaw) {
  let a = String(cityRaw ?? "").trim().replace(/\s+/g, " ");
  let b = String(stateRaw ?? "").trim().replace(/\s+/g, " ");

  if (!a && !b) return { city: "", state: "" };

  if (a && b && a.toLowerCase() === b.toLowerCase()) {
    return parseLocationString(a);
  }

  const pa = a ? parseLocationString(a) : { city: "", state: "" };
  const pb = b ? parseLocationString(b) : { city: "", state: "" };

  let state = pa.state || pb.state;
  let city = pa.city || pb.city;

  if (!state && city) {
    const again = parseLocationString(city);
    if (again.state) {
      state = again.state;
      city = again.city || city;
    }
  }

  if (!city && !state && a) {
    const p = parseLocationString(a);
    city = p.city;
    state = p.state;
  }

  if (city.toLowerCase() === "australia wide") {
    return { city: "Australia wide", state: "" };
  }

  return { city: city || "", state: state || "" };
}

/** Exact lowercase genre → canonical lowercase (null = drop) */
const GENRE_EXACT = {
  communiy: "community radio",
  communnity: "community radio",
  cristian: "christian",
  "christian music": "christian",
  "christian contemporary": "christian",
  community: "community radio",
  "public radio": "community radio",
  "college radio": "community radio",
  "local radio": "community radio",
  "community news": "news and talk",
  "non-commercial": "community radio",
  "non profit": "community radio",
  "free fm": "community radio",
  "full service": "community radio",
  independent: "indie",
  diy: "community radio",

  news: "news and talk",
  talk: "news and talk",
  talkback: "news and talk",
  "news talk": "news and talk",
  newstalk: "news and talk",
  "current affairs": "news and talk",
  conservative: "news and talk",
  information: "news and talk",
  "local news": "news and talk",
  weather: "news and talk",
  interviews: "news and talk",
  newsradio: "news and talk",
  "community politics music radical": "community radio",
  "community politics music radical brisbane": "community radio",

  abc: "abc",
  "abc australia": "abc",

  miscellaneous: "music",
  variety: "music",
  mix: "music",
  mixed: "music",
  "non-stop music": "music",
  "non-stop mix": "music",
  "all music": "music",
  "best music": "music",
  "contemporary music": "music",
  entertainment: "music",
  charts: "pop",
  "chart hits": "pop",
  hits: "pop",
  "greatest hits": "pop",
  "golden oldies": "classic hits",
  "good times and greatest hits": "classic hits",
  anthems: "pop",
  gold: "classic hits",
  "happy hits": "pop",
  "latest hits": "pop",
  mainstream: "pop",
  "new music": "pop",
  "number 1s": "pop",
  "top 40": "pop",
  "adult top 40": "adult contemporary",
  "contemporary hits": "pop",
  "contemporary hits radio": "pop",
  "contemporary hit radio": "pop",
  chr: "pop",

  "00's": "2000s",
  "00s": "2000s",
  "10's": "2010s",
  "10s": "2010s",
  "50s": "1950s",
  "60's": "1960s",
  "60s": "1960s",
  "70's": "1970s",
  "70s": "1970s",
  "80's": "1980s",
  "80s": "1980s",
  "90's": "1990s",
  "90s": "1990s",
  "1980's": "1980s",
  "2000's": "2000s",
  "2010's": "2010s",

  "classic hits 60s 70a 80s": "classic hits",
  "classic rock  50's 60's 70's 80's 90's": "rock",
  "hits 70's": "1970s",
  "90's and more!": "1990s",

  rock: "rock",
  "classic rock": "rock",
  "soft rock": "rock",
  "alternative rock": "rock",
  "british rock": "rock",
  "blues rock": "rock",
  bluesrock: "rock",
  "hard rock": "rock",
  "mainstream rock": "rock",
  "modern rock": "rock",
  "active rock": "rock",
  "free fm rock": "rock",
  alternative: "rock",
  indie: "indie",
  "indie rock": "indie",
  "indie pop": "indie",
  "indie music": "indie",
  "indie dance": "electronic",

  "classic hits": "classic hits",
  classic: "classic hits",
  classics: "classic hits",
  oldies: "classic hits",
  "golden music": "classic hits",

  "adult contemporary": "adult contemporary",
  adult: "adult contemporary",
  "hot adult contemporary": "adult contemporary",
  contemporary: "adult contemporary",

  pop: "pop",
  "classic pop": "pop",

  country: "country",
  "country music": "country",

  dance: "electronic",
  "dance music": "electronic",
  "electronic dance music": "electronic",
  electronic: "electronic",
  electronica: "electronic",
  electro: "electronic",
  house: "electronic",
  trance: "electronic",
  chill: "electronic",
  chillout: "electronic",
  ambient: "electronic",
  club: "electronic",
  downtempo: "electronic",
  disco: "electronic",
  funk: "electronic",
  "drum & bass": "electronic",
  "drum and bass": "electronic",
  "drum 'n' bass": "electronic",
  "drum n bass": "electronic",
  dubstep: "electronic",
  "deep house": "electronic",
  "electro house": "electronic",
  "future house": "electronic",
  "hard house": "electronic",
  "hard trance": "electronic",
  "acid house": "electronic",
  "big room house": "electronic",
  "bass house": "electronic",
  "circuit house": "electronic",
  "club house": "electronic",
  "jack house": "electronic",
  "french house": "electronic",
  "italian house": "electronic",
  "latin house": "electronic",
  "lounge house": "electronic",
  "nu disco": "electronic",
  "hardstyle": "electronic",
  breakbeat: "electronic",
  dub: "electronic",
  jungle: "electronic",
  eurodance: "electronic",
  eurobeat: "electronic",
  freestyle: "electronic",
  "happy hardcore": "electronic",
  idm: "electronic",
  "acid jazz": "jazz",

  jazz: "jazz",
  "jazz music": "jazz",
  "chill jazz": "jazz",
  "classic jazz": "jazz",
  "light classics": "classical",
  blues: "blues",
  "classic blues": "blues",

  classical: "classical",
  "classical guitar": "classical",

  "easy listening": "easy listening",
  "love songs": "easy listening",
  crooners: "easy listening",

  "hip hop": "hip hop",
  "hip-hop": "hip hop",
  hiphop: "hip hop",
  "hip-hop and rap oldies": "hip hop",

  rnb: "r&b",
  "r&b": "r&b",

  folk: "folk",
  "greek folk music": "world music",

  "world music": "world music",
  ethnic: "world music",
  global: "world music",
  multicultural: "world music",
  multilingual: "world music",
  "african music": "world music",
  "asian music": "world music",
  "middle eastern music": "world music",
  "european music": "world music",
  "islands music": "world music",
  bollywood: "world music",
  "latin music": "world music",
  latino: "world music",
  "k-pop": "world music",
  kpop: "world music",
  "j-pop": "world music",
  jpop: "world music",
  "c-pop": "world music",
  cpop: "world music",
  "japanese music": "world music",
  "korean music": "world music",
  "chinese pop": "world music",
  "hong kong music": "world music",
  "italian pop": "world music",
  "cantonese": "world music",

  christian: "christian",
  gospel: "christian",
  "gospel music": "christian",
  church: "christian",
  faith: "christian",
  inspirational: "christian",
  "inspirational segments": "christian",

  indigenous: "indigenous",
  aboriginal: "indigenous",
  "aboriginal music": "indigenous",
  "indigenous music": "indigenous",
  "indigenous current affairs": "indigenous",
  "first nations": "indigenous",
  noongar: "indigenous",
  nyoongar: "indigenous",
  nyungar: "indigenous",

  sport: "sport",
  sports: "sport",
  "live sports": "sport",

  comedy: "comedy",
  arts: "arts",
  culture: "culture",
  education: "education",
  educational: "education",
  kids: "kids",
  "kids hits": "kids",
  children: "kids",

  metal: "metal",
  "heavy metal": "metal",
  "hair metal": "metal",
  grunge: "rock",
  "new wave": "rock",

  "christmas music": "seasonal",
  holiday: "seasonal",

  commercial: "commercial",
  "commercial-free": "commercial",
  local: "local programming",
  "local music": "local programming",
  "local programming": "local programming",

  eclectic: "eclectic",
  decades: "decades",
  features: "news and talk",
  history: "news and talk",
  heritage: "news and talk",

  "classic soul": "r&b",
  motown: "r&b",
  "northern soul": "r&b",

  reggae: "world music",
  ska: "world music",

  meditation: "wellness",
  mantra: "wellness",
  fitness: "wellness",
  "lofi study beats": "electronic",

  "lgbtiqa*": "lgbtq+",
  lgbt: "lgbtq+",
  lgbtq: "lgbtq+",

  islam: "faith and culture",
  islamic: "faith and culture",
  jewish: "faith and culture",
  buddhism: "faith and culture",

  "talk show": "news and talk",
  programming: "local programming",
};

/** Bare calendar years as tags — drop. Decades like1980s stay as separate keys in GENRE_EXACT / passthrough. */
const YEAR_ONLY = /^(19|20)\d{2}$/;

/** Loose patterns after exact map (string is already lowercased). */
const GENRE_PREFIX_RULES = [
  [/^community\s+radio\b/i, "community radio"],
  [/^public\s+radio\b/i, "community radio"],
];

function normalizeGenre(raw) {
  let g = String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!g) return null;

  if (GENRE_LOCATION_NOISE.has(g)) return null;
  if (GENRE_EXACT[g] !== undefined) {
    return GENRE_EXACT[g];
  }

  for (const [re, to] of GENRE_PREFIX_RULES) {
    if (re.test(g)) return to;
  }

  if (YEAR_ONLY.test(g)) return null;

  if (g.includes("community") && g.includes("radio")) return "community radio";

  return g;
}

function dedupeGenres(arr) {
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    if (!c || !String(c).trim()) continue;
    const key = String(c).trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(String(c).trim().toLowerCase());
  }
  return out;
}

function cleanStation(row, stats) {
  const loc = normalizeLocation(row.city, row.state);
  const genresIn = row.genres || [];
  let genresOut = dedupeGenres(
    genresIn.map(normalizeGenre).filter(Boolean)
  );
  if (!genresOut.length) {
    genresOut = ["music"];
    if (genresIn.length > 0 && stats) stats.genreFallback += 1;
  }

  return {
    ...row,
    city: loc.city,
    state: loc.state,
    genres: genresOut,
  };
}

function main() {
  const raw = JSON.parse(fs.readFileSync(ROOT_JSON, "utf8"));
  const stats = { genreFallback: 0 };
  const cleaned = raw.map((row) => cleanStation(row, stats));

  const out = JSON.stringify(cleaned, null, 2);
  fs.writeFileSync(ROOT_JSON, out, "utf8");
  fs.writeFileSync(PUBLIC_JSON, out, "utf8");

  const genres = {};
  for (const s of cleaned) {
    for (const g of s.genres) genres[g] = (genres[g] || 0) + 1;
  }

  process.stderr.write(`Wrote ${cleaned.length} stations\n`);
  process.stderr.write(`Unique genres: ${Object.keys(genres).length} (was ~661)\n`);
  process.stderr.write(
    `Stations whose tags were only noise → default "music": ${stats.genreFallback}\n`
  );
  process.stderr.write(`Top genres: ${Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([g, c]) => `${g}(${c})`)
    .join(", ")}\n`);
}

main();
