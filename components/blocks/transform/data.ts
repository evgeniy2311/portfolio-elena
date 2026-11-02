import { getWork, type Work } from "@/lib/works";

/*
 * Шесть работ ленты «До и после». frames — номера готовых кадров (первый крупный).
 * split — пара «исходник / кадр» в одной позе для шторки; проверено по самим фото:
 * чёрное пальто со спины, жёлтый тренч со спины, дублёнка спереди в рост. У остальных поза
 * в исходнике другая (предметная съёмка, крупный план), шторки нет.
 */
type PanelSpec = { slug: string; frames: [number, number, number]; split?: { source: number; frame: number } };

const specs: PanelSpec[] = [
  { slug: "black-coat-evening", frames: [5, 0, 3], split: { source: 2, frame: 5 } },
  { slug: "beige-windbreaker", frames: [0, 1, 2] },
  { slug: "puffer-jacket", frames: [0, 1, 2] },
  { slug: "yellow-trench", frames: [1, 0, 2], split: { source: 2, frame: 1 } },
  { slug: "grey-shearling", frames: [0, 1, 2], split: { source: 0, frame: 0 } },
  { slug: "white-wrap-blouse", frames: [0, 3, 8] },
];

export type RailPanel = { work: Work; frames: number[]; split?: { source: number; frame: number } };

export const railPanels: RailPanel[] = specs.flatMap((spec) => {
  const work = getWork(spec.slug);
  if (!work) return [];
  const frames = spec.frames.filter((index) => work.frames[index]);
  const split = spec.split && work.source[spec.split.source] && work.frames[spec.split.frame] ? spec.split : undefined;
  return [{ work, frames, split }];
});
