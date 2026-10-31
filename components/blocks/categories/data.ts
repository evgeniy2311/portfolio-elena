import { frame, type WorkImage } from "@/lib/works";

// С какими вещами работаю: бегущая лента категорий с моими кадрами.
export const categories: Array<{ label: string; image: WorkImage }> = [
  { label: "Пальто", image: frame("burgundy-coat-interior", 0) },
  { label: "Тренчи", image: frame("yellow-trench", 2) },
  { label: "Куртки", image: frame("puffer-jacket", 1) },
  { label: "Дублёнки", image: frame("long-sheepskin", 0) },
  { label: "Ветровки", image: frame("mint-windbreaker", 0) },
  { label: "Полупальто", image: frame("brown-pea-coat", 0) },
  { label: "Блузки", image: frame("white-wrap-blouse", 9) },
  { label: "Лонгсливы", image: frame("grey-longsleeve", 0) },
];
