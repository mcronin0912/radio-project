/**
 * Local HTTP server for the Electron app:
 * - Serves the static Next export from `out/`
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

function sendFile(res, filePath) {
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": contentType(filePath) });
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

/**
 * @param {{ staticRoot: string, port?: number }} opts
 * @returns {Promise<{ server: import('http').Server, port: number, origin: string }>}
 */
function startLocalServer({ staticRoot, port = 0 }) {
  const root = path.resolve(staticRoot);

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

    let filePath = safeJoin(root, requestUrl.pathname);
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (requestUrl.pathname.endsWith("/")) {
      filePath = path.join(filePath, "index.html");
    } else if (
      !path.extname(filePath) &&
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isDirectory()
    ) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
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

    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end();
      return;
    }
    sendFile(res, filePath);
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
