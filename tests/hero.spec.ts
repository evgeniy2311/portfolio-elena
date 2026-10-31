import { expect, test, type Page } from "@playwright/test";
import { heroWall } from "../components/blocks/hero/data";
import { go } from "./helpers/navigation";

/*
 * Первый экран «Conveyor Loom»: состав и ритм стены, копии для бесшовного цикла, пауза,
 * остановка вне экрана и в скрытой вкладке, первый экран телефона, «крупный план» и кнопки.
 */

const wall = "[data-wall]";

/** Смещения дорожек колонок (px) из их transform. */
function offsets(page: Page) {
  return page.locator(`${wall} [data-track]`).evaluateAll((tracks) => tracks.map((track) => new DOMMatrixReadOnly(getComputedStyle(track).transform).m42));
}

async function moved(page: Page, ms: number) {
  const before = await offsets(page);
  await page.waitForTimeout(ms);
  const after = await offsets(page);
  return Math.max(...after.map((value, index) => Math.abs(value - before[index])));
}

async function ready(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
}

test.describe("данные стены", () => {
  test("12 разных работ по таблице арт-директора, блузка кадром 08", () => {
    const slugs = heroWall.flat().map((tile) => tile.slug);
    expect(slugs).toEqual([
      "yellow-trench", "black-coat-evening", "grey-shearling", "pink-longsleeve",
      "puffer-jacket", "burgundy-coat-city", "white-wrap-blouse", "mint-windbreaker",
      "long-sheepskin", "longsleeve-colors", "beige-windbreaker", "brown-longsleeve",
    ]);
    expect(new Set(slugs).size).toBe(12);
    expect(slugs).not.toContain("brown-coat-three-looks");
    const blouse = heroWall.flat().find((tile) => tile.slug === "white-wrap-blouse")!;
    expect(blouse.image.src).toMatch(/white-wrap-blouse\/frame-08\.webp$/);
    expect(heroWall.flat().find((tile) => tile.slug === "pink-longsleeve")!.tone).toBe("light");
  });

  test("ритм тонов: нет двух light или accent подряд, в том числе на стыке повтора", () => {
    let lights = 0;
    for (const column of heroWall) {
      const tones = column.map((tile) => tile.tone);
      const looped = [...tones, tones[0]];
      for (let index = 1; index < looped.length; index += 1) {
        const pair = [looped[index - 1], looped[index]];
        expect(pair[0] === pair[1] && (pair[0] === "light" || pair[0] === "accent"), pair.join("+")).toBe(false);
      }
      const columnLights = tones.filter((tone) => tone === "light").length;
      expect(columnLights).toBeLessThanOrEqual(1);
      lights += columnLights;
    }
    expect(lights).toBeLessThanOrEqual(3);
  });
});

test("копии стены скрыты от чтения, у работ есть alt", async ({ page }) => {
  await go(page, "/");
  const copies = page.locator(`${wall} [data-copy="1"]`);
  await expect(copies).toHaveCount(3);
  for (const alt of await copies.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("alt")))) expect(alt).toBe("");
  for (const copy of await copies.evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-hidden")))) expect(copy).toBe("true");
  const originals = page.locator(`${wall} [data-copy="0"] img`);
  await expect(originals).toHaveCount(12);
  for (const alt of await originals.evaluateAll((images) => images.map((image) => image.getAttribute("alt") ?? ""))) expect(alt.length).toBeGreaterThan(5);
  await expect(page.getByRole("group", { name: "Мои работы: кадры для карточек одежды" })).toHaveCount(1);
});

test("колонки едут в разные стороны; «Пауза» останавливает, «Пуск» продолжает", async ({ page }) => {
  await go(page, "/");
  await ready(page);
  await expect(page.locator(wall)).toHaveAttribute("data-loom", "js");
  const before = await offsets(page);
  await page.waitForTimeout(700);
  const after = await offsets(page);
  const deltas = after.map((value, index) => value - before[index]);
  // Вверх / вниз / вверх (с учётом возможного перехода через стык — по модулю он короче половины копии).
  expect(deltas[0]).toBeLessThan(0);
  expect(deltas[1]).toBeGreaterThan(0);
  expect(deltas[2]).toBeLessThan(0);

  const pause = page.locator(wall).getByRole("button", { name: "Пауза стены работ" });
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  const box = await pause.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await pause.click();
  const play = page.locator(wall).getByRole("button", { name: "Пуск стены работ" });
  await expect(play).toHaveAttribute("aria-pressed", "true");
  expect(await moved(page, 500)).toBeLessThan(0.5);
  await play.click();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  expect(await moved(page, 500)).toBeGreaterThan(2);
});

