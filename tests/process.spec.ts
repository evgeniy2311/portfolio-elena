import { expect, test, type Page } from "@playwright/test";
import { go } from "./helpers/navigation";
import { isPinViewport, scrollToPin, settle } from "./helpers/scenes";

/*
 * Блок 10 «Как это работает» (design/brief.md, «Assembly Line»): пять состояний на реальной работе
 * yellow-trench (исходник → два пробных кадра → серия → сверка → готовая выдача). Для полной
 * выдачи 10–12 кадров — другая реальная серия, бордовое пальто, с явной подписью.
 * От 1024 × 600 сцена «липнет» и идёт по прокрутке; ниже — по времени (1,4 с на состояние),
 * только на экране, с точками и паузой; без JS и при reduced motion — пять статичных кадров.
 */
const section = "#process";
const names = ["source", "trial", "series", "check", "delivery"];
const steps = [
  ["Вы присылаете фото вещи", "2–3 фото: спереди, сзади и детали крупно. Напишите, для какой площадки вещь и кто её покупает."],
  ["Я делаю два кадра бесплатно", "Вы видите качество на своей вещи до оплаты."],
  ["Договариваемся о серии", "Выбираем сцены, образы и число кадров."],
  ["Собираю серию и сверяю", "Проверяю каждый кадр с оригиналом: крой, детали, цвет."],
  ["Отдаю готовые файлы", "Кадры в формате 3:4 для Wildberries и Ozon."],
];

const phase = (page: Page) => page.locator(`${section} [data-assembly]`).getAttribute("data-phase");
const sources = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((images) => images.map((image) => (image as HTMLImageElement).getAttribute("src") ?? ""));

test("пять состояний на реальных кадрах, шаги и подписи дословно, по порядку", async ({ page }) => {
  await go(page, "/");
  const block = page.locator(section);
  await expect(block).toHaveAttribute("data-ground", "paper");
  await expect(block.locator(".eyebrow")).toHaveText("Как работаем");
  await expect(block.locator("h2")).toHaveText("От фото вещи до готовой карточки");
  await expect(block.locator("h2 em")).toHaveText("до готовой карточки");
  const items = block.locator("[data-step]");
  await expect(items).toHaveCount(5);
  for (const [index, [title, text]] of steps.entries()) {
    await expect(items.nth(index).locator("h3")).toHaveText(title);
    await expect(items.nth(index).locator("p")).toHaveText(text);
  }
  await expect(block).not.toContainText("Lamoda");
  await expect(block.getByRole("link", { name: /Смотреть цены/ })).toHaveAttribute("href", "#prices");

  const layers = block.locator("[data-layer]");
  await expect(layers).toHaveCount(5);
  expect(await layers.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-layer")))).toEqual(names);
  expect(await sources(page, `${section} [data-layer=source] img`)).toEqual([expect.stringMatching(/yellow-trench\/source-2/)]);
  expect(await sources(page, `${section} [data-layer=trial] img`)).toEqual([expect.stringMatching(/yellow-trench\/frame-01/), expect.stringMatching(/yellow-trench\/frame-02/)]);
  expect(await sources(page, `${section} [data-layer=check] img`)).toEqual([expect.stringMatching(/yellow-trench\/frame-09/)]);
  await expect(block.locator("[data-layer=check] [data-detail]")).toHaveCount(3);
});

test("тренч: девять настоящих кадров не размножаются до двенадцати", async ({ page }) => {
  await go(page, "/");
  const trench = (await sources(page, `${section} [data-layer] img`)).filter((src) => /yellow-trench\/frame-/.test(src));
  const unique = new Set(trench.map((src) => src.match(/frame-\d+/)![0]));
  expect(trench.length).toBe(unique.size);
  expect(unique.size).toBeLessThanOrEqual(9);
  expect(await sources(page, `${section} [data-layer=series] img`)).toHaveLength(6);
});

test("готовая выдача: 12 разных кадров бордового пальто с явной подписью", async ({ page }) => {
  await go(page, "/");
  const delivery = page.locator(`${section} [data-layer=delivery]`);
  const frames = await sources(page, `${section} [data-layer=delivery] img`);
  expect(frames).toHaveLength(12);
  expect(frames.every((src) => /burgundy-coat-city\/frame-/.test(src))).toBe(true);
  expect(new Set(frames).size).toBe(12);
  await expect(delivery).toContainText("Пример полной воронки: бордовое пальто");
  // Нейтральная карточка: без логотипов и названий площадок.
  await expect(delivery).not.toContainText(/Wildberries|Ozon|WB/);
});

test.describe("сцена от 1024 px", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isPinViewport(page), "Сцена работает от 1024 × 600");
    await go(page, "/");
    await expect(page.locator(section)).toHaveAttribute("data-pinned", "on");
  });

  test("прокрутка ведёт пять состояний: видно одно, шаг слева активен", async ({ page }) => {
    const heights: number[] = [];
    for (const [index, name] of names.entries()) {
      await scrollToPin(page, section, (index + 0.6) / 5);
      await settle(page);
      // Одна неизменная коробка 3:4, и текущий слой занимает её по высоте (дизайн-QA D3).
      const fill = await page.locator(section).evaluate((element, layerName) => {
        const box = element.querySelector("[data-assembly]")!.getBoundingClientRect();
        const images = Array.from(element.querySelectorAll(`[data-layer=${layerName}] img, [data-layer=${layerName}] [data-detail]`)).map((node) => node.getBoundingClientRect());
        const device = element.querySelector(`[data-layer=${layerName}] figure > div`)?.getBoundingClientRect();
        const rects = layerName === "delivery" && device ? [device] : images;
        const top = Math.max(box.top, Math.min(...rects.map((rect) => rect.top)));
        const bottom = Math.min(box.bottom, Math.max(...rects.map((rect) => rect.bottom)));
        return { height: box.height, ratio: box.width / box.height, covered: (bottom - top) / box.height };
      }, name);
      heights.push(fill.height);
      expect(fill.ratio, name).toBeCloseTo(0.75, 2);
      expect(fill.covered, name).toBeGreaterThan(0.85);
      const opacities = await page.locator(`${section} [data-layer]`).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
      expect(opacities[index], name).toBeGreaterThan(0.95);
      expect(opacities.filter((value, i) => i !== index && value > 0.05), name).toEqual([]);
      await expect(page.locator(`${section} [data-step]`).nth(index)).toHaveAttribute("data-active", "");
    }
    // Сцена помещается в экран: низ кадра не уходит под край.
    const overflow = await page.locator(section).evaluate((element) => {
      const stage = element.querySelector("[data-stage]")!.getBoundingClientRect();
      const box = element.querySelector("[data-assembly]")!.getBoundingClientRect();
      return box.bottom - stage.bottom;
    });
    expect(overflow).toBeLessThanOrEqual(1);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
  });
});

