#!/usr/bin/env node
/*
 * Локальный стенд GitHub Pages: отдаёт статичную сборку out/ под префиксом /portfolio-elena,
 * как её отдаёт Pages. Только чтение файлов внутри out/; всё вне префикса и неизвестное получает 404.
 *   PORT=3100 BASE_PATH=/portfolio-elena EXPORT_DIR=out node scripts/serve-export.mjs
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const port = Number(process.env.PORT ?? 3100);
const host = process.env.HOST ?? "127.0.0.1";
const basePath = (process.env.BASE_PATH ?? "/portfolio-elena").replace(/\/+$/, "");
const root = path.resolve(process.env.EXPORT_DIR ?? "out");

const types = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".map": "application/json; charset=utf-8",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`serve-export: нет статичной сборки в ${root}. Сначала NEXT_PUBLIC_BASE_PATH=${basePath} npm run build.`);
  process.exit(1);
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function send(response, status, file, method) {
  const body = fs.readFileSync(file);
  response.writeHead(status, {
    "Content-Type": types[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": body.length,
    "X-Content-Type-Options": "nosniff",
  });
  response.end(method === "HEAD" ? undefined : body);
}

function notFound(response, method) {
  const page = path.join(root, "404.html");
  if (isFile(page)) return send(response, 404, page, method);
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(method === "HEAD" ? undefined : "404");
}

function reject(response, status) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(String(status));
}

/** Переводит путь запроса в файл внутри out/ или null. Ни один путь не выходит за пределы root. */
function resolveRequest(rawPath) {
  const pathname = rawPath.split("?")[0].split("#")[0];
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return { status: 404 };
  let decoded;
  try {
    decoded = decodeURIComponent(pathname.slice(basePath.length));
  } catch {
    return { status: 400 };
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return { status: 400 };
  const segments = decoded.split("/");
  if (segments.some((segment) => segment === ".." || segment === ".")) return { status: 400 };
  const target = path.resolve(root, `.${decoded}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return { status: 400 };
  return { target, trailing: decoded === "" || decoded.endsWith("/") };
}

const server = http.createServer((request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") return reject(response, 405);
  const resolved = resolveRequest(request.url ?? "/");
  if (resolved.status === 400) return reject(response, 400);
  if (resolved.status === 404) return notFound(response, method);
  const { target, trailing } = resolved;

  if (isDirectory(target)) {
    // Как Pages: каталог без косой черты перенаправляется на адрес с ней.
    if (!trailing) {
      const query = (request.url ?? "").includes("?") ? (request.url ?? "").slice((request.url ?? "").indexOf("?")) : "";
      response.writeHead(301, { Location: `${(request.url ?? "").split("?")[0]}/${query}` });
      return response.end();
    }
    const index = path.join(target, "index.html");
    return isFile(index) ? send(response, 200, index, method) : notFound(response, method);
  }
  if (isFile(target)) return send(response, 200, target, method);
  if (!trailing && isFile(`${target}.html`)) return send(response, 200, `${target}.html`, method);
  return notFound(response, method);
});

server.listen(port, host, () => {
  console.log(`serve-export: http://${host}:${port}${basePath}/ -> ${path.relative(process.cwd(), root) || "."}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
