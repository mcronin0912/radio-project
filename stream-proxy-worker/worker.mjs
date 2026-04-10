/**
 * HTTPS relay for icecast/shoutcast streams (mirrors app/api/stream/route.ts).
 * Deploy: cd stream-proxy-worker && npx wrangler deploy
 * Then set GitHub repo variable RADIO_STREAM_PROXY_URL to your worker URL (no trailing slash).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const streamUrl = url.searchParams.get("url");
    if (!streamUrl) {
      return new Response("Missing url param", { status: 400, headers: corsHeaders });
    }

    try {
      const upstream = await fetch(streamUrl, {
        headers: { "Icy-MetaData": "0" },
      });

      if (!upstream.ok || !upstream.body) {
        return new Response("Upstream error", {
          status: upstream.status,
          headers: corsHeaders,
        });
      }

      const headers = new Headers(corsHeaders);
      headers.set(
        "Content-Type",
        upstream.headers.get("Content-Type") ?? "audio/mpeg"
      );
      headers.set("Cache-Control", "no-cache");

      return new Response(upstream.body, { headers });
    } catch {
      return new Response("Failed to fetch stream", { status: 502, headers: corsHeaders });
    }
  },
};
