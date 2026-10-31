import { frame, type WorkImage } from "@/lib/works";

// Первый экран: сразу много работ, как в портфолио студий. Три колонки, в каждой разные вещи.
export const heroColumns: Array<Array<{ image: WorkImage; alt: string }>> = [
  [
    { image: frame("burgundy-coat-city", 0), alt: "Бордовое пальто на модели у городского фасада" },
    { image: frame("beige-windbreaker", 0), alt: "Бежевая ветровка на модели у тёмной стены" },
    { image: frame("pink-longsleeve", 0), alt: "Розовый лонгслив на модели в студии" },
  ],
  [
    { image: frame("yellow-trench", 0), alt: "Жёлтый тренч на модели на летней улице" },
    { image: frame("black-coat-evening", 0), alt: "Чёрное пальто в интерьере с тёплой подсветкой" },
    { image: frame("grey-shearling", 0), alt: "Дублёнка с мехом и каракулем на городском перекрёстке" },
  ],
  [
    { image: frame("brown-coat-three-looks", 7), alt: "Шоколадное пальто с белым жилетом в городе" },
    { image: frame("white-wrap-blouse", 0), alt: "Белая блузка на запах с брюками" },
    { image: frame("puffer-jacket", 0), alt: "Зимняя куртка с поясом у городского фасада" },
  ],
];
