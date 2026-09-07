/**
 * Replace dead/blocked stream URLs with working alternatives.
 * - ABC Mediahub (403) → Akamai / abc-cdn HLS masters
 * - Variant-only HLS (v0-*.m3u8) → sibling index/master playlist
 * - Confirmed-dead upstreams → clear streamUrl
 *
 * Writes stations-from-api.json + public/stations-from-api.json
 * Run: node scripts/fix-stream-urls.js
 */

const fs = require("fs");
const path = require("path");

const ROOT_JSON = path.join(__dirname, "..", "stations-from-api.json");
const PUBLIC_JSON = path.join(__dirname, "..", "public", "stations-from-api.json");

/** Mediahub path code → working HTTPS HLS master */
const MEDIAHUB_TO_HLS = {
  DJDW: "https://streaming.abc-cdn.net.au/audio/hls/doublejnsw.m3u8",
  "2TJW": "https://streaming.abc-cdn.net.au/audio/hls/triplejnsw.m3u8",
  "4TJW": "https://mediaserviceslive.akamaized.net/hls/live/2038347/triplejqld/masterhq.m3u8",
  "5TJW": "https://mediaserviceslive.akamaized.net/hls/live/2038346/triplejsa/masterhq.m3u8",
  "6TJW": "https://mediaserviceslive.akamaized.net/hls/live/2038345/triplejwa/masterhq.m3u8",
  "2FMW": "https://mediaserviceslive.akamaized.net/hls/live/2038316/classicfmnsw/masterhq.m3u8",
  "4FMW": "https://mediaserviceslive.akamaized.net/hls/live/2038352/classicfmqld/masterhq.m3u8",
  "6FMW": "https://mediaserviceslive.akamaized.net/hls/live/2038349/classicfmwa/masterhq.m3u8",
  FM2W: "https://mediaserviceslive.akamaized.net/hls/live/2038317/classic2/masterhq.m3u8",
  JAZW: "https://mediaserviceslive.akamaized.net/hls/live/2038319/abcjazz/masterhq.m3u8",
  CTRW: "https://mediaserviceslive.akamaized.net/hls/live/2038322/abccountry/masterhq.m3u8",
  GSDW: "https://streaming.abc-cdn.net.au/audio/hls/grandstand.m3u8",
  "2RNW": "https://mediaserviceslive.akamaized.net/hls/live/2038318/rnnsw/masterhq.m3u8",
  "3RNW": "https://mediaserviceslive.akamaized.net/hls/live/2038332/rnvic/masterhq.m3u8",
  "6RNW": "https://mediaserviceslive.akamaized.net/hls/live/2038354/rnwa/masterhq.m3u8",
  UNEW: "https://mediaserviceslive.akamaized.net/hls/live/2038321/unearthed/masterhq.m3u8",
  XTDW: "https://mediaserviceslive.akamaized.net/hls/live/2038324/abcextra/masterhq.m3u8",
  "1LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038303/localcanberra/masterhq.m3u8",
  "2LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038302/localsydney/masterhq.m3u8",
  "3LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038300/localmelbourne/masterhq.m3u8",
  "4LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038304/localbrisbane/masterhq.m3u8",
  "5LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038298/localadelaide/masterhq.m3u8",
  "6LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038301/localperth/masterhq.m3u8",
  "7LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038305/localhobart/masterhq.m3u8",
  "8LRW": "https://mediaserviceslive.akamaized.net/hls/live/2038307/localdarwin/masterhq.m3u8",
  "2NEWW": "https://mediaserviceslive.akamaized.net/hls/live/2038259/localnewcastle/masterhq.m3u8",
  "4LONW": "https://mediaserviceslive.akamaized.net/hls/live/2038331/locallongreach/masterhq.m3u8",
  IT2W: "https://streaming.abc-cdn.net.au/audio/hls/itinerantone.m3u8",
  "2DUBW": "https://mediaserviceslive.akamaized.net/hls/live/2038261/localwesternplains/masterhq.m3u8",
  "2TAMW": "https://streaming.abc-cdn.net.au/audio/hls/localnewengland.m3u8",
  "2WOLW": "https://mediaserviceslive.akamaized.net/hls/live/2038256/localillawarra/masterhq.m3u8",
  "3SALE": "https://mediaserviceslive.akamaized.net/hls/live/2038264/localgippsland/masterhq.m3u8",
  "3WOD": "https://mediaserviceslive.akamaized.net/hls/live/2038265/localgoulburnmurray/masterhq.m3u8",
  "4CRNW": "https://mediaserviceslive.akamaized.net/hls/live/2038157-b/localnorthqld/masterhq.m3u8",
  "4GLDW": "https://mediaserviceslive.akamaized.net/hls/live/2038336/localgoldcoast/masterhq.m3u8",
  "4SUNW": "https://mediaserviceslive.akamaized.net/hls/live/2038335/localsunshinecoast/masterhq.m3u8",
  "4TOOW": "https://streaming.abc-cdn.net.au/audio/hls/localtoowoomba.m3u8",
  "5PIRW": "https://streaming.abc-cdn.net.au/audio/hls/localnorthandwest.m3u8",
  "6BRMW": "https://mediaserviceslive.akamaized.net/hls/live/2038308/localkimberley/masterhq.m3u8",
  "6BUNW": "https://mediaserviceslive.akamaized.net/hls/live/2038338/localbunbury/masterhq.m3u8",
  "6KARW": "https://mediaserviceslive.akamaized.net/hls/live/2038309/localnorthwestwa/masterhq.m3u8",
  "6KLGW": "https://mediaserviceslive.akamaized.net/hls/live/2038310/localgoldfields/masterhq.m3u8",
  "7LAUW": "https://mediaserviceslive.akamaized.net/hls/live/2038306/localnorthtas/masterhq.m3u8",
  "8ALIW": "https://mediaserviceslive.akamaized.net/hls/live/2038312/localalicesprings/masterhq.m3u8",
};

