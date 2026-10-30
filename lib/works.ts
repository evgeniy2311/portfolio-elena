import media from "./works-media.json";

export type WorkImage = { src: string; width: number; height: number };

export type WorkCategory = "coats" | "jackets" | "windbreakers" | "tops";

export const categoryLabels: Record<WorkCategory, string> = {
  coats: "Пальто и тренчи",
  jackets: "Куртки и дублёнки",
  windbreakers: "Ветровки",
  tops: "Лонгсливы и блузки",
};

type WorkCopy = {
  slug: keyof typeof media;
  title: string;
  category: WorkCategory;
  /** Что было на входе и что нужно было получить. Только факты из переписки с клиентом. */
  task: string;
  /** Что видно в готовой серии. */
  result: string;
  /** Запрос клиента дословно, если он был. */
  request?: string;
  scenes: string[];
};

export type Work = WorkCopy & { source: WorkImage[]; frames: WorkImage[]; cover: WorkImage };

const copy: WorkCopy[] = [
  {
    slug: "burgundy-coat-city",
    title: "Длинное бордовое пальто",
    category: "coats",
    task: "Три студийных фото пальто на светлом фоне. Нужна воронка для карточки на модели другого размера.",
    request: "Пальто вместо 42 размера сделать 48–50 размера на худой девушке, оверсайз стиль.",
    result: "18 кадров: городская улица, крупные детали застёжки, пояса и кармана, вид в движении и сидя.",
    scenes: ["Город", "Детали", "Оверсайз-посадка"],
  },
  {
    slug: "burgundy-coat-interior",
    title: "То же пальто в интерьере",
    category: "coats",
    task: "Та же вещь, вторая серия для другой подачи.",
    request: "Воронка на пальто в интерьерной студии в минималистичном стиле.",
    result: "12 кадров в светлой студии с лепниной: полный рост, вид сзади, подкладка, посадка сидя.",
    scenes: ["Интерьер", "Минимализм", "Вид сзади"],
  },
  {
    slug: "brown-coat-three-looks",
    title: "Шоколадное пальто, три образа",
    category: "coats",
    task: "Одно пальто нужно показать разным покупательницам.",
    result: "13 кадров в трёх образах: с джинсами и голубой рубашкой, с белым жилетом, с салатовой блузой и кожаной юбкой.",
    scenes: ["Три образа", "Город", "Стилизация"],
  },
  {
    slug: "black-coat-evening",
    title: "Чёрное пальто, вечерний образ",
    category: "coats",
    task: "Три фото чёрного пальто на сером фоне. Чёрная ткань легко теряет фактуру и силуэт.",
    result: "12 кадров в тёплом интерьере с подсветкой: силуэт читается, пояс и лацканы видны.",
    scenes: ["Вечерний свет", "Интерьер", "Силуэт"],
  },
  {
    slug: "yellow-trench",
    title: "Жёлтый тренч",
    category: "coats",
    task: "Три студийных фото тренча на белом фоне.",
    result: "9 кадров на летней городской улице: кокетка на спине, пояс, погоны, посадка в движении.",
    scenes: ["Город", "Лето", "Вид сзади"],
  },
  {
    slug: "brown-pea-coat",
    title: "Полупальто с поясом",
    category: "coats",
    task: "Два студийных фото полупальто: спереди и сзади.",
    result: "14 кадров в двух образах: с юбкой в клетку и с белыми брюками.",
    scenes: ["Два образа", "Город", "Детали"],
  },
  {
    slug: "puffer-jacket",
    title: "Зимняя куртка с поясом",
    category: "jackets",
    task: "Предметные фото куртки без модели и один портрет в капюшоне.",
    result: "9 кадров на модели у городского фасада: капюшон, пояс, вид сзади, полный рост.",
    scenes: ["Город", "Без модели → на модели", "Вид сзади"],
  },
  {
    slug: "reversible-sheepskin",
    title: "Двусторонняя дублёнка",
    category: "jackets",
    task: "Вещь носится на две стороны. Обе стороны должны быть понятны покупателю.",
    result: "8 кадров: мех наружу и кожа наружу в одной серии, на улице и в движении.",
    scenes: ["Две стороны", "Город", "Движение"],
  },
  {
    slug: "long-sheepskin",
    title: "Длинная дублёнка с мехом",
    category: "jackets",
    task: "Фото на модели и крупные планы меха и подкладки.",
    result: "9 кадров на улице: капюшон с мехом, обе стороны, карман крупно.",
    scenes: ["Город", "Мех крупно", "Две стороны"],
  },
  {
    slug: "grey-shearling",
    title: "Дублёнка с мехом и каракулем",
    category: "jackets",
    task: "Сложная вещь: замша, длинный мех и каракуль в одном изделии.",
    result: "10 кадров на городском перекрёстке: каждая фактура читается, вид сзади с капюшоном.",
    scenes: ["Фактуры", "Город", "Вид сзади"],
  },
  {
    slug: "beige-windbreaker",
    title: "Тонкая бежевая ветровка",
    category: "windbreakers",
    task: "Три студийных фото ветровки на светлом фоне.",
    result: "16 кадров в городе: с шортами и легинсами, капюшон, контрастные молнии, сидя и в движении.",
    scenes: ["Город", "Два образа", "Капюшон"],
  },
  {
    slug: "mint-windbreaker",
    title: "Мятная ветровка",
    category: "windbreakers",
    task: "Два фото ветровки на светлом фоне.",
    result: "Серия в светлом интерьере: кулиска на талии, кнопки крупно, вид сзади в зеркале.",
    scenes: ["Интерьер", "Детали", "Вид сзади"],
  },
  {
    slug: "white-wrap-blouse",
    title: "Блузка на запах",
    category: "tops",
    task: "Два фото блузки на белом фоне.",
    result: "Две серии по 7 кадров: с брюками на фоне бетона и с юбкой на фоне дерева.",
    scenes: ["Две серии", "Интерьер", "Пары образов"],
  },
  {
    slug: "longsleeve-colors",
    title: "Лонгслив в четырёх цветах",
    category: "tops",
    task: "Есть фото лонгслива в трёх цветах. Нужен ещё и чёрный, которого на фото нет.",
    request: "Генерация лонгсливов в 4 цветах. Исходники плюс сделать чёрный.",
    result: "Одна серия на одной модели в четырёх цветах: коричневый, графит, розовый и чёрный.",
    scenes: ["Перекрас", "4 цвета", "Студия"],
  },
  {
    slug: "pink-longsleeve",
    title: "Розовый лонгслив",
    category: "tops",
    task: "Одно фото лонгслива на сером фоне.",
    result: "10 кадров в розовой студии: посадка, манжеты с вырезом под палец, ткань крупно.",
    scenes: ["Студия", "Детали", "Цвет в цвет"],
  },
  {
    slug: "brown-longsleeve",
    title: "Коричневый лонгслив",
    category: "tops",
    task: "Два фото лонгслива с джинсами на белом фоне.",
    result: "Серия в студии с контрастным светом и выразительными позами.",
    scenes: ["Студия", "Позы", "Посадка"],
  },
  {
    slug: "grey-longsleeve",
    title: "Графитовый лонгслив",
    category: "tops",
    task: "Одно предметное фото лонгслива крупным планом.",
    result: "9 кадров в солнечном интерьере, как живая съёмка дома.",
    scenes: ["Интерьер", "Лайфстайл", "Тёплый свет"],
  },
];

// Превью на GitHub Pages живёт в подпапке, next/image сам её к src не добавляет.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withBase = (image: WorkImage): WorkImage => ({ ...image, src: basePath + image.src });

export const works: Work[] = copy.map((item) => {
  const files = media[item.slug];
  const frames = files.frames.map(withBase);
  return { ...item, source: files.source.map(withBase), frames, cover: frames[0] };
});

export const workSlugs = works.map(({ slug }) => slug);

export function getWork(slug: string): Work | undefined {
  return works.find((work) => work.slug === slug);
}

export function frame(slug: keyof typeof media, index: number): WorkImage {
  const image = media[slug].frames[index];
  if (!image) throw new Error(`Нет кадра ${index} в ${slug}`);
  return withBase(image);
}

export function source(slug: keyof typeof media, index: number): WorkImage {
  const image = media[slug].source[index];
  if (!image) throw new Error(`Нет исходника ${index} в ${slug}`);
  return withBase(image);
}

export function altFor(work: Pick<Work, "title">, kind: "source" | "frame", index: number) {
  return kind === "source" ? `${work.title}: исходное фото ${index + 1}` : `${work.title}: кадр ${index + 1} из готовой воронки`;
}
