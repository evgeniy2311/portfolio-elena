import { expect, test, type Page } from "@playwright/test";
import { formatPrice, packages, priceLabel } from "../lib/site";
import { go } from "./helpers/navigation";

/*
 * Цены «Fan + Live Preview»: шесть пакетов из copy.md, честные цены, живые примеры из настоящих
 * кадров, ручное листание до последнего кадра, без автозапуска при reduced motion и без JS.
 */

const section = "#prices";
const card = (page: Page, id: string) => page.locator(`${section} [data-package="${id}"]`);

function frameSources(page: Page, id: string) {
  return card(page, id).locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
}

test("данные: шесть пакетов, стабильные id, договорная цена отдельно от null", () => {
  expect(packages.map((item) => item.id)).toEqual(["cover", "short", "funnel", "color", "video", "season"]);
  for (const item of packages) expect(item.priceFrom).toBeNull();
  expect(formatPrice(null)).toBe("Цену назову по вашей задаче");
  expect(packages.filter((item) => item.negotiable).map((item) => item.id)).toEqual(["video", "season"]);
  expect(priceLabel({ priceFrom: null, negotiable: true })).toBe("Обсудим отдельно");
  expect(priceLabel({ priceFrom: 3000 })).toMatch(/^от 3\s000 ₽$/);
});

test("шесть карточек, «Самый полный», полная воронка 10–12 кадров, честные цены", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator(`${section} [data-card]`)).toHaveCount(6);
  await expect(page.locator(`${section} h3`)).toHaveText(["Главное фото", "Короткая серия", "Полная воронка", "Новый цвет", "Видео из фото", "Сезон и большие объёмы"]);
  await expect(card(page, "funnel")).toContainText("Самый полный");
  await expect(card(page, "funnel")).toContainText("10–12 кадров");
  await expect(page.locator(section)).not.toContainText("15–20");
  await expect(page.locator(section)).not.toContainText("Чаще всего берут");
  for (const id of ["cover", "short", "funnel", "color"]) await expect(card(page, id).locator("[data-price]")).toHaveText("Цену назову по вашей задаче");
  for (const id of ["video", "season"]) await expect(card(page, id).locator("[data-price]")).toHaveText("Обсудим отдельно");
  await expect(card(page, "season").locator("img")).toHaveCount(0);
  await expect(card(page, "season").locator("a.button-ghost")).toHaveText(/Обсудить сезон/);
  await expect(page.locator(section)).toContainText("Начните с двух бесплатных кадров. Пакет и цену подберём после.");
  await expect(page.locator(`${section} a.button:not(.button-ghost)`)).toHaveCount(1);
});

test("примеры — настоящие кадры: 12 разных у воронки, 5 у серии, 4 цвета", async ({ page }) => {
  await go(page, "/");
  const funnel = await frameSources(page, "funnel");
  expect(funnel).toHaveLength(12);
  expect(new Set(funnel).size).toBe(12);
  for (const src of funnel) expect(src).toMatch(/burgundy-coat-city\/frame-(0[1-9]|1[0-2])/);
  const short = await frameSources(page, "short");
  expect(short).toHaveLength(5);
  for (const src of short) expect(src).toMatch(/beige-windbreaker\/frame-0[1-5]/);
  const colors = await frameSources(page, "color");
  expect(colors).toHaveLength(4);
  for (const src of colors) expect(src).toMatch(/longsleeve-colors\/frame-0[1-4]/);
  expect((await frameSources(page, "cover"))[0]).toMatch(/yellow-trench\/frame-01/);
  expect((await frameSources(page, "video"))[0]).toMatch(/yellow-trench\/frame-02/);
});

test("кнопки и клавиатура доходят до последнего кадра воронки", async ({ page }) => {
  await go(page, "/");
  const funnel = card(page, "funnel");
  await expect(funnel.locator("[data-preview][data-ready]")).toHaveCount(1, { timeout: 30_000 });
  await funnel.scrollIntoViewIfNeeded();
  const pause = funnel.locator("[data-loop-pause]");
  if (await pause.count()) await pause.click();
  const counter = funnel.locator("[data-counter]");
  const start = Number((await counter.innerText()).split("/")[0]);
  const next = funnel.getByRole("button", { name: "Следующий кадр" });
  for (let step = start; step < 12; step += 1) await next.click();
  await expect(counter).toHaveText("12 / 12");
  await expect(funnel.locator("[data-active] img")).toHaveAttribute("src", /frame-12/);
  await funnel.locator("[role=group]").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText("11 / 12");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText("1 / 12");
});