/** Slugs whose upstream is confirmed unreachable — disable play */
const CLEAR_STREAM_SLUGS = new Set(["massive-anthems"]);

function mediahubCode(url) {
  const m = String(url).match(/mediahubaustralia\.com\/([A-Z0-9]+)\/(?:mp3|aac)/i);
  return m ? m[1].toUpperCase() : null;
}

function fixVariantPlaylist(url) {
  const u = String(url);
  if (!/\/v0-\d+\.m3u8(\?|$)/i.test(u)) return null;
  // Prefer index.m3u8 sibling (works for Double J / Grandstand style packs)
  return u.replace(/\/v0-\d+\.m3u8(\?.*)?$/i, "/index.m3u8$1");
}

function main() {
  const stations = JSON.parse(fs.readFileSync(ROOT_JSON, "utf8"));
  let mediahub = 0;
  let variants = 0;
  let cleared = 0;
  let untouchedMediahub = [];

  for (const s of stations) {
    const url = s.streamUrl;
    if (!url) continue;

    if (CLEAR_STREAM_SLUGS.has(s.slug)) {
      s.streamUrl = null;
      cleared++;
      continue;
    }

    const code = mediahubCode(url);
    if (code) {
      const mapped = MEDIAHUB_TO_HLS[code];
      if (mapped) {
        s.streamUrl = mapped;
        s.streamFormat = "AAC";
        mediahub++;
      } else {
        untouchedMediahub.push(`${s.name} (${code})`);
      }
      continue;
    }

    const fixedVariant = fixVariantPlaylist(url);
    if (fixedVariant && fixedVariant !== url) {
      s.streamUrl = fixedVariant;
      variants++;
    }
  }

  const json = JSON.stringify(stations, null, 2) + "\n";
  fs.writeFileSync(ROOT_JSON, json);
  fs.writeFileSync(PUBLIC_JSON, json);

  console.log(`Fixed Mediahub→HLS: ${mediahub}`);
  console.log(`Fixed variant playlists: ${variants}`);
  console.log(`Cleared dead streams: ${cleared}`);
  if (untouchedMediahub.length) {
    console.log(`Unmapped Mediahub (${untouchedMediahub.length}):`);
    for (const line of untouchedMediahub) console.log("  ", line);
  }
}

main();
