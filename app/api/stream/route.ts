import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("Missing url param", { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "Icy-MetaData": "0" },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: upstream.status });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new Response("Failed to fetch stream", { status: 502 });
  }
}
