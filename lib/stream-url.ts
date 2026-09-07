/**
 * Helpers for choosing how to load a station stream in the browser / Electron.
 */

export function isHlsUrl(streamUrl: string): boolean {
  try {
    const u = new URL(streamUrl);
    return /\.m3u8$/i.test(u.pathname) || /\/hls\//i.test(u.pathname);
  } catch {
    return /\.m3u8(\?|$)/i.test(streamUrl);
  }
}

/**
 * URL passed to <audio> / hls.js:
 * - HLS must NOT go through the naive byte proxy (relative segments break).
 * - HTTP progressive streams use same-origin `/api/stream` (or external proxy).
 * - HTTPS progressive can use the proxy too (CORS / Safari analyser).
 */
export function streamPlaybackUrl(streamUrl: string): string {
  if (isHlsUrl(streamUrl)) {
    if (streamUrl.startsWith("http://")) {
      return `https://${streamUrl.slice("http://".length)}`;
    }
    return streamUrl;
  }

  const encoded = encodeURIComponent(streamUrl);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const external = process.env.NEXT_PUBLIC_STREAM_PROXY_URL?.trim().replace(/\/$/, "");
  if (external) {
    return `${external}?url=${encoded}`;
  }
  if (basePath) {
    return streamUrl;
  }
  return `/api/stream?url=${encoded}`;
}
