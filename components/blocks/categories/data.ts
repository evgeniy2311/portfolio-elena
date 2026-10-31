import { frame, type WorkImage } from "@/lib/works";

/** Плитка ленты «С чем работаю». image: null — типографическая плитка (TEMP для обуви). */
export type CategoryTile = { label: string; image: WorkImage | null; temp?: "shoe" };

export const categoriesCopy = {
  eyebrow: "С чем работаю",
  sub: "Беру только одежду и обувь. В них я разбираюсь и знаю, с какого ракурса их показать.",
  label: "Категории вещей, лента",
};

// Девять плиток из copy.md [2]. Кадры — мои работы; обувь пока типографическая (council/SYNTHESIS.md, решение 4).
export const categories: CategoryTile[] = [
  { label: "Пальто", image: frame("burgundy-coat-interior", 0) },
  { label: "Тренчи", image: frame("yellow-trench", 2) },
  { label: "Куртки", image: frame("puffer-jacket", 1) },
  { label: "Дублёнки", image: frame("long-sheepskin", 0) },
  { label: "Ветровки", image: frame("mint-windbreaker", 0) },
  { label: "Полупальто", image: frame("brown-pea-coat", 0) },
  { label: "Блузки", image: frame("white-wrap-blouse", 9) },
  { label: "Лонгсливы", image: frame("grey-longsleeve", 0) },
  // TEMP: кадр обуви не утверждён, до решения владельца — типографическая плитка.
  { label: "Обувь", image: null, temp: "shoe" },
];
