// Единое место для контактов, услуг и цен.
// Пока ссылка или цена не подтверждены Еленой, поле остаётся null и сайт показывает честную заглушку.

import type { WorkImage } from "@/lib/works";

/*
 * Стенд состояний для тестов: NEXT_PUBLIC_QA_FIXTURE=contacts | videos | contacts,videos.
 * Работает только в `next dev`. Production и export-сборка с непустым флагом останавливаются
 * (scripts/build-site.mjs и next.config.ts), тестовые данные в сборку не попадают.
 */
export const qaFixtureNames = ["contacts", "videos"] as const;
export type QaFixture = (typeof qaFixtureNames)[number];

export function parseQaFixture(value: string | undefined): Set<QaFixture> {
  const names = (value ?? "").split(",").map((name) => name.trim()).filter(Boolean);
  for (const name of names) {
    if (!(qaFixtureNames as readonly string[]).includes(name)) {
      throw new Error(`NEXT_PUBLIC_QA_FIXTURE: неизвестное значение «${name}». Допустимо: ${qaFixtureNames.join(", ")}.`);
    }
  }
  return new Set(names as QaFixture[]);
}

type Fixtures = typeof import("../tests/fixtures/site");
const qa = process.env.NODE_ENV === "development" ? parseQaFixture(process.env.NEXT_PUBLIC_QA_FIXTURE) : new Set<QaFixture>();
// Только dev: в production ветка вырезается сборщиком, файл тестов в граф сборки не входит.
const fixtures: Fixtures | null =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  process.env.NODE_ENV === "development" && qa.size > 0 ? (require("../tests/fixtures/site") as Fixtures) : null;

type Contact = {
  /** Полная ссылка вида https://t.me/<ник>. null, пока Елена не подтвердила адрес. */
  telegram: string | null;
  /** Ссылка вида https://wa.me/<номер>. Номер на странице не показывается. null, пока не подтверждён. */
  whatsapp: string | null;
  /** Почта, если Елена захочет её показать. */
  email: string | null;
  /** Запасной канал для клиентов из РФ (Telegram там ограничен): MAX, e-mail или VK. */
  backup: { label: string; href: string } | null;
};

const confirmedContact: Contact = { telegram: null, whatsapp: null, email: null, backup: null };

export const contact: Contact = fixtures && qa.has("contacts") ? { ...confirmedContact, ...fixtures.qaContacts } : confirmedContact;

export type VideoClip = { label: string; poster: WorkImage; sources: { src: string; type: string }[] };

/** Ролики «видео из фото». Пока настоящих нет, список пуст и блок показывает постеры с «Ролики скоро». */
export const videos: VideoClip[] = fixtures && qa.has("videos") ? fixtures.qaVideos : [];

/** Блок «Обо мне». Фото и опыт Елена присылает сама; пока null, блок показывает монограмму и не пишет про опыт. */
export const about = {
  photo: null as { src: string; width: number; height: number } | null,
  /** Одна фраза об опыте, только со слов Елены. */
  experience: null as string | null,
};

/** Повод обращения: от него зависит готовое сообщение (copy.md «Готовые сообщения»). */
export type ContactIntent = "trial" | "project" | "season" | "video" | "question";

export const intentMessages: Record<ContactIntent, string> = {
  trial: "Здравствуйте! Хочу попробовать 2 бесплатных кадра. Пришлю фото вещи.",
  project: "Здравствуйте! Хочу обсудить проект. Расскажу про вещи и площадку.",
  season: "Здравствуйте! Готовим коллекцию к сезону, хотим обсудить объём и условия.",
  video: "Здравствуйте! Хочу сделать видео из фото вещи.",
  question: "Здравствуйте! У меня вопрос.",
};

/** Совместимость: сообщение кнопки «2 кадра бесплатно». */
export const trialMessage = intentMessages.trial;

function parseUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Адрес Telegram только вида https://t.me/<ник>; всё прочее (другая схема, хост, путь) не активирует кнопку. */
export function safeTelegram(value: string | null | undefined): string | null {
  const url = parseUrl(value);
  if (!url || url.protocol !== "https:" || url.hostname !== "t.me" || url.port || url.username || url.password || url.search || url.hash) return null;
  if (!/^\/[A-Za-z][A-Za-z0-9_]{4,31}$/.test(url.pathname)) return null;
  return `https://t.me${url.pathname}`;
}

/** Адрес WhatsApp только вида https://wa.me/<номер цифрами>. Номер на странице не показывается. */
export function safeWhatsapp(value: string | null | undefined): string | null {
  const url = parseUrl(value);
  if (!url || url.protocol !== "https:" || url.hostname !== "wa.me" || url.port || url.username || url.password || url.search || url.hash) return null;
  if (!/^\/\d{8,15}$/.test(url.pathname)) return null;
  return `https://wa.me${url.pathname}`;
}

export function telegramHref(intent: ContactIntent = "trial", address: string | null = contact.telegram): string | null {
  const base = safeTelegram(address);
  return base ? `${base}?text=${encodeURIComponent(intentMessages[intent])}` : null;
}

export function whatsappHref(intent: ContactIntent = "project", address: string | null = contact.whatsapp): string | null {
  const base = safeWhatsapp(address);
  return base ? `${base}?text=${encodeURIComponent(intentMessages[intent])}` : null;
}

/** Что показывает блок контактов: готовые ссылки или честно выключенные кнопки. */
export function contactLinks(source: Pick<Contact, "telegram" | "whatsapp" | "email"> = contact, intent: ContactIntent = "project") {
  const email = source.email && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(source.email) ? source.email : null;
  return { telegram: telegramHref(intent, source.telegram), whatsapp: whatsappHref(intent, source.whatsapp), email };
}

/** Стабильные идентификаторы пакетов: по ним блок цен подбирает примеры работ. */
export type PackageId = "cover" | "short" | "funnel" | "color" | "video" | "season";

export type Package = {
  id: PackageId;
  name: string;
  includes: string;
  /** Цена «от» в рублях. null, пока Елена не утвердила; никогда не подменяется нулём. */
  priceFrom: number | null;
  /** Цена договорная: вместо суммы «Обсудим отдельно» (видео и сезон, council/SYNTHESIS.md). */
  negotiable?: boolean;
  featured?: boolean;
};

// Тексты пакетов: copy.md [11]. Полная воронка как услуга: 10–12 кадров.
export const packages: Package[] = [
  { id: "cover", name: "Главное фото", includes: "Обложка с инфографикой. Первый кадр, который видят в выдаче.", priceFrom: null },
  { id: "short", name: "Короткая серия", includes: "3–5 кадров одной вещи: обложка, посадка, детали крупно.", priceFrom: null },
  { id: "funnel", name: "Полная воронка", includes: "10–12 кадров: обложка, посадка, вид сзади, детали, образы и сцены.", priceFrom: null, featured: true },
  { id: "color", name: "Новый цвет", includes: "Та же серия в другом цвете, даже если его нет на фото.", priceFrom: null },
  { id: "video", name: "Видео из фото", includes: "Короткие ролики из готовых кадров. Вещь в движении не меняется.", priceFrom: null, negotiable: true },
  { id: "season", name: "Сезон и большие объёмы", includes: "Коллекция к сезону или долгий проект с брендом. Условия обсудим отдельно.", priceFrom: null, negotiable: true },
];

export function formatPrice(value: number | null): string {
  if (value === null) return "Цену назову по вашей задаче";
  return `от ${value.toLocaleString("ru-RU")} ₽`;
}

/** Строка цены пакета: договорная — «Обсудим отдельно», иначе formatPrice. */
export function priceLabel(item: Pick<Package, "priceFrom" | "negotiable">): string {
  return item.negotiable ? "Обсудим отдельно" : formatPrice(item.priceFrom);
}