test("воронка листается сама на экране, «Пауза» останавливает", async ({ page }) => {
  await go(page, "/");
  const funnel = card(page, "funnel");
  await expect(funnel.locator("[data-loop-pause]")).toHaveCount(1, { timeout: 30_000 });
  await funnel.locator("h3").scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  const counter = funnel.locator("[data-counter]");
  const first = await counter.innerText();
  await expect.poll(() => counter.innerText(), { timeout: 6000 }).not.toBe(first);
  await funnel.locator("[data-loop-pause]").click();
  await page.mouse.move(1, 1);
  const stopped = await counter.innerText();
  await page.waitForTimeout(2200);
  expect(await counter.innerText()).toBe(stopped);
});

test("короткая серия: указатель выбирает кадр, касание листает", async ({ page, isMobile }) => {
  await go(page, "/");
  const short = card(page, "short");
  await expect(short.locator("[data-preview][data-ready]")).toHaveCount(1, { timeout: 30_000 });
  await short.scrollIntoViewIfNeeded();
  const frames = short.locator("[role=group]");
  const counter = short.locator("[data-counter]");
  await page.waitForTimeout(600);
  const box = (await frames.boundingBox())!;
  if (isMobile) {
    await frames.tap();
    await expect(counter).toHaveText("2 / 5");
    await frames.tap();
    await expect(counter).toHaveText("3 / 5");
    return;
  }
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height / 2, { steps: 5 });
  await expect(counter).toHaveText("5 / 5");
  await page.mouse.move(box.x + box.width * 0.05, box.y + box.height / 2, { steps: 5 });
  await expect(counter).toHaveText("1 / 5");
});

test("reduced motion: первый кадр, без автозапуска, ручное листание работает", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  const funnel = card(page, "funnel");
  await expect(funnel.locator("[data-preview][data-ready]")).toHaveCount(1, { timeout: 30_000 });
  await funnel.scrollIntoViewIfNeeded();
  await expect(funnel.locator("[data-loop-pause]")).toHaveCount(0);
  await page.waitForTimeout(2200);
  await expect(funnel.locator("[data-counter]")).toHaveText("1 / 12");
  await funnel.getByRole("button", { name: "Следующий кадр" }).click();
  await expect(funnel.locator("[data-counter]")).toHaveText("2 / 12");
});

test("без JavaScript: первый кадр виден, кадры листаются обычной прокруткой", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await go(page, "/");
  const frames = card(page, "funnel").locator("[role=group]");
  expect(await frames.evaluate((element) => getComputedStyle(element).overflowX)).toBe("auto");
  expect(await frames.evaluate((element) => element.scrollWidth > element.clientWidth * 11)).toBe(true);
  await expect(card(page, "funnel").locator("img").first()).toBeVisible();
  await expect(card(page, "funnel").locator("[data-counter]")).toHaveCount(0);
  await context.close();
});

test("карточки появляются, как только сетка зашла на экран (дизайн-QA D6)", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
  const first = page.locator(`${section} [data-card]`).first();
  const viewport = page.viewportSize()!;
  // Верх сетки на 75 % высоты окна: видна только первая полоса карточки.
  await page.evaluate((offset) => {
    const grid = document.querySelector("#prices ul")!;
    window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - offset, behavior: "instant" });
  }, viewport.height * 0.75);
  await expect.poll(() => first.evaluate((element) => Number(getComputedStyle(element).opacity)), { timeout: 3000 }).toBeGreaterThan(0.95);
});

test("сезон: типографическая обложка 3:4 на месте примера, затем заголовок, цена и кнопка (D7)", async ({ page }) => {
  await go(page, "/");
  const season = card(page, "season");
  const cover = season.locator("[aria-hidden=true]").first();
  await expect(cover).toContainText("Сезон");
  await expect(cover).toContainText("Коллекции · Долгие проекты · Большие объёмы");
  const box = (await cover.boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(0.75, 1);
  const order = await season.evaluate((element) => {
    const y = (selector: string) => element.querySelector(selector)!.getBoundingClientRect().top;
    return [y("[aria-hidden=true]"), y("h3"), y("[data-price]"), y("a")];
  });
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  // Между текстом и ценой нет пустоты: раньше там было ~400 px.
  const gap = await season.evaluate((element) => {
    const includes = element.querySelector("h3 + p")!.getBoundingClientRect();
    return element.querySelector("[data-price]")!.getBoundingClientRect().top - includes.bottom;
  });
  expect(gap).toBeLessThan(120);
});

test("под сеткой фраза и основная кнопка стоят рядом (D23)", async ({ page }) => {
  await go(page, "/");
  const text = page.locator(`${section} > .shell > div:last-child p`);
  const button = page.locator(`${section} > .shell > div:last-child a.button`);
  const [t, b] = [(await text.boundingBox())!, (await button.boundingBox())!];
  if (b.y < t.y + t.height) expect(b.x - (t.x + t.width)).toBeLessThanOrEqual(40);
  else expect(Math.abs(b.x - t.x)).toBeLessThan(2);
});
