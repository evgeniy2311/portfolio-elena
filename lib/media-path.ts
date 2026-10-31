/*
 * Пути к медиафайлам с учётом подпапки GitHub Pages (NEXT_PUBLIC_BASE_PATH) и адаптивные версии кадров.
 * Адаптивные файлы строит scripts/build-images.mjs: public/works/_r/<slug>/<stem>-<слот>.<avif|webp>.
 * Слот — номинальная ширина; фактическая ширина файла min(слот, ширина оригинала), оригинал не увеличивается.
 */

export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/** Должно совпадать с WIDTHS в scripts/build-images.mjs (проверяет tests/images.spec.ts). */
export const RESPONSIVE_WIDTHS = [320, 480, 640, 960] as const;
export type ResponsiveFormat = "avif" | "webp";

/** Добавляет префикс подпапки к абсолютному пути один раз: уже префиксованный путь не меняется. */
export function withBase(path: string, base: string = basePath) {
  if (!base || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

export function stripBase(path: string, base: string = basePath) {
  return base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
}

const WORK_IMAGE = /^\/works\/([a-z0-9-]+)\/([A-Za-z0-9_.-]+)\.(webp|jpe?g|png|avif)$/;

/** Путь к адаптивной версии кадра или null, если это не кадр портфолио. */
export function responsivePath(src: string, slot: number, format: ResponsiveFormat, base: string = basePath) {
  const match = stripBase(src, base).match(WORK_IMAGE);
  if (!match || match[1] === "_r") return null;
  return withBase(`/works/_r/${match[1]}/${match[2]}-${slot}.${format}`, base);
}

/** Слоты и фактические ширины для оригинала; одинаковые ширины (узкий оригинал) не повторяются. */
export function responsiveWidths(originalWidth: number) {
  const seen = new Set<number>();
  const result: { slot: number; width: number }[] = [];
  for (const slot of RESPONSIVE_WIDTHS) {
    const width = Math.min(slot, originalWidth);
    if (seen.has(width)) continue;
    seen.add(width);
    result.push({ slot, width });
  }
  return result;
}

/** srcset с фактическими ширинами файлов. */
export function responsiveSrcSet(src: string, originalWidth: number, format: ResponsiveFormat, base: string = basePath) {
  if (!responsivePath(src, RESPONSIVE_WIDTHS[0], format, base)) return null;
  return responsiveWidths(originalWidth)
    .map(({ slot, width }) => `${responsivePath(src, slot, format, base)} ${width}w`)
    .join(", ");
}

/** Наименьший слот, не меньше запрошенной ширины (иначе самый крупный). */
export function pickSlot(requested: number) {
  return RESPONSIVE_WIDTHS.find((slot) => slot >= requested) ?? RESPONSIVE_WIDTHS[RESPONSIVE_WIDTHS.length - 1];
}
