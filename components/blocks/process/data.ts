import { frame, source, type WorkImage } from "@/lib/works";

/** Шаги: council/copy.md «ТЕКСТЫ» [10]. У пятого шага нет строки про Lamoda (не подтверждено). */
export const steps = [
  { title: "Вы присылаете фото вещи", text: "2–3 фото: спереди, сзади и детали крупно. Напишите, для какой площадки вещь и кто её покупает." },
  { title: "Я делаю два кадра бесплатно", text: "Вы видите качество на своей вещи до оплаты." },
  { title: "Договариваемся о серии", text: "Выбираем сцены, образы и число кадров." },
  { title: "Собираю серию и сверяю", text: "Проверяю каждый кадр с оригиналом: крой, детали, цвет." },
  { title: "Отдаю готовые файлы", text: "Кадры в формате 3:4 для Wildberries и Ozon." },
];

type Shot = { image: WorkImage; alt: string };

/*
 * Сцена «Assembly Line» на настоящей работе yellow-trench: 3 исходника и 9 готовых кадров.
 * Каждый кадр тренча встречается один раз (2 пробных + 6 в серии + 1 на сверке = 9).
 * Для готовой выдачи 10–12 кадров у тренча кадров не хватает, поэтому показана другая реальная
 * серия, бордовое пальто (Decisions плана), с явной подписью.
 */
export const assembly = {
  source: { image: source("yellow-trench", 1), alt: "Исходное фото жёлтого тренча на белом фоне, как его присылают" } as Shot,
  trial: [
    { image: frame("yellow-trench", 0), alt: "Пробный кадр 1: тренч на модели в городе" },
    { image: frame("yellow-trench", 1), alt: "Пробный кадр 2: тренч, вид сзади" },
  ] as Shot[],
  series: [2, 3, 4, 5, 6, 7].map((index) => ({ image: frame("yellow-trench", index), alt: "" })) as Shot[],
  check: { image: frame("yellow-trench", 8), alt: "Готовый кадр тренча с отметками сверки: пояс, манжета, пряжка" } as Shot,
  /** Точки сверки на кадре frame-09, в процентах от ширины и высоты кадра. */
  details: [
    { label: "пояс", x: 62, y: 40 },
    { label: "манжета", x: 73, y: 46 },
    { label: "пряжка", x: 69, y: 57 },
  ],
  delivery: Array.from({ length: 12 }, (_, index) => ({ image: frame("burgundy-coat-city", index), alt: "" })) as Shot[],
  deliveryCaption: "Пример полной воронки: бордовое пальто",
};
