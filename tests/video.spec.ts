import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { go, isPages } from "./helpers/navigation";
import { qaVideoRoute } from "./fixtures/site";

/*
 * Блок 12 «Видео из фото» (design/brief.md, «Letterbox»): после сверки деталей, noir-панель на фоне surface.
 * Сейчас настоящих роликов нет: четыре постера из media.md с плашкой «Ролики скоро», без video и значков
 * воспроизведения. Ролики проверяются на стенде состояний (NEXT_PUBLIC_QA_FIXTURE=videos).
 */
const section = "#video";
const posters = [/yellow-trench\/frame-02/, /burgundy-coat-city\/frame-03/, /brown-pea-coat\/frame-14/, /burgundy-coat-city\/frame-09/];
const qaOrigin = process.env.PLAYWRIGHT_QA_URL ?? "http://127.0.0.1:3001";

test("сейчас: четыре настоящих постера, «Ролики скоро», без video, значков и неподтверждённых строк", async ({ page }) => {
  await go(page, "/");
  const block = page.locator(section);
  await expect(block.locator(".eyebrow")).toHaveText("Новое: видео из фото");
  await expect(block.locator("h2")).toHaveText("Оживлю ваши фото в короткое видео");
  await expect(block.locator("h2 em")).toHaveText("в короткое видео");
  await expect(block).toContainText("Модель двигается, ткань живёт, а вещь остаётся той же.");
  await expect(block.getByRole("link", { name: /Хочу видео из фото/ })).toHaveCount(1);
  const tiles = block.locator("[data-video-tile]");
  await expect(tiles).toHaveCount(4);
  for (const [index, pattern] of posters.entries()) {
    expect(await tiles.nth(index).locator("img").getAttribute("src")).toMatch(pattern);
    await expect(tiles.nth(index)).toContainText("Ролики скоро");
  }
  await expect(block.locator("video")).toHaveCount(0);
  await expect(block.locator("[data-video-toggle], svg[data-play]")).toHaveCount(0);
  await expect(block).not.toContainText("Ролики сделаны");
  await expect(block).not.toContainText("Подойдёт для карточки");
});

