#!/usr/bin/env node
/**
 * Fetches Australian radio stations from Radio Browser API
 * (https://api.radio-browser.info) and outputs a JSON file compatible
 * with the Community Radio Hub stations format.
 *
 * Usage: node scripts/fetch-radio-browser-stations.js [output-path]
 * Default output: stations-from-api.json
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://de1.api.radio-browser.info";
const USER_AGENT = "CommunityRadioHub/1.0";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": USER_AGENT } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Invalid JSON: " + data.slice(0, 200)));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "station";
}

function uniqueSlug(name, existing) {
  let base = slugify(name);
  let slug = base;
  let n = 0;
  while (existing.has(slug)) {
    n++;
    slug = `${base}-${n}`;
  }
  existing.add(slug);
  return slug;
}

/** Extract callsign from name (e.g. "3RRR", "2SER 107.3", "B105 105.3") */
function extractCallsign(name) {
  const clean = name.replace(/^[=\s]+|[=\s]+$/g, "").trim();
  const m = clean.match(/^([0-9][A-Z]{2,4}|[A-Z]{2,5})[\s.]/i) || clean.match(/^([0-9][A-Z]{2,4}|[A-Z]{2,5})$/i);
  if (m && m[1]) return m[1].toUpperCase();
  const words = clean.split(/\s+/);
  const first = words[0] && words[0].replace(/[^0-9A-Za-z]/g, "");
  if (first && /^[0-9A-Z]{2,6}$/i.test(first)) return first.toUpperCase();
  return clean.slice(0, 20) || "Radio";
}

function transform(apiStation, slugSet) {
  const name = (apiStation.name || "").trim() || "Unknown";
  const slug = uniqueSlug(name, slugSet);
  const streamUrl = apiStation.url_resolved || apiStation.url || null;
  const tags = (apiStation.tags || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return {
    slug,
    callsign: extractCallsign(name),
    name,
    frequency: null,
    city: apiStation.state || "",
    state: apiStation.iso_3166_2 || apiStation.state || "",
    description: null,
    website: apiStation.homepage || null,
    streamUrl,
    streamFormat: apiStation.codec || null,
    streamBitrate: apiStation.bitrate || null,
    metadataTier: 0,
    metadataUrl: null,
    logoUrl: apiStation.favicon || null,
    genres: tags,
    indigenous: tags.some((t) => /indigenous|aboriginal|first\s*nations/i.test(t)),
  };
}

async function fetchAllAustralianStations() {
  const all = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const url = `${API_BASE}/json/stations/search?countrycode=AU&limit=${limit}&offset=${offset}`;
    const batch = await fetchJson(url);
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
    process.stderr.write(`  Fetched ${all.length} stations...\n`);
  }

  return all;
}

async function main() {
  const outPath = process.argv[2] || path.join(__dirname, "..", "stations-from-api.json");

  process.stderr.write("Fetching Australian stations from Radio Browser API...\n");

  const raw = await fetchAllAustralianStations();
  process.stderr.write(`Total: ${raw.length} stations\n`);

  const working = raw.filter((s) => s.lastcheckok === 1);
  process.stderr.write(`Working streams (lastcheckok=1): ${working.length}\n`);

  // Dedupe: same station often has multiple entries (MP3, AAC, etc). Keep one per base name, prefer higher bitrate.
  const byBaseName = new Map();
  for (const s of working) {
    const base = (s.name || "").trim().replace(/\s*\((?:mp3|aac\+?|m4a|ogg)\)\s*$/i, "").trim().toLowerCase();
    const key = base || s.stationuuid || s.changeuuid;
    const existing = byBaseName.get(key);
    if (!existing || (s.bitrate || 0) > (existing.bitrate || 0)) {
      byBaseName.set(key, s);
    }
  }
  const deduped = Array.from(byBaseName.values());
  process.stderr.write(`After deduplication: ${deduped.length}\n`);

  const slugSet = new Set();
  const stations = deduped.map((s) => transform(s, slugSet));

  fs.writeFileSync(outPath, JSON.stringify(stations, null, 2), "utf8");
  process.stderr.write(`Wrote ${stations.length} stations to ${outPath}\n`);

  const publicPath = path.join(__dirname, "..", "public", "stations-from-api.json");
  if (outPath !== publicPath) {
    fs.copyFileSync(outPath, publicPath);
    process.stderr.write(`Copied to ${publicPath} (for static export)\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
