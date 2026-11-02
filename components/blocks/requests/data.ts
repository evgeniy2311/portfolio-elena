import { quoteOf, storyFor } from "@/lib/work-stories";
import { getWork, type Work } from "@/lib/works";

/*
 * Пять карточек «Задачи заказчиков» (copy.md [6]): тексты из историй работ (lib/work-stories.ts).
 * Метка у всех пяти одна — «Задача». Дословный запрос заказчика показывается в «», у работ без него —
 * задача своими словами, без кавычек.
 * frames — номера готовых кадров, у каждой карточки разные снимки (у бордового пальто кадры 1 и 14
 * почти одинаковые, поэтому третий — пояс крупно); у лонгслива четыре цвета сеткой 2×2.
 */
const specs: Array<{ slug: string; frames: number[]; square?: boolean }> = [
  { slug: "burgundy-coat-city", frames: [0, 9, 3] },
  { slug: "burgundy-coat-interior", frames: [0, 4, 9] },
  { slug: "longsleeve-colors", frames: [0, 1, 5, 3], square: true },
  { slug: "brown-coat-three-looks", frames: [0, 7, 10] },
  { slug: "reversible-sheepskin", frames: [0, 3, 6] },
];

export type DeckCard = { work: Work; label: string; quote: string; verbatim: boolean; result: string; frames: number[]; square: boolean };

export const deckCards: DeckCard[] = specs.flatMap((spec) => {
  const work = getWork(spec.slug);
  if (!work) return [];
  const story = storyFor(work);
  const quote = quoteOf(story);
  return [
    {
      work,
      label: "Задача",
      quote: quote ?? story.task,
      verbatim: Boolean(quote),
      result: story.result,
      frames: spec.frames.filter((index) => work.frames[index]),
      square: Boolean(spec.square),
    },
  ];
});
