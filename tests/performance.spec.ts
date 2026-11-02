import { expect, test, type Page } from "@playwright/test";
import { go, isPages } from "./helpers/navigation";

/*
 * Сетевые бюджеты (plan stage 11): холодный контекст, статичная сборка под /portfolio-elena (npm run test:pages).
 * Считаются переданные байты (CDP encodedDataLength) всех ответов, кеш выключен.
 * Стенд serve-export отдаёт файлы без сжатия, поэтому замер строже, чем на GitHub Pages (там gzip).
 *   первый экран 375×812, DPR 2, без прокрутки: ≤ 500 KB;
 *   вся главная до footer без видео: ≤ 3 MB.
 */

const KB = 1024;

type Entry = { url: string; type: string; bytes: number };

async function recordTraffic(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  const meta = new Map<string, { url: string; type: string }>();
  const entries: Entry[] = [];
  client.on("Network.responseReceived", (event) => meta.set(event.requestId, { url: event.response.url, type: event.type }));
  client.on("Network.loadingFinished", (event) => {
    const info = meta.get(event.requestId);
    if (info && !info.url.startsWith("data:")) entries.push({ ...info, bytes: event.encodedDataLength });
  });
  return entries;
}

function summary(entries: Entry[]) {
  const byType: Record<string, number> = {};
  for (const entry of entries) byType[entry.type] = (byType[entry.type] ?? 0) + entry.bytes;
  const total = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const rounded = Object.fromEntries(Object.entries(byType).map(([type, bytes]) => [type, Math.round(bytes / KB)]));
  return { total, text: `${Math.round(total / KB)} KB ${JSON.stringify(rounded)}` };
}

async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle");
}

test.describe("сетевые бюджеты главной", () => {
  test.skip(!isPages, "бюджеты меряются только на статичной сборке (npm run test:pages)");

  test.describe("первый экран", () => {
    test.use({ deviceScaleFactor: 2 });

    test("375×812 DPR 2 без прокрутки весит не больше 500 KB", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile-375", "бюджет первого экрана задан для 375");
      const entries = await recordTraffic(page);
      await go(page, "/");
      await settle(page);
      const { total, text } = summary(entries);
      testInfo.annotations.push({ type: "first-screen", description: text });
      console.log(`first screen 375: ${text}`);
      if (process.env.PERF_LIST) for (const e of entries) console.log(e.type, Math.round(e.bytes / KB), e.url);
      expect(total, text).toBeLessThanOrEqual(500 * KB);
    });
  });

  test("вся главная до footer без видео весит не больше 3 MB", async ({ page }, testInfo) => {
    test.skip(!["mobile-375", "desktop-1440"].includes(testInfo.project.name), "крайние ширины");
    test.setTimeout(90_000);
    const entries = await recordTraffic(page);
    await go(page, "/");
    await settle(page);
    // Прокрутка шагами в высоту окна: ленивые изображения успевают запроситься.
    for (let step = 0; step < 200; step++) {
      const done = await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 0.8);
        return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      });
      await page.waitForTimeout(120);
      if (done) break;
    }
    await page.locator("footer").scrollIntoViewIfNeeded();
    await settle(page);
    const withoutVideo = entries.filter((entry) => entry.type !== "Media" && !/\.(mp4|webm)(\?|$)/.test(entry.url));
    const { total, text } = summary(withoutVideo);
    testInfo.annotations.push({ type: "whole-home", description: text });
    console.log(`whole home ${testInfo.project.name}: ${text}`);
    expect(total, text).toBeLessThanOrEqual(3 * KB * KB);
  });
});
