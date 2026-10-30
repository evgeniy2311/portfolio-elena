// Единое место для контактов, услуг и цен.
// Пока ссылка или цена не подтверждены Еленой, поле остаётся null и сайт показывает честную заглушку.

export const contact = {
  /** Полная ссылка вида https://t.me/<ник>. null, пока Елена не подтвердила адрес. */
  telegram: null as string | null,
  /** Запасной канал для клиентов из РФ (Telegram там ограничен): MAX, e-mail или VK. */
  backup: null as { label: string; href: string } | null,
};

/** Блок «Обо мне». Фото и опыт Елена присылает сама; пока null, блок показывает монограмму и не пишет про опыт. */
export const about = {
  photo: null as { src: string; width: number; height: number } | null,
  /** Одна фраза об опыте, только со слов Елены. */
  experience: null as string | null,
};

export const trialMessage = "Здравствуйте! Хочу попробовать 2 бесплатных кадра. Пришлю фото вещи.";

export function telegramHref(): string | null {
  if (!contact.telegram) return null;
  return `${contact.telegram}?text=${encodeURIComponent(trialMessage)}`;
}

export type Package = {
  name: string;
  includes: string;
  /** Цена «от» в рублях. null, пока Елена не утвердила. */
  priceFrom: number | null;
  featured?: boolean;
};

export const packages: Package[] = [
  { name: "Главное фото", includes: "Обложка с инфографикой, которая выделяет карточку в выдаче.", priceFrom: null },
  { name: "Короткая серия", includes: "3–5 кадров одной вещи: обложка, посадка, детали крупно.", priceFrom: null },
  { name: "Полная воронка", includes: "15–20 кадров: обложка, детали, вид сзади, образы и сцены.", priceFrom: null, featured: true },
  { name: "Новый цвет", includes: "Та же серия в другом цвете вещи, даже если его нет на фото.", priceFrom: null },
];

export function formatPrice(value: number | null): string {
  if (value === null) return "Цену назову по вашей задаче";
  return `от ${value.toLocaleString("ru-RU")} ₽`;
}
