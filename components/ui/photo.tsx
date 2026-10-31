import type { WorkImage } from "@/lib/works";
import { responsivePath, responsiveSrcSet } from "@/lib/media-path";

type Props = { image: WorkImage; alt: string; sizes: string; className?: string; priority?: boolean; eager?: boolean; defer?: boolean };

// Прозрачная заглушка того же вида, что подставляет обработчик ошибок в app/layout.tsx.
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%271%27 height=%271%27/%3E";

/**
 * Кадр из портфолио: <picture> с AVIF и запасным WebP нужной ширины (scripts/build-images.mjs).
 * width/height резервируют пропорции до загрузки, фон --surface виден, пока кадр грузится или если
 * он не загрузился (обработчик в app/layout.tsx убирает значок битой картинки). `eager` грузит сразу,
 * `priority` ещё и с высоким приоритетом. Пропсы те же, что у прежней версии на next/image.
 *
 * `defer`: кадр пока не запрашивается вовсе — вместо него прозрачная заглушка с пропорциями кадра.
 * Нужен там, где браузерная ленивая загрузка грузит слишком рано (Chrome начинает за 1250–3000 px
 * до окна). Компонент-владелец снимает `defer`, когда блок подходит к окну. Без JavaScript
 * заглушка скрыта (@media (scripting: none) в globals.css) и показывается обычный кадр из <noscript>.
 */
export function Photo({ image, alt, sizes, className, priority = false, eager = false, defer = false }: Props) {
  if (defer)
    return (
      <>
        <picture className="photo" data-deferred-photo="">
          <img
            className={className}
            src={PLACEHOLDER}
            width={image.width}
            height={image.height}
            style={{ aspectRatio: `${image.width} / ${image.height}` }}
            alt={alt}
            decoding="async"
            data-photo=""
          />
        </picture>
        <noscript>
          <Photo image={image} alt={alt} sizes={sizes} className={className} />
        </noscript>
      </>
    );
  const avif = responsiveSrcSet(image.src, image.width, "avif");
  const webp = responsiveSrcSet(image.src, image.width, "webp");
  const loading = priority || eager ? "eager" : "lazy";
  const fallback = responsivePath(image.src, 640, "webp") ?? image.src;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- адаптивные файлы построены заранее, оптимизатор Next не нужен
    <img
      className={className}
      src={fallback}
      srcSet={webp ?? undefined}
      sizes={webp ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={loading}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      data-photo=""
    />
  );
  if (!avif) return img;
  return (
    <picture className="photo">
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      {img}
    </picture>
  );
}
