import { expect, test } from "@playwright/test";
import { about } from "../lib/site";
import { go } from "./helpers/navigation";

/*
 * «Обо мне»: временный коллаж из собственных кадров вместо портрета, без выдуманного опыта,
 * «Slot Word» без смены ширины, полная фраза для экранного диктора, финальный вид без движения.
 */

const section = "#about";
const fullSentence = "Делаю кадры для Ozon, Wildberries, Lamoda, интернет-магазинов и сайтов брендов.";

test("без фото Елены: коллаж из моих кадров, без ложного портрета", async ({ page }) => {
  expect(about.photo).toBeNull();
  await go(page, "/");
  const collage = page.locator(section).getByRole("img", { name: "Кадры из моих работ" });
  await expect(collage).toHaveCount(1);
  await expect(collage.locator("img")).toHaveCount(3);
  expect(await page.locator(`${section} img[alt*='Елена']`).count()).toBe(0);
  await expect(page.locator(section)).not.toContainText("Фото скоро обновится");
  // Кадры коллажа запрашиваются, только когда он подходит к окну (бюджет первого экрана).
  const first = collage.locator("img").first();
  expect(await first.evaluate((image: HTMLImageElement) => image.currentSrc || image.src)).toMatch(/^data:image\/svg/);
  await collage.scrollIntoViewIfNeeded();
  await expect.poll(() => first.evaluate((image: HTMLImageElement) => image.complete && /\.avif$/.test(image.currentSrc))).toBe(true);
  const sources = await collage.locator("img").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).currentSrc || image.getAttribute("src")));
  expect(sources.join(" ")).toMatch(/yellow-trench\/frame-02/);
  expect(sources.join(" ")).toMatch(/burgundy-coat-city\/frame-03/);
  expect(sources.join(" ")).toMatch(/longsleeve-colors\/frame-06/);
});

test("без подтверждённого опыта: нет выдуманной фразы и служебных пометок", async ({ page }) => {
  expect(about.experience).toBeNull();
  await go(page, "/");
  const text = await page.locator(section).innerText();
  expect(text).not.toMatch(/подтвердить|старого сайта|сюда|TEMP|лет опыта/i);
  await expect(page.locator(section).locator("h3")).toHaveText(["Только одежда и обувь", "Насмотренность", "Ручная сверка", "Долгие проекты и сезон"]);
  await expect(page.locator(section)).toContainText("Условия для таких проектов обсудим отдельно.");
});

test("кнопки: вторичная «Обсудить сезон» и ссылка на работы, без основного оффера", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator(`${section} a.button-ghost`)).toHaveText(/Обсудить сезон/);
  expect(await page.locator(`${section} a.text-link`).getAttribute("href")).toMatch(/\/works\/?$/);
  await expect(page.locator(section).getByText("2 кадра бесплатно")).toHaveCount(0);
});

test("Slot Word: слово меняется, ширина прорези постоянна, диктор слышит полную фразу", async ({ page }) => {
  await go(page, "/");
  const lead = page.locator(`${section} [data-slot]`);
  await expect(lead).toHaveAttribute("data-slot", "on", { timeout: 30_000 });
  await lead.scrollIntoViewIfNeeded();
  const slot = page.locator(`${section} [data-slot-word]`);
  const first = await slot.locator("[data-state='active']").innerText();
  expect(first).toContain("сайтов брендов");
  const widths = new Set<number>();
  const seen = new Set<string>();
  for (let step = 0; step < 4; step += 1) {
    widths.add(Math.round((await slot.boundingBox())!.width));
    seen.add(await slot.locator("[data-state='active']").innerText());
    await page.waitForTimeout(1300);
  }
  expect(seen.size).toBeGreaterThan(1);
  expect(widths.size).toBe(1);
  // Прорезь скрыта от диктора, полная фраза есть в дереве доступности.
  expect(await page.locator(`${section} [data-slot-word]`).evaluate((element) => element.closest("[aria-hidden='true']") !== null)).toBe(true);
  await expect(lead).toContainText(fullSentence);
  await expect(page.locator(section).getByRole("paragraph").filter({ hasText: fullSentence })).toHaveCount(1);

  // Пауза останавливает смену.
  const pause = page.locator(`${section} [data-loop-pause]`);
  await expect(pause).toHaveAccessibleName("Пауза смены площадок");
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  const stopped = await slot.locator("[data-state='active']").innerText();
  await page.waitForTimeout(2800);
  expect(await slot.locator("[data-state='active']").innerText()).toBe(stopped);
});

test("лид не повторяет строку героя «Работаю прежде всего с брендами одежды» (D16)", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator(`${section} .lede`)).not.toContainText("Работаю прежде всего");
  await expect(page.locator(`${section} .lede`)).toContainText("Делаю кадры для");
});

test("reduced motion: полная фраза обычным текстом, изображение и заголовок в финальном виде", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
  await expect(page.locator(`${section} [data-slot]`)).toHaveAttribute("data-slot", "off");
  await expect(page.locator(`${section} [data-slot-word]`)).toBeHidden();
  await expect(page.locator(section).getByText(fullSentence)).toBeVisible();
  await expect(page.locator(`${section} [data-loop-pause]`)).toHaveCount(0);
  const clip = await page.locator(`${section} [data-collage]`).evaluate((element) => getComputedStyle(element).clipPath);
  expect(clip).toBe("none");
});

test("без JavaScript: полная фраза и сезон видны", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await go(page, "/");
  await expect(page.locator(section).getByText(fullSentence)).toBeVisible();
  await expect(page.locator(section).getByText("Долгие проекты и сезон")).toBeVisible();
  await expect(page.locator(`${section} [data-collage]`)).toBeVisible();
  await context.close();
});

test("при появлении изображение раскрывается до конца", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "on", { timeout: 30_000 });
  await page.locator(`${section} [data-collage]`).scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(`${section} [data-collage]`).evaluate((element) => getComputedStyle(element).clipPath), { timeout: 5000 }).toMatch(/^(none|inset\(0px\))$/);
});

test("пункты: заголовки одной высоты в ряду, текст сразу под ними (дизайн-QA D15)", async ({ page }) => {
  await go(page, "/");
  const rows = await page.locator("#about li").evaluateAll((items) =>
    items.map((item) => {
      const title = item.querySelector("h3")!.getBoundingClientRect();
      const text = item.querySelector("p")!.getBoundingClientRect();
      return { top: Math.round(title.top), height: title.height, gap: text.top - title.bottom };
    }),
  );
  expect(rows).toHaveLength(4);
  for (const row of rows) {
    expect(row.gap).toBeLessThanOrEqual(10);
    expect(row.height).toBeLessThan(32);
  }
});

test("на широком экране изображение стоит вровень с eyebrow, без пустоты сверху (N1)", async ({ page }) => {
  await go(page, "/");
  const width = page.viewportSize()!.width;
  test.skip(width < 1024, "в одну колонку");
  const image = (await page.locator(`${section} [data-collage]`).boundingBox())!;
  const eyebrow = (await page.locator(`${section} .eyebrow`).boundingBox())!;
  expect(Math.abs(image.y - eyebrow.y)).toBeLessThanOrEqual(8);
});