test("порядок accuracy → video → process; noir-панель на surface, тёмные фоны не соприкасаются", async ({ page }) => {
  await go(page, "/");
  const order = await page.locator("main > section").evaluateAll((sections) => sections.map((element) => (element.querySelector("#accuracy-title") ? "accuracy" : element.id)));
  const index = order.indexOf("video");
  expect(order[index - 1]).toBe("accuracy");
  expect(order[index + 1]).toBe("process");
  const block = page.locator(section);
  await expect(block).toHaveAttribute("data-ground", "surface");
  expect(await block.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(236, 229, 219)");
  expect(await block.locator("[data-video-panel]").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(26, 24, 23)");
  // Акцент заголовка на noir — шампань, не вино (контраст 1,56 запрещён).
  expect(await block.locator("h2 em").evaluate((element) => getComputedStyle(element).color)).toBe("rgb(217, 184, 146)");
  // На любой ширине панель отстоит от краёв окна на --gutter и скруглена: не во всю ширину рядом с noir-блоком выше.
  const panel = await block.locator("[data-video-panel]").evaluate((element) => {
    const box = element.getBoundingClientRect();
    const gutter = parseFloat(getComputedStyle(element.parentElement!).paddingLeft);
    return { left: box.left, right: window.innerWidth - box.right, gutter, radius: getComputedStyle(element).borderTopLeftRadius };
  });
  expect(panel.left).toBeGreaterThanOrEqual(panel.gutter - 1);
  expect(panel.right).toBeGreaterThanOrEqual(panel.gutter - 1);
  expect(panel.radius).toBe("12px");
});

test("раскладка: 2 × 2 на компьютере, на телефоне лента 88 % с привязкой и точками 44 px", async ({ page }) => {
  await go(page, "/");
  const tiles = page.locator(`${section} [data-video-tile]`);
  await tiles.first().scrollIntoViewIfNeeded();
  const boxes = await tiles.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect));
  const width = page.viewportSize()!.width;
  if (width >= 1024) {
    expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(2);
    expect(boxes[2].top).toBeGreaterThan(boxes[0].bottom - 2);
    expect(Math.abs(boxes[0].left - boxes[2].left)).toBeLessThan(2);
    for (const box of boxes) expect(box.height / box.width).toBeCloseTo(4 / 3, 1);
  } else if (width < 768) {
    const row = page.locator(`${section} [data-video-row]`);
    const rowWidth = await row.evaluate((element) => element.clientWidth);
    expect(boxes[0].width / rowWidth).toBeCloseTo(0.88, 1);
    expect(await row.evaluate((element) => getComputedStyle(element).scrollSnapType)).toContain("x");
    const dots = page.locator(`${section} [data-video-dots] button`);
    await expect(dots).toHaveCount(4);
    for (const box of await dots.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect))) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await dots.nth(2).click();
    await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(boxes[0].width);
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("Letterbox: полосы закрывают постер до появления и раскрываются от середины", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
  const bar = page.locator(`${section} [data-video-tile] [data-bar]`).first();
  await expect.poll(() => bar.evaluate((element) => getComputedStyle(element).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
  await page.locator(`${section} [data-video-tile]`).first().scrollIntoViewIfNeeded();
  await expect.poll(() => bar.evaluate((element) => getComputedStyle(element).transform)).toBe("matrix(1, 0, 0, 0, 0, 0)");
});

for (const mode of ["reduced", "nojs"] as const) {
  test(`${mode === "reduced" ? "reduced motion" : "без JavaScript"}: постеры видны, полосы раскрыты`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: mode !== "nojs", reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    const page = await context.newPage();
    await go(page, "/");
    for (const transform of await page.locator(`${section} [data-bar]`).evaluateAll((elements) => elements.map((element) => getComputedStyle(element).transform)))
      expect(transform).toBe("matrix(1, 0, 0, 0, 0, 0)");
    await expect(page.locator(`${section} [data-video-tile]`)).toHaveCount(4);
    await context.close();
  });
}

test("постеры загружаются без 404", async ({ page }) => {
  const missing: string[] = [];
  page.on("response", (response) => {
    if (response.status() === 404) missing.push(response.url());
  });
  await go(page, "/");
  const images = page.locator(`${section} [data-video-tile] img`);
  await images.first().scrollIntoViewIfNeeded();
  for (let index = 0; index < 4; index += 1) {
    await images.nth(index).evaluate((element: HTMLImageElement) => (element.loading = "eager"));
    await expect.poll(() => images.nth(index).evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  expect(missing).toEqual([]);
});

/* ---------- Стенд состояний: настоящие HTML video (только dev, не Pages) ---------- */

async function serveFixtures(page: Page) {
  await page.route(`**${qaVideoRoute}-*`, (route) => {
    const ext = route.request().url().endsWith(".webm") ? "webm" : "mp4";
    return route.fulfill({ path: path.join(__dirname, `fixtures/qa-video.${ext}`), contentType: `video/${ext}` });
  });
}

const playing = (page: Page) =>
  page.locator(`${section} video`).evaluateAll((videos) => videos.filter((video) => !(video as HTMLVideoElement).paused).length);

test.describe("стенд с роликами", () => {
  test.skip(() => isPages, "Стенд состояний работает только как dev-сервер");
  test.use({ baseURL: qaOrigin });

  test("видимый блок: ролики muted/loop/playsinline/preload=none, играют не больше 1 на телефоне и 2 на компьютере", async ({ page }) => {
    await serveFixtures(page);
    await page.goto("/");
    const videos = page.locator(`${section} video`);
    await expect(videos).toHaveCount(4);
    for (const video of await videos.all()) {
      expect(await video.evaluate((element: HTMLVideoElement) => ({ muted: element.muted, loop: element.loop, inline: element.playsInline, preload: element.getAttribute("preload"), poster: element.poster }))).toMatchObject({
        muted: true,
        loop: true,
        inline: true,
        preload: "none",
        poster: expect.stringMatching(/\/works\//),
      });
    }
    await expect(page.locator(section)).toContainText("Ролики сделаны из моих готовых кадров. Одежда в них не менялась.");
    await expect(page.locator(section)).not.toContainText("Ролики скоро");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    await page.locator(`${section} [data-video-tile]`).first().scrollIntoViewIfNeeded();
    const limit = page.viewportSize()!.width < 768 ? 1 : 2;
    await expect.poll(() => playing(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(500);
    expect(await playing(page)).toBeLessThanOrEqual(limit);

    // Кнопка паузы 44 px останавливает ролик, и он не включается сам снова.
    const tile = page.locator(`${section} [data-video-tile]`).first();
    const toggle = tile.locator("[data-video-toggle]");
    const box = await toggle.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect.poll(() => tile.locator("video").evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
    await toggle.click();
    await expect.poll(() => tile.locator("video").evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
    await page.waitForTimeout(600);
    expect(await tile.locator("video").evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);

    // Блок ушёл с экрана: всё на паузе.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => playing(page)).toBe(0);
  });

  test("вкладка скрыта: ролики на паузе", async ({ page }) => {
    await serveFixtures(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    await page.locator(`${section} [data-video-tile]`).first().scrollIntoViewIfNeeded();
    await expect.poll(() => playing(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => playing(page)).toBe(0);
  });

  test("reduced motion: без автозапуска, ролик включается кнопкой", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await serveFixtures(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    const tile = page.locator(`${section} [data-video-tile]`).first();
    await tile.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(await playing(page)).toBe(0);
    await tile.locator("[data-video-toggle]").click();
    await expect.poll(() => tile.locator("video").evaluate((element: HTMLVideoElement) => element.paused), { timeout: 10_000 }).toBe(false);
  });

  test("браузер запретил автозапуск: постер и кнопка, без ошибок в консоли", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function () {
        return Promise.reject(new DOMException("blocked", "NotAllowedError"));
      };
    });
    await serveFixtures(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    const tile = page.locator(`${section} [data-video-tile]`).first();
    await tile.scrollIntoViewIfNeeded();
    await expect(tile).toHaveAttribute("data-state", "blocked");
    await expect(tile.locator("[data-video-toggle]")).toHaveAccessibleName(/Смотреть ролик/);
    expect(await playing(page)).toBe(0);
    expect(errors.filter((text) => !/Download the React DevTools|HMR|Fast Refresh/.test(text))).toEqual([]);
  });

  test("прерванный запуск (AbortError) не блокирует плитку; вид следует событиям play/pause", async ({ page }) => {
    // Первый запуск каждого ролика прерывается, как при play() сразу перед pause(); дальше — настоящий play.
    await page.addInitScript(() => {
      const original = HTMLMediaElement.prototype.play;
      const aborted = new WeakSet<HTMLMediaElement>();
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        if (aborted.has(this)) return original.call(this);
        aborted.add(this);
        return Promise.reject(new DOMException("The play() request was interrupted by a call to pause().", "AbortError"));
      };
    });
    await serveFixtures(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    const tile = page.locator(`${section} [data-video-tile]`).first();
    const video = tile.locator("video");
    await tile.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    expect(await page.locator(`${section} [data-video-tile][data-state="blocked"]`).count()).toBe(0);

    // Ролик запустили мимо компонента: плитка показывает «играет» и кнопку паузы.
    await video.evaluate((element: HTMLVideoElement) => element.play());
    await expect(tile).toHaveAttribute("data-state", "playing");
    await expect(tile.locator("[data-video-toggle]")).toHaveAccessibleName(/Пауза/);
    // Браузер сам поставил паузу: плитка не остаётся в «играет».
    await video.evaluate((element: HTMLVideoElement) => element.pause());
    await expect(tile).not.toHaveAttribute("data-state", "playing");
    await expect(tile.locator("[data-video-toggle]")).toHaveAccessibleName(/Смотреть ролик/);
  });
});
