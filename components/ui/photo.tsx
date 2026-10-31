import Image from "next/image";
import type { WorkImage } from "@/lib/works";

/** Кадр из портфолио через next/image. `eager` грузит сразу, `priority` ещё и с высоким приоритетом. */
export function Photo({ image, alt, sizes, className, priority = false, eager = false }: { image: WorkImage; alt: string; sizes: string; className?: string; priority?: boolean; eager?: boolean }) {
  return (
    <Image
      loading={eager && !priority ? "eager" : undefined}
      className={className}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={alt}
      sizes={sizes}
      priority={priority}
    />
  );
}
