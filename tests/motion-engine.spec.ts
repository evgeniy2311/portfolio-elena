import { expect, test, type Page } from "@playwright/test";
import { SETTLE, segmentOf, smoothStep } from "../components/fx/progress";
import { go } from "./helpers/navigation";
import { framesDuring, instrument, isPinViewport, listenerCounts, pinGeometry, readVar, scrollToPin, settle } from "./helpers/scenes";

/*
 * Общий движок прокрутки: один ticker, сглаживание с поправкой на частоту кадров,
 * прогресс по фактическому sticky-ходу, сегменты, cleanup при повторном монтировании.
 */

/**
 * Слушатель visibilitychange держит только ticker, пока у него есть подписчики, поэтому его число
 * зависит от момента замера: проверяется, что он не больше одного, а остальные сравниваются точно.
 */
async function stableCounts(page: Page) {
  const counts = await listenerCounts(page);
  expect(counts["document:visibilitychange"] ?? 0).toBeLessThanOrEqual(1);
  delete counts["document:visibilitychange"];
  return counts;
}

/** Ждёт, пока сглаживание догонит и общий цикл остановится (подписчиков ticker нет). */
async function idle(page: Page) {
  await expect.poll(() => framesDuring(page, 300), { timeout: 8000 }).toBeLessThanOrEqual(1);
}

/**
 * Бесконечные циклы (стена первого экрана, лента категорий) законно просят кадры, пока видны.
 * Для проверок покоя движка их ставят на паузу их же кнопками ([data-loop-pause]).
 */
async function pauseLoops(page: Page) {
  await expect(page.locator("[data-wall-pause]")).toHaveCount(1, { timeout: 30_000 });
  await page.evaluate(() => {
    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-loop-pause][aria-pressed='false']")) button.click();
  });
  await expect(page.locator("[data-loop-pause][aria-pressed='false']")).toHaveCount(0);
}

const desktopOnly = (page: Page) => test.skip(!isPinViewport(page), "«Липкие» сцены работают от 1024 px и 600 px высоты");

test.describe("математика", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Чистые функции, ширина экрана не важна");
  });

  test("сегменты 0/1/7: без NaN, первый и последний номер", () => {
    for (const p of [0, 0.3, 1, -1, 2, Number.NaN]) {
      expect(segmentOf(p, 0)).toEqual({ k: 0, t: 0 });
      const one = segmentOf(p, 1);
      expect(one.k).toBe(0);
      expect(Number.isNaN(one.t)).toBe(false);
      const seven = segmentOf(p, 7);
      expect(seven.k).toBeGreaterThanOrEqual(0);
      expect(seven.k).toBeLessThanOrEqual(6);
      expect(Number.isNaN(seven.t)).toBe(false);
    }
    expect(segmentOf(0, 7)).toEqual({ k: 0, t: 0 });
    expect(segmentOf(1, 7).k).toBe(6);
    expect(segmentOf(1, 7).t).toBe(1);
    expect(segmentOf(0.5, 1)).toEqual({ k: 0, t: 0.5 });
    expect(segmentOf(3.5 / 7, 7).k).toBe(3);
    expect(segmentOf(3.5 / 7, 7).t).toBeCloseTo(0.5, 6);
  });

  test("30, 60 и 120 fps: одна скорость сглаживания и точная остановка", () => {
    const run = (fps: number, ms: number) => {
      let value = 0;
      const frames = Math.round((ms * fps) / 1000);
      for (let index = 0; index < frames; index += 1) value = smoothStep(value, 1, 1000 / fps);
      return value;
    };
    for (const ms of [100, 250, 500]) {
      const reference = run(60, ms);
      expect(Math.abs(run(30, ms) - reference), `${ms} мс, 30 fps`).toBeLessThan(0.02);
      expect(Math.abs(run(120, ms) - reference), `${ms} мс, 120 fps`).toBeLessThan(0.02);
    }
    // 0,14 за кадр при 60 fps.
    expect(smoothStep(0, 1, 1000 / 60)).toBeCloseTo(0.14, 6);
    // Близко к цели — встаёт ровно в цель.
    expect(smoothStep(1 - SETTLE / 2, 1, 16)).toBe(1);
    expect(run(60, 2000)).toBe(1);
    expect(smoothStep(Number.NaN, 0.4, 16)).toBe(0.4);
  });
});

