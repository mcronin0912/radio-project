#!/usr/bin/env node
/**
 * Fetches Australian Freeview / FAST TV channels from Matt Huisman's i.mjh.nz
 * and writes channels-from-api.json plus per-channel EPG snippets under public/epg/.
 *
 * Default source is the national `all` catalog (every state/territory lineup).
 * Override with MJH_REGION=Sydney (etc.) for a single metro.
 *
 * Sources (TV only — radio playlists are intentionally excluded):
 *   https://i.mjh.nz/au/{Region}/tv.json.gz
 *   https://i.mjh.nz/au/{Region}/epg.xml.gz
 *
 * Usage: node scripts/fetch-mjh-channels.js [output-path]
 * Env:   MJH_REGION=all (default)
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { URL } = require("url");

const EPG_BASE = "https://i.mjh.nz";
const USER_AGENT = "RadioProject-TV/1.0";
const REGION = process.env.MJH_REGION || "all";

/** Keep programmes from 2h ago through +36h */
const GUIDE_PAST_MS = 2 * 60 * 60 * 1000;
const GUIDE_FUTURE_MS = 36 * 60 * 60 * 1000;

const REGION_TO_STATE = {
  Sydney: "NSW",
  Melbourne: "VIC",
  Brisbane: "QLD",
  Adelaide: "SA",
  Perth: "WA",
  Hobart: "TAS",
  Canberra: "ACT",
  Darwin: "NT",
};

/** Suffixes used in mjh channel / epg ids */
const ID_SUFFIX_TO_STATE = {
  nsw: "NSW",
  syd: "NSW",
  vic: "VIC",
  mel: "VIC",
  qld: "QLD",
  bri: "QLD",
  sa: "SA",
  ade: "SA",
  wa: "WA",
  per: "WA",
  tas: "TAS",
  hob: "TAS",
  act: "ACT",
  nt: "NT",
};

const EPG_CATEGORY_MAP = {
  news: "news",
  sports: "sports",
  sport: "sports",
  "kids & family": "kids",
  kids: "kids",
  family: "kids",
  comedy: "comedy",
  drama: "drama",
  "action & adventure": "movies",
  movies: "movies",
  movie: "movies",
  film: "movies",
  "special interest": "factual",
  documentary: "factual",
  factual: "factual",
  lifestyle: "lifestyle",
  food: "lifestyle",
  cooking: "lifestyle",
  music: "music",
  shopping: "shopping",
  entertainment: "entertainment",
};

function normalizeProgrammeCategory(raw) {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  if (!key) return null;
  if (EPG_CATEGORY_MAP[key]) return EPG_CATEGORY_MAP[key];
  for (const [needle, cat] of Object.entries(EPG_CATEGORY_MAP)) {
    if (key.includes(needle)) return cat;
  }
  return null;
}

function inferCategoriesFromChannel(name, network) {
  const text = `${name} ${network || ""}`.toLowerCase();
  const found = new Set();

  if (
    /\bnews\b|euronews|\bcna\b|sky news|ticker|briefing|al jazeera|france 24|\bdw\b|bloomberg/.test(
      text
    )
  ) {
    found.add("news");
  }
  if (
    /\bsport|racing|thoroughbred|cricket|fifa|nrl|afl|rugby|wnbl|qrl|knockout|olymp/.test(
      text
    )
  ) {
    found.add("sports");
  }
  if (
    /\bkids\b|nick|nickelodeon|cartoon|abc kids|abc family|spongebob|preschool/.test(
      text
    )
  ) {
    found.add("kids");
  }
  if (/\bmovie|cinema|thriller movies|world movies|film/.test(text)) {
    found.add("movies");
  }
  if (/\bcomedy\b/.test(text)) found.add("comedy");
  if (/\bdrama\b|crime|mystery|paranormal/.test(text)) found.add("drama");
  if (
    /\bfood\b|cooking|lifestyle|home.?garden|garden|real estate|the block|married/.test(
      text
    )
  ) {
    found.add("lifestyle");
  }
  if (/\bmusic\b|\bmtv\b|folk klub/.test(text)) found.add("music");
  if (/\bshop|tvsn|expo channel/.test(text)) found.add("shopping");
  if (/\bweather\b/.test(text)) found.add("factual");

  if (
    /^(abc tv|seven|channel 9|10|sbs|nitv)(\s|$)/i.test(name.trim()) ||
    /\b(7two|7mate|7flix|9gem|9go|9life|9rush)\b/i.test(name)
  ) {
    found.add("general");
  }

  if (found.size === 0) found.add("entertainment");
  return [...found];
}

