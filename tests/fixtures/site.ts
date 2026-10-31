/*
 * Тестовые данные стенда состояний (NEXT_PUBLIC_QA_FIXTURE). Подключаются только dev-сервером:
 * lib/site.ts загружает этот файл в ветке development, production и export-сборка его не видят
 * (scripts/assert-production-clean.mjs ищет маркер ниже в готовой сборке).
 * Контакты ненастоящие. Ролик — технический тестовый сигнал ffmpeg (testsrc2), не работа Елены.
 */
import { works } from "../../lib/works";

/** Маркер, по которому проверка сборки находит утечку тестовых данных. */
export const QA_SENTINEL = "qa-fixture-sentinel";

export const qaContacts = {
  telegram: "https://t.me/qa_fixture_sentinel",
  whatsapp: "https://wa.me/10000000000",
  email: null as string | null,
};

/** Адрес, который Playwright перехватывает и отдаёт tests/fixtures/qa-video.{webm,mp4}. В public/ файлов нет. */
export const qaVideoRoute = `/__${QA_SENTINEL}__/video`;

const poster = (slug: string, frame: number) => {
  const work = works.find((item) => item.slug === slug);
  if (!work) throw new Error(`QA fixture: нет работы ${slug}`);
  return work.frames[frame - 1];
};

export const qaVideos = [
  { label: "Тестовый ролик 1", poster: poster("yellow-trench", 2) },
  { label: "Тестовый ролик 2", poster: poster("burgundy-coat-city", 3) },
  { label: "Тестовый ролик 3", poster: poster("brown-pea-coat", 14) },
  { label: "Тестовый ролик 4", poster: poster("burgundy-coat-city", 9) },
].map((clip, index) => ({
  ...clip,
  sources: [
    { src: `${qaVideoRoute}-${index + 1}.webm`, type: "video/webm" },
    { src: `${qaVideoRoute}-${index + 1}.mp4`, type: "video/mp4" },
  ],
}));
