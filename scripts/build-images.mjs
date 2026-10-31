#!/usr/bin/env node
/*
 * Адаптивные версии кадров портфолио для сайта и статичной сборки:
 *   public/works/<slug>/<stem>.webp → public/works/_r/<slug>/<stem>-<слот>.{avif,webp}
 * Слоты 320/480/640/960 (как RESPONSIVE_WIDTHS в lib/media-path.ts); ширина файла min(слот, оригинал):
 * оригинал не увеличивается. AVIF q50, WebP q72. Оригиналы не меняются, _r/ в Git не хранится.
 *
 * Повторный запуск пропускает готовые файлы (новее исходника); каталог _r/ сам не сканируется.
 * Каждый кадр из реестра (lib/works-media.json) обязан существовать: иначе выход 1 с путём.
 *
 *   node scripts/build-images.mjs [--manifest lib/works-media.json] [--public public] [--concurrency 4]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const WIDTHS = [320, 480, 640, 960];
const FORMATS = { avif: { quality: 50 }, webp: { quality: 72 } };
const SOURCE_TYPES = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const publicDir = path.resolve(arg("public", "public"));
const manifestPath = path.resolve(arg("manifest", "lib/works-media.json"));
const concurrency = Math.max(1, Math.min(8, Number(arg("concurrency", Math.min(4, os.availableParallelism?.() ?? 4))) || 4));
const worksDir = path.join(publicDir, "works");
const outDir = path.join(worksDir, "_r");

function fail(message) {
  console.error(`build-images: ${message}`);
  process.exit(1);
}

// 1. Реестр кадров: каждый путь должен вести к файлу.
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`не читается реестр ${path.relative(process.cwd(), manifestPath)}: ${error.message}`);
}
if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) fail(`реестр ${manifestPath} должен быть объектом { slug: { source, frames } }`);

const declared = [];
for (const [slug, entry] of Object.entries(manifest)) {
  if (!entry || !Array.isArray(entry.frames) || !Array.isArray(entry.source)) fail(`реестр: у «${slug}» нет списков source и frames`);
  for (const image of [...entry.source, ...entry.frames]) {
    if (!image || typeof image.src !== "string" || !(image.width > 0) || !(image.height > 0)) fail(`реестр: неверная запись в «${slug}»: ${JSON.stringify(image)}`);
    const file = path.join(publicDir, image.src);
    if (!file.startsWith(`${worksDir}${path.sep}`)) fail(`реестр: путь вне public/works: ${image.src}`);
    if (!fs.existsSync(file)) fail(`нет файла кадра: ${path.relative(process.cwd(), file)} (из реестра «${slug}»)`);
    declared.push(file);
  }
}

// 2. Все исходники public/works/<slug>/ (без _r): в реестре и вне его (например, кадры для проблем).
const sources = new Set(declared);
if (fs.existsSync(worksDir)) {
  for (const slug of fs.readdirSync(worksDir, { withFileTypes: true })) {
    if (!slug.isDirectory() || slug.name === "_r" || slug.name.startsWith(".")) continue;
    for (const file of fs.readdirSync(path.join(worksDir, slug.name), { withFileTypes: true })) {
      if (file.isFile() && SOURCE_TYPES.has(path.extname(file.name).toLowerCase())) sources.add(path.join(worksDir, slug.name, file.name));
    }
  }
}

const jobs = [];
for (const file of sources) {
  const relative = path.relative(worksDir, file);
  const [slug, name] = relative.split(path.sep);
  const stem = name.slice(0, -path.extname(name).length);
  for (const slot of WIDTHS) {
    for (const format of Object.keys(FORMATS)) jobs.push({ file, slot, format, target: path.join(outDir, slug, `${stem}-${slot}.${format}`) });
  }
}

function upToDate(job) {
  try {
    return fs.statSync(job.target).mtimeMs >= fs.statSync(job.file).mtimeMs;
  } catch {
    return false;
  }
}

let encoded = 0;
let skipped = 0;
const widthCache = new Map();

async function run(job) {
  if (upToDate(job)) {
    skipped += 1;
    return;
  }
  if (!widthCache.has(job.file)) widthCache.set(job.file, (await sharp(job.file).metadata()).width);
  const width = Math.min(job.slot, widthCache.get(job.file));
  fs.mkdirSync(path.dirname(job.target), { recursive: true });
  // Запись через временный файл: параллельный запуск (два dev-сервера) не оставит полузаписанный кадр.
  const temp = `${job.target}.${process.pid}.tmp`;
  await sharp(job.file).resize({ width, withoutEnlargement: true })[job.format](FORMATS[job.format]).toFile(temp);
  fs.renameSync(temp, job.target);
  encoded += 1;
}

const started = Date.now();
let next = 0;
let failed = null;
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < jobs.length && !failed) {
      const job = jobs[next++];
      try {
        await run(job);
      } catch (error) {
        failed = `не удалось обработать ${path.relative(process.cwd(), job.file)} → ${path.relative(process.cwd(), job.target)}: ${error.message}`;
      }
    }
  }),
);
if (failed) fail(failed);

console.log(`build-images: кадров ${sources.size}, файлов ${jobs.length}: построено ${encoded}, готовых ${skipped} (${((Date.now() - started) / 1000).toFixed(1)} с)`);