function resolveChannelCategories(name, network, programmes) {
  const votes = new Map();
  for (const p of programmes || []) {
    const cat = normalizeProgrammeCategory(p.category);
    if (!cat) continue;
    votes.set(cat, (votes.get(cat) || 0) + 1);
  }
  const fromEpg = [...votes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([c]) => c);
  const fromName = inferCategoriesFromChannel(name, network);
  const merged = [];
  for (const c of [...fromEpg, ...fromName]) {
    if (!merged.includes(c)) merged.push(c);
  }
  return merged.slice(0, 4);
}

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) {
      reject(new Error("Too many redirects: " + url));
      return;
    }
    const mod = url.startsWith("http://") ? http : https;
    const req = mod.get(
      url,
      { headers: { "User-Agent": USER_AGENT } },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const next = new URL(res.headers.location, url).href;
          fetchBuffer(next, redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
    req.setTimeout(180000, () => {
      req.destroy();
      reject(new Error("Timeout: " + url));
    });
  });
}

function fetchJsonGz(url) {
  return fetchBuffer(url).then((buf) =>
    JSON.parse(zlib.gunzipSync(buf).toString("utf8"))
  );
}

function slugify(str) {
  return (
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "channel"
  );
}

function uniqueSlug(base, existing) {
  let slug = base;
  let n = 0;
  while (existing.has(slug)) {
    n++;
    slug = `${base}-${n}`;
  }
  existing.add(slug);
  return slug;
}

function decodeXml(text) {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

/** XMLTV start="20260916230000 +0000" → Date */
function parseXmltvTime(raw) {
  const m = String(raw).match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/
  );
  if (!m) return null;
  const [, y, mo, d, h, mi, s, tz] = m;
  let offset = "+00:00";
  if (tz) {
    offset = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  }
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tagText(body, tag) {
  const m = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeXml(m[1].trim()) : null;
}

/** Infer AU state from mjh id / epg id suffixes (nsw, syd, vic, …). */
function stateFromChannelId(id) {
  const lower = String(id || "").toLowerCase();
  const m = lower.match(
    /(?:^|-)(?:\d+)?(nsw|vic|qld|sa|wa|tas|act|nt|syd|mel|bri|ade|per|hob)$/
  );
  if (m) return ID_SUFFIX_TO_STATE[m[1]] || null;
  return null;
}

/**
 * Lightweight guide from tv.json `programs` [[unixSec, title], ...]
 * when XMLTV has no rows for a channel.
 */
function programmesFromTvJson(programs, now = new Date()) {
  if (!Array.isArray(programs) || programs.length < 2) return [];
  const windowStart = now.getTime() - GUIDE_PAST_MS;
  const windowEnd = now.getTime() + GUIDE_FUTURE_MS;
  const sorted = programs
    .filter((p) => Array.isArray(p) && typeof p[0] === "number" && p[1])
    .map((p) => ({ startSec: p[0], title: String(p[1]) }))
    .sort((a, b) => a.startSec - b.startSec);

  const out = [];
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

/**
 * Single-pass XMLTV parse → Map<epgId, programmes[]>
 * Much faster than per-channel regex on the national EPG.
 */
function parseAllProgrammes(xml, now = new Date()) {
  const windowStart = now.getTime() - GUIDE_PAST_MS;
  const windowEnd = now.getTime() + GUIDE_FUTURE_MS;
  /** @type {Map<string, object[]>} */
  const byChannel = new Map();

  const re =
    /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const start = parseXmltvTime(m[1]);
    const stop = parseXmltvTime(m[2]);
    if (!start || !stop) continue;
    if (stop.getTime() < windowStart || start.getTime() > windowEnd) continue;
    const epgId = m[3];
    const body = m[4];
    const programme = {
      start: start.toISOString(),
      stop: stop.toISOString(),
      title: tagText(body, "title") || "Untitled",
      subtitle: tagText(body, "sub-title"),
      description: tagText(body, "desc"),
      category: tagText(body, "category"),
    };
    if (!byChannel.has(epgId)) byChannel.set(epgId, []);
    byChannel.get(epgId).push(programme);
  }

  for (const list of byChannel.values()) {
    list.sort((a, b) => a.start.localeCompare(b.start));
  }
  return byChannel;
}

function buildChannels(tvJson) {
  const fallbackState = REGION_TO_STATE[REGION] || null;
  const slugSet = new Set();
  const rows = [];

  // First pass: count duplicate display names so we can disambiguate regionals.
  const nameCounts = new Map();
  for (const entry of Object.values(tvJson)) {
    const n = (entry?.name || "").trim();
    if (!n) continue;
    nameCounts.set(n, (nameCounts.get(n) || 0) + 1);
  }

  for (const [id, entry] of Object.entries(tvJson)) {
    const streamUrl = entry?.mjh_master;
    if (!streamUrl || typeof streamUrl !== "string") continue;
    if (!/\.m3u8(\?|$)/i.test(streamUrl)) continue;

    const baseName = (entry.name || id).trim();
    // TV playlist occasionally includes SBS audio streams — keep radio out of TV.
    if (
      /^SBS Radio\b/i.test(baseName) ||
      /^SBS (Chill|Arabic|PopAsia|South Asian)\b/i.test(baseName)
    ) {
      continue;
    }

    const epgId = entry.epg_id || id;
    const network = entry.network || null;
    const chno = entry.chno != null ? String(entry.chno) : null;
    const state =
      stateFromChannelId(epgId) ||
      stateFromChannelId(id) ||
      fallbackState;

    let name = baseName;
    if (
      state &&
      (nameCounts.get(baseName) || 0) > 1 &&
      !new RegExp(`\\b${state}\\b`, "i").test(baseName)
    ) {
      name = `${baseName} ${state}`;
    }

    const slugBase = slugify(String(epgId).replace(/^mjh-/, ""));

    rows.push({
      slug: uniqueSlug(slugBase, slugSet),
      channelId: epgId,
      name,
      network,
      categories: [],
      website: null,
      logoUrl: entry.logo || null,
      streamUrl,
      streamQuality: null,
      state,
      feed: chno,
      label: chno ? `Ch ${chno}` : null,
      hasGuide: false,
      /** internal: used while writing guides, stripped before write */
      _programs: entry.programs || null,
      _epgId: epgId,
    });
  }

  rows.sort((a, b) => {
    const aNo = a.feed ? Number(a.feed) : NaN;
    const bNo = b.feed ? Number(b.feed) : NaN;
    if (!Number.isNaN(aNo) && !Number.isNaN(bNo) && aNo !== bNo) {
      return aNo - bNo;
    }
    if (!Number.isNaN(aNo) && Number.isNaN(bNo)) return -1;
    if (Number.isNaN(aNo) && !Number.isNaN(bNo)) return 1;
    return (
      (a.network || "").localeCompare(b.network || "") ||
      (a.state || "").localeCompare(b.state || "") ||
      a.name.localeCompare(b.name)
    );
  });

  return rows;
}

async function fetchAndWriteGuides(rows, epgDir) {
  const epgUrl = `${EPG_BASE}/au/${REGION}/epg.xml.gz`;
  console.log(`  Downloading EPG ${REGION}…`);
  /** @type {Map<string, object[]>} */
  let byChannel = new Map();
  try {
    const buf = await fetchBuffer(epgUrl);
    const xml = zlib.gunzipSync(buf).toString("utf8");
    console.log(
      `    ${(buf.length / 1024).toFixed(0)} KB gzip → ${xml.length} chars`
    );
    console.log("  Parsing programme guide…");
    const now = new Date();
    byChannel = parseAllProgrammes(xml, now);
    console.log(`    ${byChannel.size} channels with XMLTV rows`);
  } catch (e) {
    console.warn(`    Failed ${REGION} XMLTV:`, e.message);
  }

  fs.mkdirSync(epgDir, { recursive: true });
  for (const f of fs.readdirSync(epgDir)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(epgDir, f));
  }

  const now = new Date();
  let written = 0;
  for (const row of rows) {
    let programmes = byChannel.get(row._epgId) || [];
    if (!programmes.length) {
      programmes = programmesFromTvJson(row._programs, now);
    }

    row.categories = resolveChannelCategories(
      row.name,
      row.network,
      programmes
    );

    if (!programmes.length) continue;

    fs.writeFileSync(
      path.join(epgDir, `${row.slug}.json`),
      JSON.stringify(
        {
          slug: row.slug,
          epgId: row._epgId,
          region: REGION,
          updatedAt: now.toISOString(),
          programmes,
        },
        null,
        2
      ) + "\n"
    );
    row.hasGuide = true;
    written++;
  }

  // Channels with no guide still get name-based categories
  for (const row of rows) {
    if (!row.categories?.length) {
      row.categories = resolveChannelCategories(
        row.name,
        row.network,
        []
      );
    }
  }
  return written;
}

