import type { WorkImage } from "@/lib/works";
import { responsivePath, responsiveSrcSet } from "@/lib/media-path";

type Props = { image: WorkImage; alt: string; sizes: string; className?: string; priority?: boolean; eager?: boolean };

/**
 * Кадр из портфолио: <picture> с AVIF и запасным WebP нужной ширины (scripts/build-images.mjs).
 * width/height резервируют пропорции до загрузки, фон --surface виден, пока кадр грузится или если
 * он не загрузился (обработчик в app/layout.tsx убирает значок битой картинки). `eager` грузит сразу,
 * `priority` ещё и с высоким приоритетом. Пропсы те же, что у прежней версии на next/image.
 */
export function Photo({ image, alt, sizes, className, priority = false, eager = false }: Props) {
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
