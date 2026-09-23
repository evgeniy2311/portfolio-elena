export type AtelierImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  role: "source" | "scenario";
  width: number;
  height: number;
  objectPosition?: string;
};

const image = (
  id: string,
  alt: string,
  caption: string,
  role: AtelierImage["role"],
  dimensions: [number, number] = [955, 1280],
  objectPosition?: string,
): AtelierImage => ({
  id,
  src: `/atelier/${id}.webp`,
  alt,
  caption,
  role,
  width: dimensions[0],
  height: dimensions[1],
  objectPosition,
});

export const darkCoatStory = [
  image(
    "dark-coat-source-front",
    "Девушка в чёрном пальто на нейтральном светлом фоне",
    "Исходный материал",
    "source",
    [768, 1024],
  ),
  image(
    "dark-coat-hotel-back",
    "Чёрное пальто со спины в интерьере с тёплой деревянной стеной",
    "Сценарий",
    "scenario",
  ),
  image(
    "dark-coat-hotel-product",
    "Чёрное пальто с поясом у светлой стены и тёплой деревянной панели",
    "Свет и среда",
    "scenario",
    [960, 1280],
    "45% 50%",
  ),
  image(
    "dark-coat-hotel-final",
    "Полный образ с чёрным пальто в интерьере с бронзовой подсветкой",
    "Финальный образ",
    "scenario",
  ),
] satisfies AtelierImage[];

export const windbreakerStory = [
  image(
    "windbreaker-source-front",
    "Девушка в светлой ветровке на нейтральном фоне, общий вид спереди",
    "Исходный материал",
    "source",
    [768, 1024],
  ),
  image(
    "windbreaker-city-hood",
    "Светлая ветровка с поднятым капюшоном в городской сцене",
    "Капюшон и фронт",
    "scenario",
  ),
  image(
    "windbreaker-bronze-profile",
    "Светлая ветровка в городском образе на фоне бронзовой стены",
    "Бронзовый свет",
    "scenario",
  ),
  image(
    "windbreaker-city-full",
    "Полный городской образ со светлой ветровкой у тёмного фасада",
    "Полный образ",
    "scenario",
  ),
  image(
    "windbreaker-city-detail",
    "Городской образ со светлой ветровкой и капюшоном, кадр до бёдер",
    "Посадка и детали",
    "scenario",
  ),
] satisfies AtelierImage[];

export const colorCoatStory = [
  image(
    "coat-color-source-front",
    "Девушка в чёрном пальто с поясом на нейтральном фоне",
    "Исходный материал",
    "source",
    [768, 1024],
  ),
  image(
    "coat-color-city-back",
    "Коричневое пальто со спины в городском образе",
    "Линия спины",
    "scenario",
    [766, 1026],
  ),
  image(
    "coat-color-city-motion",
    "Коричневое пальто в движении на городской улице",
    "Движение",
    "scenario",
    [766, 1026],
  ),
  image(
    "coat-color-city-street",
    "Коричневое пальто с поясом в городском кадре у светлого фасада",
    "Цвет и пояс",
    "scenario",
    [766, 1026],
  ),
] satisfies AtelierImage[];

export const atelierStories = [
  {
    id: "dark-coat",
    number: "01",
    eyebrow: "От исходника к fashion-сцене",
    title: "От нейтрального кадра к сцене с характером.",
    text: "Сначала читаются силуэт, длина и пояс. Затем появляется среда: тёплое дерево, направленный свет, более собранная стилизация. Модель и композиция меняются, поэтому это визуальный сценарий, а не прямое сравнение до и после.",
    href: "/works/atelier-in-motion",
    images: darkCoatStory,
  },
  {
    id: "windbreaker",
    number: "02",
    eyebrow: "Один товар, несколько сценариев",
    title: "Конструкция остаётся узнаваемой. Контекст меняет настроение.",
    text: "Светлая ветровка проходит через нейтральный кадр, городской фронт, бронзовую стену и полный образ. Капюшон, контрастные молнии и длина остаются точками сверки.",
    images: windbreakerStory,
  },
  {
    id: "color-coat",
    number: "03",
    eyebrow: "Цвет как система",
    title: "Цвет задаёт новую главу, а не случайный фильтр.",
    text: "Чёрное пальто становится коричневым и получает несколько городских направлений. Здесь важны повторяемость оттенка, читаемые лацканы, пояс и длина.",
    images: colorCoatStory,
  },
] as const;

export const comparisonImages = {
  source: darkCoatStory[0],
  scenario: darkCoatStory[2],
};
