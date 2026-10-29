// Готовит фотографии работ из Telegram-экспорта для сайта.
// Запуск: node scripts/import-works.mjs "<папка экспорта>/photos"
// Берёт только полноразмерные файлы (без _thumb), переводит в WebP не выше 1280 px,
// снимает EXIF и пишет размеры в lib/works-media.json для next/image.
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const photosDir = process.argv[2];
if (!photosDir) {
  console.error("Укажите папку photos из экспорта Telegram.");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const { works } = JSON.parse(await readFile(path.join(root, "scripts/works-import.json"), "utf8"));
const files = (await readdir(photosDir)).filter((name) => name.endsWith(".jpg") && !name.includes("_thumb"));

function findPhoto(number) {
  const match = files.find((name) => name.startsWith(`photo_${number}@`));
  if (!match) throw new Error(`Нет файла photo_${number}`);
  return path.join(photosDir, match);
}

async function convert(number, outFile) {
  const { data, info } = await sharp(findPhoto(number))
    .rotate()
    .resize({ height: 1280, width: 1280, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  await writeFile(outFile, data);
  return { width: info.width, height: info.height, bytes: info.size };
}

const media = {};
let total = 0;
for (const work of works) {
  const dir = path.join(root, "public/works", work.slug);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const entry = { source: [], frames: [] };
  for (const [index, number] of work.source.entries()) {
    const name = `source-${index + 1}.webp`;
    const info = await convert(number, path.join(dir, name));
    total += info.bytes;
    entry.source.push({ src: `/works/${work.slug}/${name}`, width: info.width, height: info.height });
  }
  for (const [index, number] of work.frames.entries()) {
    const name = `frame-${String(index + 1).padStart(2, "0")}.webp`;
    const info = await convert(number, path.join(dir, name));
    total += info.bytes;
    entry.frames.push({ src: `/works/${work.slug}/${name}`, width: info.width, height: info.height });
  }
  media[work.slug] = entry;
  console.log(`${work.slug}: ${entry.source.length} исходн. + ${entry.frames.length} кадров`);
}

await writeFile(path.join(root, "lib/works-media.json"), `${JSON.stringify(media, null, 2)}\n`);
console.log(`Готово, ${(total / 1024 / 1024).toFixed(1)} МБ`);
