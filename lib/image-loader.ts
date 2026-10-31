/*
 * Загрузчик next/image (next.config.ts, images.loaderFile): вместо оптимизатора /_next/image
 * отдаёт заранее построенный WebP нужной ширины. Работает одинаково в dev, на сервере и в статичной сборке.
 * Кадры вне public/works остаются как есть (с префиксом подпапки).
 */
import { pickSlot, responsivePath, withBase } from "./media-path";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  return responsivePath(src, pickSlot(width), "webp") ?? withBase(src);
}
