export type Platform = "WB" | "Ozon";
export type TaskType = "Новая система" | "Редизайн" | "Серия SKU";
export type SlideKind = "cover" | "benefit" | "fit" | "detail" | "function" | "size" | "lifestyle";

export type PortfolioImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};

export type FinalSlide = PortfolioImage & {
  position: number;
  kind: SlideKind;
  role: string;
  title: string;
  rationale: string;
};

export type PortfolioCase = {
  slug: string;
  order: number;
  status: "demo" | "draft" | "published";
  featuredRank?: number;
  title: string;
  product: string;
  category: string;
  platform: Platform;
  year: "DEMO" | number;
  taskType: TaskType;
  tags: string[];
  listing: {
    cover: PortfolioImage;
    preview: PortfolioImage[];
  };
  context: string;
  challenge: string;
  hypothesis: string;
  contribution: string[];
  constraints: string[];
  sourceMaterials?: {
    intro: string;
    preserve: string[];
    items: Array<PortfolioImage & { publishable: boolean }>;
  };
  fidelity?: {
    note: string;
    checks: Array<{
      id: string;
      label: string;
      sourceId: string;
      finalSlideId: string;
      verified: boolean;
      note: string;
    }>;
  };
  finalSlides: FinalSlide[];
  decisions: Array<{ title: string; text: string }>;
  previousDesign?: PortfolioImage & { publishable: boolean };
  metrics?: Array<{
    id: string;
    label: string;
    value: string;
    note: string;
    platform: Platform;
    sku: string;
    period: { from: string; to: string };
    source: string;
    exportedAt: string;
    verified: boolean;
    publishable: boolean;
  }>;
  relatedSlugs: string[];
  publicationPermission: "demo-only" | "internal" | "approved";
};

export type PortfolioListing = Pick<PortfolioCase, "slug" | "order" | "status" | "title" | "product" | "category" | "platform" | "taskType" | "tags" | "listing"> & {
  slideCount: number;
  hasSources: boolean;
  hasVerifiedData: boolean;
};

const imageSources = [
  "/demo/storm-cover.png",
  "/demo/storm-fit.png",
  "/demo/storm-detail.png",
] as const;

const slideBlueprints: Array<Pick<FinalSlide, "kind" | "role" | "title" | "rationale">> = [
  { kind: "cover", role: "Первый контакт", title: "Обложка", rationale: "Фиксирует товар и один главный аргумент в выдаче." },
  { kind: "benefit", role: "Аргумент", title: "Ключевое преимущество", rationale: "Продолжает обещание обложки без информационного шума." },
  { kind: "fit", role: "Образ", title: "Посадка", rationale: "Показывает силуэт и пропорции вещи на человеке." },
  { kind: "detail", role: "Доказательство", title: "Материал и детали", rationale: "Приближает фактуру и конструктивные элементы." },
  { kind: "function", role: "Сценарий", title: "Функция", rationale: "Связывает свойство товара с понятной ситуацией использования." },
  { kind: "size", role: "Помощь с выбором", title: "Размер", rationale: "Снижает неопределённость перед добавлением в корзину." },
  { kind: "lifestyle", role: "Завершение", title: "Финальный образ", rationale: "Закрывает серию эмоциональным сценарием без нового обещания." },
];

function makeSlides(slug: string, title: string, count: number): FinalSlide[] {
  return Array.from({ length: count }, (_, index) => {
    const blueprint = slideBlueprints[index % slideBlueprints.length];
    return {
      id: `${slug}-slide-${index + 1}`,
      position: index + 1,
      kind: blueprint.kind,
      role: blueprint.role,
      title: index < slideBlueprints.length ? blueprint.title : `${blueprint.title} · продолжение`,
      rationale: blueprint.rationale,
      src: imageSources[index % imageSources.length],
      alt: `DEMO-слайд ${index + 1} для концепта «${title}»`,
      caption: `${blueprint.role}: ${blueprint.title}`,
    };
  });
}

