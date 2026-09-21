/**
 * Local HTTP server for the Electron app:
 * - Serves the static Next export from `out/`
 * - Overlays fresh EPG JSON from userData/epg/ when present
 * - Proxies `/api/stream?url=` (mirrors app/api/stream/route.ts)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".webp": "image/webp",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

async function handleStreamProxy(req, res, requestUrl) {
  const target = requestUrl.searchParams.get("url");
  if (!target) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing url param");
    return;
  }

  try {
    const upstream = await fetch(target, {
      headers: { "Icy-MetaData": "0" },
    });

    if (!upstream.ok || !upstream.body) {
      res.writeHead(upstream.status || 502, { "Content-Type": "text/plain" });
      res.end("Upstream error");
      return;
    }

    res.writeHead(200, {
      "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "no-cache",
    });

    const nodeStream = Readable.fromWeb(upstream.body);
    req.on("close", () => {
      nodeStream.destroy();
    });
    await pipeline(nodeStream, res);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Failed to fetch stream");
    } else {
      res.destroy(err);
    }
  }
}

function safeJoin(root, urlPathname) {
  const decoded = decodeURIComponent(urlPathname.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

function sendFile(res, filePath, extraHeaders = {}) {
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, {
    "Content-Type": contentType(filePath),
    ...extraHeaders,
  });
  stream.pipe(res);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Read error");
    } else {
      res.destroy();
    }
  });
}

function resolveStaticFile(roots, urlPathname) {
  for (const root of roots) {
    if (!root) continue;
    let filePath = safeJoin(root, urlPathname);
    if (!filePath) continue;

    if (urlPathname.endsWith("/")) {
      filePath = path.join(filePath, "index.html");
    } else if (
      !path.extname(filePath) &&
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isDirectory()
    ) {
      filePath = path.join(filePath, "index.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }
  return null;
}

/**
 * @param {{
 *   staticRoot: string,
 *   epgOverlayRoot?: string | null,
 *   port?: number,
 * }} opts
 * @returns {Promise<{ server: import('http').Server, port: number, origin: string }>}
 */
function startLocalServer({ staticRoot, epgOverlayRoot = null, port = 0 }) {
  const root = path.resolve(staticRoot);
  const overlay = epgOverlayRoot ? path.resolve(epgOverlayRoot) : null;

  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", "http://127.0.0.1");

    if (requestUrl.pathname === "/api/stream") {
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      await handleStreamProxy(req, res, requestUrl);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }

    const isEpg = requestUrl.pathname.startsWith("/epg/");
    const roots = isEpg && overlay ? [overlay, root] : [root];
    const filePath = resolveStaticFile(roots, requestUrl.pathname);

    if (!filePath) {
      // Never SPA-fallback JSON/API-like assets — that breaks guide fetches.
      if (
        path.extname(requestUrl.pathname) ||
        requestUrl.pathname.startsWith("/epg/") ||
        requestUrl.pathname.startsWith("/api/")
      ) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      const fallback = path.join(root, "index.html");
      if (fs.existsSync(fallback)) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        sendFile(res, fallback);
        return;
      }
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const extraHeaders = isEpg
      ? { "Cache-Control": "no-store" }
      : {};

    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": contentType(filePath),
        ...extraHeaders,
      });
      res.end();
      return;
    }
    sendFile(res, filePath, extraHeaders);
  });

  return new Promise((resolve, reject) => {
    const finish = () => {
      const address = server.address();
      const bound =
        typeof address === "object" && address ? address.port : port;
      resolve({
        server,
        port: bound,
        origin: `http://127.0.0.1:${bound}`,
      });
    };

    server.once("error", (err) => {
      if (err && err.code === "EADDRINUSE" && port !== 0) {
        server.once("listening", finish);
        server.once("error", reject);
        server.listen(0, "127.0.0.1");
        return;
      }
      reject(err);
    });
    server.once("listening", finish);
    server.listen(port, "127.0.0.1");
  });
}

module.exports = { startLocalServer };
