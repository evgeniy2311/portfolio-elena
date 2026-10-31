import type { PackageId } from "@/lib/site";
import { frame, type WorkImage } from "@/lib/works";

/** Как пример ведёт себя: сам листается, листается указателем/касанием или стоит. */
export type PreviewMode = "auto" | "scrub" | "still";
export type PackagePreview = { mode: PreviewMode; frames: WorkImage[]; label: string; alt: string };

const range = (slug: Parameters<typeof frame>[0], count: number) => Array.from({ length: count }, (_, index) => frame(slug, index));

export const pricesCopy = {
  eyebrow: "Цены",
  sub: "Студия, модель и стилист не нужны, поэтому в цене их нет. Точную цену назову, когда увижу вещь и задачу.",
  badge: "Самый полный",
  cta: "Начните с двух бесплатных кадров. Пакет и цену подберём после.",
  season: "Обсудить сезон",
  /** Типографическая обложка карточки «Сезон» в месте примера 3:4 (дизайн-QA D7). */
  seasonCover: "Сезон",
  seasonLabel: "Коллекции · Долгие проекты · Большие объёмы",
};

/*
 * Живые примеры пакетов — только настоящие кадры. Полная воронка: первые 12 кадров бордового пальто
 * (у тренча готовых кадров 9). Сезон — типографическая карточка без изображения.
 */
export const previews: Partial<Record<PackageId, PackagePreview>> = {
  cover: { mode: "still", frames: [frame("yellow-trench", 0)], label: "Главное фото: пример", alt: "Жёлтый тренч на модели, обложка карточки" },
  short: { mode: "scrub", frames: range("beige-windbreaker", 5), label: "Короткая серия: пять кадров бежевой ветровки", alt: "Бежевая ветровка" },
  funnel: { mode: "auto", frames: range("burgundy-coat-city", 12), label: "Полная воронка: 12 кадров бордового пальто", alt: "Бордовое пальто" },
  color: { mode: "scrub", frames: range("longsleeve-colors", 4), label: "Новый цвет: лонгслив в четырёх цветах", alt: "Лонгслив" },
  video: { mode: "still", frames: [frame("yellow-trench", 1)], label: "Видео из фото: постер", alt: "Жёлтый тренч, кадр для будущего ролика" },
};
