import { frame, type WorkImage } from "@/lib/works";

/** Тон плитки для ритма стены (council/art.md §2, блок 1): в колонке не стоят подряд два light или два accent. */
export type WallTone = "dark" | "mid" | "accent" | "light";
export type WallTile = { slug: string; image: WorkImage; alt: string; tone: WallTone };

const tile = (slug: Parameters<typeof frame>[0], frameNumber: number, tone: WallTone, alt: string): WallTile => ({
  slug,
  // Номер файла с единицы (frame-08), индекс кадра в реестре с нуля.
  image: frame(slug, frameNumber - 1),
  alt,
  tone,
});

/*
 * Стена первого экрана: 12 разных работ, порядок и состав из таблицы арт-директора.
 * Колонки едут вверх / вниз / вверх. pink-longsleeve помечен light (а не accent-light),
 * чтобы на стыке повтора колонки он не встал рядом с акцентным жёлтым тренчем как второй акцент.
 */
export const heroWall: WallTile[][] = [
  [
    tile("yellow-trench", 1, "accent", "Жёлтый тренч на модели на летней улице"),
    tile("black-coat-evening", 2, "dark", "Чёрное пальто в интерьере с тёплым светом"),
    tile("grey-shearling", 1, "mid", "Серая дублёнка на городском перекрёстке"),
    tile("pink-longsleeve", 1, "light", "Розовый лонгслив на модели в розовой студии"),
  ],
  [
    tile("puffer-jacket", 3, "dark", "Зимняя куртка с поясом в городе"),
    tile("burgundy-coat-city", 1, "accent", "Бордовое пальто на модели у городского фасада"),
    tile("white-wrap-blouse", 8, "dark", "Белая блузка на запах на фоне тёмного дерева"),
    tile("mint-windbreaker", 1, "light", "Мятная ветровка на модели"),
  ],
  [
    tile("long-sheepskin", 2, "mid", "Длинная дублёнка на модели"),
    tile("longsleeve-colors", 6, "dark", "Розовый лонгслив на графитовом фоне"),
    tile("beige-windbreaker", 1, "mid", "Бежевая ветровка на модели у тёмной стены"),
    tile("brown-longsleeve", 1, "dark", "Коричневый лонгслив в студии с контрастным светом"),
  ],
];

/** Скорости колонок, px/s: компьютер и телефон (на телефоне две видимые скорости). Знак задаёт направление: минус — вверх. */
export const wallSpeeds = { desktop: [-18, 13, -22], phone: [-12, 16, -12] } as const;

/** «Крупный план»: пуговицы бордового пальто, кадр 03, увеличение ×1.9. */
export const heroCallout = {
  image: frame("burgundy-coat-city", 2),
  zoom: 1.9,
  focus: "42% 65%",
  label: "Сверка деталей",
  caption: "Пуговицы как на оригинале",
};

export const heroCopy = {
  eyebrow: "Елена Бадьина · визуал для карточек одежды и обуви",
  lead: "Присылаете фото вещи, я делаю из него серию для карточки. Каждый кадр сверяю с оригиналом, чтобы пуговицы, швы и длина совпали.",
  who: "Работаю прежде всего с брендами одежды. Делаю кадры для Ozon, Wildberries, Lamoda, интернет-магазинов и сайтов брендов.",
  primary: "2 кадра бесплатно",
  works: "Смотреть работы",
  wallLabel: "Мои работы: кадры для карточек одежды",
};