type CaseSeed = Pick<PortfolioCase, "slug" | "order" | "featuredRank" | "title" | "product" | "category" | "platform" | "taskType" | "tags"> & {
  slideCount: number;
  status?: PortfolioCase["status"];
  year?: PortfolioCase["year"];
  context?: string;
  challenge?: string;
  hypothesis?: string;
  contribution?: string[];
  constraints?: string[];
  sourceMaterials?: PortfolioCase["sourceMaterials"];
  fidelity?: PortfolioCase["fidelity"];
  previousDesign?: PortfolioCase["previousDesign"];
  metrics?: PortfolioCase["metrics"];
  decisions?: PortfolioCase["decisions"];
  relatedSlugs?: string[];
  publicationPermission?: PortfolioCase["publicationPermission"];
  finalSlides?: FinalSlide[];
  listing?: PortfolioCase["listing"];
};

const seeds: CaseSeed[] = [
  { slug: "storm", order: 1, featuredRank: 1, title: "STORM", product: "Зимняя куртка", category: "Верхняя одежда", platform: "WB", taskType: "Новая система", tags: ["нейровизуал", "одежда"], slideCount: 10 },
  { slug: "silhouette", order: 2, featuredRank: 2, title: "SILHOUETTE", product: "Демисезонная куртка", category: "Куртки", platform: "Ozon", taskType: "Новая система", tags: ["fashion", "посадка"], slideCount: 6 },
  { slug: "northline", order: 3, featuredRank: 3, title: "NORTHLINE", product: "Утеплённая куртка", category: "Куртки", platform: "WB", taskType: "Серия SKU", tags: ["серия", "цвета"], slideCount: 15 },
  { slug: "form", order: 4, featuredRank: 4, title: "FORM", product: "Городская куртка", category: "Верхняя одежда", platform: "Ozon", taskType: "Редизайн", tags: ["редизайн", "силуэт"], slideCount: 10 },
  { slug: "softshell", order: 5, featuredRank: 5, title: "SOFTSHELL", product: "Куртка softshell", category: "Куртки", platform: "WB", taskType: "Новая система", tags: ["детали", "нейровизуал"], slideCount: 6 },
  { slug: "linea", order: 6, title: "LINEA", product: "Стёганое пальто", category: "Пальто", platform: "Ozon", taskType: "Серия SKU", tags: ["фактура", "серия"], slideCount: 15 },
  { slug: "flare", order: 7, title: "FLARE", product: "Удлинённая парка", category: "Парки", platform: "WB", taskType: "Редизайн", tags: ["редизайн", "посадка"], slideCount: 10 },
  { slug: "mono", order: 8, title: "MONO", product: "Базовая куртка", category: "Куртки", platform: "Ozon", taskType: "Серия SKU", tags: ["база", "цвета"], slideCount: 6 },
  { slug: "aero", order: 9, title: "AERO", product: "Городской бомбер", category: "Бомберы", platform: "WB", taskType: "Новая система", tags: ["спорт", "функция"], slideCount: 15 },
  { slug: "quartz", order: 10, title: "QUARTZ", product: "Стёганая куртка", category: "Куртки", platform: "Ozon", taskType: "Редизайн", tags: ["фактура", "редизайн"], slideCount: 10 },
  { slug: "tempo", order: 11, title: "TEMPO", product: "Лёгкая ветровка", category: "Ветровки", platform: "WB", taskType: "Серия SKU", tags: ["спорт", "серия"], slideCount: 6 },
  { slug: "muse", order: 12, title: "MUSE", product: "Fashion-куртка", category: "Куртки", platform: "Ozon", taskType: "Новая система", tags: ["fashion", "детали"], slideCount: 10 },
];