test.describe("по времени ниже 1024 px", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(isPinViewport(page), "Ниже 1024 px или ниже 600 px высоты");
  });

  test("1,4 с на состояние по кругу, только на экране; точки 44 px; выбор шага останавливает цикл", async ({ page }) => {
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
    const stage = page.locator(`${section} [data-assembly]`);
    // Не на экране: состояние стоит.
    expect(await phase(page)).toBe("0");
    await page.waitForTimeout(1600);
    expect(await phase(page)).toBe("0");

    await stage.scrollIntoViewIfNeeded();
    const started = Date.now();
    await expect.poll(() => phase(page), { timeout: 4000, intervals: [100] }).toBe("1");
    const firstStep = Date.now() - started;
    expect(firstStep).toBeGreaterThan(900);
    expect(firstStep).toBeLessThan(2600);

    const dots = page.locator(`${section} [data-assembly-dots] button`);
    await expect(dots).toHaveCount(5);
    for (const box of await dots.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect))) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const pause = page.locator(`${section} [data-assembly-pause]`);
    const pauseBox = await pause.boundingBox();
    expect(pauseBox!.width).toBeGreaterThanOrEqual(44);
    expect(pauseBox!.height).toBeGreaterThanOrEqual(44);

    await dots.nth(3).click();
    expect(await phase(page)).toBe("3");
    await expect(dots.nth(3)).toHaveAttribute("aria-current", "step");
    await page.waitForTimeout(3000);
    expect(await phase(page)).toBe("3");
    await expect(pause).toHaveAccessibleName(/Продолжить/);
  });

  test("пауза и скрытая вкладка останавливают цикл", async ({ page }) => {
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
    await page.locator(`${section} [data-assembly]`).scrollIntoViewIfNeeded();
    await expect.poll(() => phase(page), { timeout: 4000 }).not.toBe("0");
    await page.locator(`${section} [data-assembly-pause]`).click();
    const paused = await phase(page);
    await page.waitForTimeout(3000);
    expect(await phase(page)).toBe(paused);

    await page.locator(`${section} [data-assembly-pause]`).click();
    await expect.poll(() => phase(page), { timeout: 4000 }).not.toBe(paused);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const hidden = await phase(page);
    await page.waitForTimeout(3000);
    expect(await phase(page)).toBe(hidden);
  });
});

for (const mode of ["reduced", "nojs"] as const) {
  test(`${mode === "reduced" ? "reduced motion" : "без JavaScript"}: пять статичных кадров и все шаги читаемы, ничего не движется`, async ({ browser }, testInfo) => {
    const viewport = testInfo.project.use.viewport ?? { width: 1440, height: 1000 };
    const context = await browser.newContext({ viewport, javaScriptEnabled: mode !== "nojs", reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    const page = await context.newPage();
    await go(page, "/");
    if (mode === "reduced") await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    const block = page.locator(section);
    await expect(block).not.toHaveAttribute("data-pinned", "on");
    const layers = await block.locator("[data-layer]").evaluateAll((elements) =>
      elements.map((element) => ({ opacity: Number(getComputedStyle(element).opacity), position: getComputedStyle(element).position, height: element.getBoundingClientRect().height })),
    );
    expect(layers).toHaveLength(5);
    for (const layer of layers) {
      expect(layer.opacity).toBe(1);
      expect(layer.position).not.toBe("absolute");
      expect(layer.height).toBeGreaterThan(80);
    }
    for (const opacity of await block.locator("[data-step]").evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)))) expect(opacity).toBe(1);
    const before = await block.locator("[data-assembly]").getAttribute("data-phase");
    await page.waitForTimeout(1800);
    expect(await block.locator("[data-assembly]").getAttribute("data-phase")).toBe(before);
    expect(await block.evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length)).toBe(0);
    await context.close();
  });
}
