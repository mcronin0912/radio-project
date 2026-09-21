/**
 * Background EPG refresh for the Electron app.
 * Packaged guide JSON goes stale within ~1–2 days; this re-fetches
 * i.mjh.nz and writes fresh snippets under userData/epg/.
 */
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { URL } = require("url");

const EPG_URL = "https://i.mjh.nz/au/all/epg.xml.gz";
const TV_JSON_URL = "https://i.mjh.nz/au/all/tv.json.gz";
const GUIDE_PAST_MS = 2 * 60 * 60 * 1000;
const GUIDE_FUTURE_MS = 36 * 60 * 60 * 1000;
const USER_AGENT = "RadioProject-TV/1.0";

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

function decodeXml(text) {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function parseXmltvTime(raw) {
  const m = String(raw).match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/
  );
  if (!m) return null;
  const [, y, mo, d, h, mi, s, tz] = m;
  let offset = "+00:00";
  if (tz) offset = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tagText(body, tag) {
  const m = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeXml(m[1].trim()) : null;
}

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
 * @param {{
 *   channelsPath: string,
 *   outDir: string,
 * }} opts
 * @returns {Promise<{ written: number }>}
 */
async function refreshEpgGuides({ channelsPath, outDir }) {
  const channels = JSON.parse(fs.readFileSync(channelsPath, "utf8"));
  if (!Array.isArray(channels)) {
    throw new Error("channels-from-api.json is not an array");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const now = new Date();

  /** @type {Map<string, object[]>} */
  let byEpgId = new Map();
  /** @type {Record<string, any> | null} */
  let tvJson = null;

  try {
    console.log("[epg-refresh] Downloading XMLTV…");
    const buf = await fetchBuffer(EPG_URL);
    const xml = zlib.gunzipSync(buf).toString("utf8");
    byEpgId = parseAllProgrammes(xml, now);
    console.log(`[epg-refresh] XMLTV channels with rows: ${byEpgId.size}`);
  } catch (err) {
    console.warn("[epg-refresh] XMLTV failed, trying tv.json…", err.message);
  }

  if (byEpgId.size === 0) {
    const buf = await fetchBuffer(TV_JSON_URL);
    tvJson = JSON.parse(zlib.gunzipSync(buf).toString("utf8"));
  }

  let written = 0;
  for (const channel of channels) {
    const slug = channel.slug;
    const epgId = channel.channelId;
    if (!slug || !epgId) continue;

    let programmes = byEpgId.get(epgId) || [];
    if (!programmes.length && tvJson) {
      const entry = tvJson[epgId] || tvJson[`mjh-${epgId}`];
      programmes = programmesFromTvJson(entry?.programs, now);
    }
    if (!programmes.length) continue;

    fs.writeFileSync(
      path.join(outDir, `${slug}.json`),
      JSON.stringify(
        {
          slug,
          epgId,
          region: "all",
          updatedAt: now.toISOString(),
          programmes,
        },
        null,
        2
      ) + "\n"
    );
    written++;
  }

  console.log(`[epg-refresh] Wrote ${written} guides → ${outDir}`);
  return { written };
}

module.exports = { refreshEpgGuides };