function makeCase(seed: CaseSeed): PortfolioCase {
  const finalSlides = seed.finalSlides ?? makeSlides(seed.slug, seed.title, seed.slideCount);
  const cover = finalSlides[0];
  return {
    slug: seed.slug,
    order: seed.order,
    status: seed.status ?? "demo",
    featuredRank: seed.featuredRank,
    title: seed.title,
    product: seed.product,
    category: seed.category,
    platform: seed.platform,
    year: seed.year ?? "DEMO",
    taskType: seed.taskType,
    tags: seed.tags,
    listing: seed.listing ?? {
      cover: { id: cover.id, src: cover.src, alt: cover.alt, caption: cover.caption },
      preview: finalSlides.slice(1, 3).map(({ id, src, alt, caption }) => ({ id, src, alt, caption })),
    },
    context: seed.context ?? `Учебный сценарий для проверки шаблона портфолио: ${seed.product.toLowerCase()}, ${seed.platform}. Реальный клиент, артикул и результаты не заявляются.`,
    challenge: seed.challenge ?? "Показать товар последовательно: от первого контакта в выдаче до деталей, посадки и помощи с выбором.",
    hypothesis: seed.hypothesis ?? "Серия работает яснее, когда каждый слайд отвечает на один вопрос, а визуальный ритм остаётся единым.",
    contribution: seed.contribution ?? ["Структура воронки — DEMO", "Арт-направление — DEMO", "Тексты и визуалы — временные"],
    constraints: seed.constraints ?? ["Не является клиентской работой", "Не содержит подтверждённых коммерческих результатов"],
    sourceMaterials: seed.sourceMaterials,
    fidelity: seed.fidelity,
    finalSlides,
    decisions: seed.decisions ?? [
      { title: "Композиция", text: "Крупный товар остаётся главным, а подписи поддерживают, но не перекрывают силуэт." },
      { title: "Типографика", text: "Один акцентный тезис на слайд сохраняет читаемость в мобильной карточке." },
      { title: "Возражения", text: "Серия постепенно раскрывает посадку, детали, функцию и выбор размера." },
    ],
    previousDesign: seed.previousDesign,
    metrics: seed.metrics,
    relatedSlugs: seed.relatedSlugs ?? [],
    publicationPermission: seed.publicationPermission ?? "demo-only",
  };
}

export const portfolioCases: PortfolioCase[] = seeds.map(makeCase);

const storm = portfolioCases.find((item) => item.slug === "storm")!;
storm.sourceMaterials = {
  intro: "Разрешённый DEMO-набор, созданный только для проверки порядка и интерфейса исходников.",
  preserve: ["карманы", "ветрозащитная планка", "молния", "стёжка", "фактура", "пропорции"],
  items: [
    { id: "storm-source-front", src: "/demo/storm-fit.png", alt: "DEMO-исходник: общий вид куртки", caption: "Общий вид и пропорции", publishable: true },
    { id: "storm-source-detail", src: "/demo/storm-detail.png", alt: "DEMO-исходник: фрагмент ткани и кармана", caption: "Фактура, карман и строчка", publishable: true },
    { id: "storm-source-cover", src: "/demo/storm-cover.png", alt: "DEMO-референс силуэта куртки", caption: "Силуэт и длина", publishable: true },
  ],
};
storm.fidelity = {
  note: "DEMO-сопоставление показывает принцип интерфейса, а не доказательство точности реальной работы.",
  checks: [
    { id: "pockets", label: "Карманы", sourceId: "storm-source-detail", finalSlideId: "storm-slide-6", verified: true, note: "Сверяются положение, наклон и форма входа." },
    { id: "texture", label: "Фактура", sourceId: "storm-source-detail", finalSlideId: "storm-slide-9", verified: true, note: "Проверяются материал, стёжка и характер блика." },
    { id: "proportion", label: "Пропорции", sourceId: "storm-source-front", finalSlideId: "storm-slide-8", verified: true, note: "Сопоставляются длина, объём и посадка." },
  ],
};

const form = portfolioCases.find((item) => item.slug === "form")!;
form.previousDesign = {
  id: "form-previous",
  src: "/demo/storm-detail.png",
  alt: "DEMO-макет предыдущего дизайна карточки FORM",
  caption: "DEMO: условный старый дизайн для проверки шаблона",
  publishable: true,
};