function publicRow(row) {
  const { _programs, _epgId, ...rest } = row;
  return rest;
}

async function main() {
  const outArg = process.argv[2];
  const root = path.join(__dirname, "..");
  const outPath = path.resolve(root, outArg || "channels-from-api.json");
  const publicPath = path.join(root, "public", "channels-from-api.json");
  const epgDir = path.join(root, "public", "epg");

  const tvUrl = `${EPG_BASE}/au/${REGION}/tv.json.gz`;
  console.log(`Fetching i.mjh.nz AU TV (${REGION})…`);
  console.log(`  ${tvUrl}`);
  const tvJson = await fetchJsonGz(tvUrl);

  const rows = buildChannels(tvJson);
  const byState = {};
  for (const r of rows) {
    const k = r.state || "national";
    byState[k] = (byState[k] || 0) + 1;
  }
  console.log(`Built ${rows.length} TV channels (radio excluded)`);
  console.log("  By state:", byState);
  console.log("Fetching programme guides…");
  const guideCount = await fetchAndWriteGuides(rows, epgDir);

  const payload = rows.map(publicRow);
  const json = JSON.stringify(payload, null, 2) + "\n";
  fs.writeFileSync(outPath, json);
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, json);

  console.log(`Wrote ${payload.length} channels → ${outPath}`);
  console.log(`Also wrote → ${publicPath}`);
  console.log(`Wrote ${guideCount} channel guides → ${epgDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