test.describe("сцены страницы", () => {
  test("старые [data-pin]: 0 там, где слой прилипает, 1 там, где отлипает", async ({ page }) => {
    desktopOnly(page);
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
    for (const selector of ["#services", "section[aria-labelledby=accuracy-title]", "#transform"]) {
      const geometry = await pinGeometry(page, selector);
      expect(geometry.sticky, selector).toBe(true);
      await scrollToPin(page, selector, 0);
      await scrollToPin(page, selector, 1);
      await scrollToPin(page, selector, 0.5);
      // Ровно в точке отлипания и на 1 px дальше прогресс уже 1.
      await page.evaluate((y) => window.scrollTo({ top: y + 1, behavior: "instant" }), geometry.end);
      await expect.poll(async () => Number(await readVar(page, selector, "--p"))).toBe(1);
    }
  });

  test("лента: панели получают --pp, последняя доезжает до 1", async ({ page }) => {
    desktopOnly(page);
    await go(page, "/");
    await scrollToPin(page, "#transform", 1);
    const panels = page.locator("#transform [data-panel]");
    const count = await panels.count();
    test.skip(count === 0, "Панели ленты размечаются при переделке блока (этап 8)");
    await expect.poll(async () => Number(await panels.last().evaluate((element) => getComputedStyle(element).getPropertyValue("--pp")))).toBeGreaterThan(0.95);
  });

  test("ниже 1024 px сцены не «липнут»", async ({ page }) => {
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
    const pinned = page.locator("[data-pin][data-pinned]");
    if (isPinViewport(page)) await expect(pinned).toHaveCount(await page.locator("[data-pin]").count());
    else await expect(pinned).toHaveCount(0);
    if (isPinViewport(page)) {
      await page.setViewportSize({ width: page.viewportSize()!.width, height: 560 });
      await expect(pinned).toHaveCount(0);
    }
  });

  test("сегменты: --k, --t и data-active у [data-segment]", async ({ page }) => {
    desktopOnly(page);
    // Синтетическая сцена из 7 сегментов в конце страницы: до гидрации, React 19 пропускает чужие узлы body.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const section = document.createElement("section");
        section.id = "qa-segments";
        section.setAttribute("data-pin", "");
        section.setAttribute("data-segments", "7");
        section.style.cssText = "height: 600vh; position: relative";
        const stage = document.createElement("div");
        stage.setAttribute("data-stage", "");
        stage.style.cssText = "position: sticky; top: 0; height: 100vh";
        for (let index = 0; index < 7; index += 1) stage.append(Object.assign(document.createElement("div"), { textContent: `сегмент ${index}` }));
        for (const child of Array.from(stage.children)) child.setAttribute("data-segment", "");
        section.append(stage);
        document.body.append(section);
      });
    });
    await go(page, "/");
    await expect(page.locator("#qa-segments")).toHaveAttribute("data-pinned", "on");
    for (const [progress, k] of [[0, 0], [0.5, 3], [1, 6]] as const) {
      await scrollToPin(page, "#qa-segments", progress);
      await expect.poll(() => readVar(page, "#qa-segments", "--k")).toBe(String(k));
      await expect(page.locator("#qa-segments [data-segment][data-active]")).toHaveCount(1);
      await expect(page.locator("#qa-segments [data-segment]").nth(k)).toHaveAttribute("data-active", "");
    }
    expect(Number(await readVar(page, "#qa-segments", "--t"))).toBe(1);
  });
});

test.describe("один ticker и cleanup", () => {
  test("в покое кадры не идут; прокрутка запускает и останавливает цикл", async ({ page }) => {
    await instrument(page);
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
    await pauseLoops(page);
    await page.waitForTimeout(800);
    expect(await framesDuring(page, 500)).toBeLessThanOrEqual(1);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1200);
    expect(await framesDuring(page, 500)).toBeLessThanOrEqual(1);
  });

  test("повторное монтирование, resize и visibilitychange не добавляют слушателей и циклов", async ({ page }) => {
    await instrument(page);
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
    await pauseLoops(page);
    await idle(page);
    const initial = await stableCounts(page);

    // Клиентский переход на архив и обратно: ScrollFx размонтируется и монтируется заново.
    await page.locator("header nav a[href$='/works'], header nav a[href$='/works/']").first().click({ force: true }).catch(async () => {
      await page.evaluate(() => (document.querySelector("header a[href*='/works']") as HTMLAnchorElement).click());
    });
    // Первый заход на страницу dev-сервер компилирует, под нагрузкой это дольше 5 с.
    await expect(page.locator("main h1")).toContainText("вещей", { timeout: 30_000 });
    await page.locator("header a.wordmark").click();
    await expect(page.locator("#services")).toHaveCount(1, { timeout: 30_000 });
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
    await pauseLoops(page);
    await idle(page);
    expect(await stableCounts(page)).toEqual(initial);

    await page.setViewportSize({ width: page.viewportSize()!.width - 40, height: page.viewportSize()!.height });
    await idle(page);
    expect(await stableCounts(page)).toEqual(initial);

    // Скрытая вкладка: кадров нет, после возврата цикл снова работает.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.mouse.wheel(0, 500);
    expect(await framesDuring(page, 400)).toBeLessThanOrEqual(1);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // Счёт кадров начинается до прокрутки: у первого экрана нет сцен со сглаживанием, и движку
    // может хватить одного кадра, который иначе прошёл бы до начала замера.
    const counted = framesDuring(page, 400);
    await page.mouse.wheel(0, 300);
    expect(await counted).toBeGreaterThan(0);
    await idle(page);
    expect(await stableCounts(page)).toEqual(initial);
  });

  test("reduced motion включён во время работы: data-fx снят, циклы стоят, всё видно", async ({ page }) => {
    await instrument(page);
    await go(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
    test.skip((await page.locator("html").getAttribute("data-fx")) !== "on", "Движение уже выключено");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).not.toHaveAttribute("data-fx", "on");
    await page.mouse.wheel(0, 800);
    expect(await framesDuring(page, 400)).toBeLessThanOrEqual(1);
    await settle(page);
    for (const opacity of await page.locator("main figure, [data-reveal]").evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)))) {
      expect(opacity).toBe(1);
    }
    for (const value of await page.locator("[data-pin], [data-view]").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).getPropertyValue("--p").trim()))) {
      expect(value).toBe("1");
    }
    await expect(page.locator("[data-pinned]")).toHaveCount(0);
  });
});