const northline = portfolioCases.find((item) => item.slug === "northline")!;
northline.metrics = [{
  id: "northline-demo-schema",
  label: "Статус данных",
  value: "НЕ ЗАГРУЖЕНЫ",
  note: "Секция демонстрирует обязательный паспорт метрики без вымышленных чисел.",
  platform: "WB",
  sku: "[артикул]",
  period: { from: "[начало]", to: "[конец]" },
  source: "[отчёт кабинета продавца]",
  exportedAt: "[дата выгрузки]",
  verified: false,
  publishable: false,
}];

portfolioCases.forEach((item, index) => {
  const previous = portfolioCases[(index - 1 + portfolioCases.length) % portfolioCases.length];
  const next = portfolioCases[(index + 1) % portfolioCases.length];
  item.relatedSlugs = [next.slug, previous.slug];
});

function validateRegistry(items: PortfolioCase[]) {
  const slugs = new Set<string>();
  const orders = new Set<number>();
  const featured = new Set<number>();
  for (const item of items) {
    if (slugs.has(item.slug) || orders.has(item.order)) throw new Error(`Duplicate portfolio identity: ${item.slug}`);
    slugs.add(item.slug);
    orders.add(item.order);
    if (item.featuredRank !== undefined) {
      if (featured.has(item.featuredRank) || item.featuredRank < 1 || item.featuredRank > 6) throw new Error(`Invalid featuredRank: ${item.slug}`);
      featured.add(item.featuredRank);
    }
    if (item.listing.preview.length > 2) throw new Error(`Archive preview exceeds two images: ${item.slug}`);
    if (item.finalSlides.length < 6 || item.finalSlides.length > 15) throw new Error(`Invalid slide count: ${item.slug}`);
    const slideIds = new Set(item.finalSlides.map((slide) => slide.id));
    if (slideIds.size !== item.finalSlides.length || item.finalSlides.some((slide, index) => slide.position !== index + 1 || !slide.alt.trim())) throw new Error(`Invalid final slide registry: ${item.slug}`);
    const publicSourceIds = new Set(item.sourceMaterials?.items.filter((source) => source.publishable).map((source) => source.id) ?? []);
    if (item.sourceMaterials?.items.some((source) => !source.publishable && source.src.startsWith("/"))) throw new Error(`Non-public source uses a public asset path: ${item.slug}`);
    if (item.fidelity?.checks.some((check) => check.verified && (!publicSourceIds.has(check.sourceId) || !slideIds.has(check.finalSlideId)))) throw new Error(`Broken fidelity reference: ${item.slug}`);
  }
  const sortedOrders = [...orders].sort((a, b) => a - b);
  if (sortedOrders.some((order, index) => order !== index + 1)) throw new Error("Portfolio order must be contiguous from 1");
  for (const item of items) {
    if (item.relatedSlugs.some((slug) => slug === item.slug || !slugs.has(slug))) throw new Error(`Broken related case: ${item.slug}`);
  }
}

validateRegistry(portfolioCases);

export const publicCases = portfolioCases
  .filter((item) => item.status === "demo" || (item.status === "published" && item.publicationPermission === "approved"))
  .sort((a, b) => a.order - b.order);

export const featuredCases = publicCases
  .filter((item) => item.featuredRank !== undefined)
  .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));

export const portfolioListings: PortfolioListing[] = publicCases.map((item) => ({
  slug: item.slug,
  order: item.order,
  status: item.status,
  title: item.title,
  product: item.product,
  category: item.category,
  platform: item.platform,
  taskType: item.taskType,
  tags: item.tags,
  listing: item.listing,
  slideCount: item.finalSlides.length,
  hasSources: item.sourceMaterials?.items.some((source) => source.publishable) === true,
  hasVerifiedData: item.metrics?.some((metric) => metric.verified && metric.publishable) === true,
}));

export function getCaseBySlug(slug: string) {
  return publicCases.find((item) => item.slug === slug);
}

export function getAdjacentCases(slug: string) {
  const orderedCases = publicCases;
  const index = orderedCases.findIndex((item) => item.slug === slug);
  if (index < 0) return undefined;
  return {
    previous: orderedCases[(index - 1 + orderedCases.length) % orderedCases.length],
    next: orderedCases[(index + 1) % orderedCases.length],
  };
}