test("вне экрана и в скрытой вкладке стена стоит, при возвращении едет", async ({ page }) => {
  await go(page, "/");
  await ready(page);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: "instant" }));
  await page.waitForTimeout(400);
  expect(await moved(page, 500)).toBeLessThan(0.5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  // Под нагрузкой кадры редкие (dt ограничен 100 мс), поэтому ждём, пока стена снова поедет, а не меряем один отрезок.
  await expect.poll(() => moved(page, 500), { timeout: 10_000 }).toBeGreaterThan(2);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(200);
  expect(await moved(page, 500)).toBeLessThan(0.5);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => moved(page, 500), { timeout: 10_000 }).toBeGreaterThan(2);
});

test("reduced motion: одна неподвижная копия в том же порядке", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  await ready(page);
  await expect(page.locator(`${wall} [data-copy="1"]`).first()).toBeHidden();
  expect(await moved(page, 600)).toBe(0);
  await expect(page.locator(`${wall} [data-wall-pause]`)).toBeHidden();
  const order = await page.locator(`${wall} [data-copy="0"] figure`).evaluateAll((figures) => figures.map((figure) => figure.getAttribute("data-slug")));
  expect(order).toEqual(heroWall.flat().map((tile) => tile.slug));
});

test("без JavaScript едет CSS-цикл, текст читается", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await go(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const animation = await page.locator(`${wall} [data-track]`).first().evaluate((track) => getComputedStyle(track).animationName);
  expect(animation).toMatch(/loom-up/);
  await context.close();
});

test("первый экран: стена и H1 видны; «крупный план» не заходит на текст", async ({ page }) => {
  await go(page, "/");
  const viewport = page.viewportSize()!;
  const heading = await page.locator("h1").boundingBox();
  const wallBox = await page.locator(wall).boundingBox();
  if (viewport.width < 1024) {
    // Телефон и планшет: полоса стены над текстом, обе части в первом экране, «крупного плана» нет.
    expect(wallBox!.y).toBeLessThan(viewport.height);
    expect(wallBox!.y + wallBox!.height).toBeLessThanOrEqual(heading!.y + 1);
    expect(heading!.y + heading!.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator("[data-callout]")).toBeHidden();
    return;
  }
  // H1 не длиннее четырёх строк, кнопки в первом экране.
  const lines = await page.locator("h1").evaluate((element) => Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)));
  expect(lines).toBeLessThanOrEqual(4);
  await expect(page.locator("[data-hero-copy] a").first()).toBeInViewport({ ratio: 1 });
  expect(heading!.y + heading!.height).toBeLessThanOrEqual(viewport.height);
  const callout = page.locator("[data-callout]");
  await expect(callout).toBeVisible();
  await expect(callout).toContainText("Сверка деталей");
  const calloutBox = (await callout.boundingBox())!;
  const copyBoxes = await page.locator("[data-hero-copy] > *, [data-hero-copy] a").evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect),
  );
  for (const box of copyBoxes) {
    const overlaps = box.x < calloutBox.x + calloutBox.width && box.x + box.width > calloutBox.x && box.y < calloutBox.y + calloutBox.height && box.y + box.height > calloutBox.y;
    expect(overlaps).toBe(false);
  }
});

test("на 375 × 812 первый экран показывает стену и заголовок", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await go(page, "/");
  const heading = await page.locator("h1").boundingBox();
  const wallBox = await page.locator(wall).boundingBox();
  expect(wallBox!.y + wallBox!.height / 2).toBeLessThan(812);
  expect(heading!.y + heading!.height).toBeLessThanOrEqual(812);
});

test("одна основная кнопка и ссылка на архив", async ({ page }) => {
  await go(page, "/");
  const hero = page.locator("[data-first-screen]");
  const primary = hero.locator("a.button:not(.button-ghost):not(.button-light)");
  await expect(primary).toHaveCount(1);
  await expect(primary).toHaveText(/^2 кадра бесплатно/);
  const works = hero.getByRole("link", { name: /Смотреть работы/ });
  await expect(works).toHaveClass(/text-link/);
  expect(await works.getAttribute("href")).toMatch(/\/works\/?$/);
  // Строка «с кем работаю» коротко; площадки перечисляет только «Обо мне» (дизайн-QA D16).
  await expect(hero).toContainText("Работаю прежде всего с брендами одежды.");
  await expect(hero).not.toContainText("Lamoda");
});
