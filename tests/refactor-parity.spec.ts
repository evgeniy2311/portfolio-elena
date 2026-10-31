import { expect, test, type Page } from "@playwright/test";
import { otherRoutes, pageShots, prepare, sceneShots, scenes, scrollToShot, styleDigest, type Shot } from "./helpers/refactor-scenes";

/*
 * Рефакторинг главной на блоки не должен менять ничего видимого.
 * Эталоны записаны один раз на исходном коде (до разделения) командой
 *   npm run test:e2e -- tests/refactor-parity.spec.ts --update-snapshots
 * и после этого не перезаписываются. Порог расхождения пикселей равен нулю.
 *
 * Снимки экрана сравниваются на dev-сервере. Слепок вычисленных стилей сравнивается и на dev-сервере,
 * и на production-сборке (PLAYWRIGHT_BASE_URL на `next start`): в production CSS склеивается иначе.
 */

// Прогрев dev-сервера и пролистывание длинных страниц занимают больше стандартных 45 секунд.
test.describe.configure({ timeout: 240_000 });

const mode = process.env.PLAYWRIGHT_BASE_URL ? "prod" : "dev";
const width = (page: Page) => page.viewportSize()?.width ?? 0;

async function compare(page: Page, shot: Shot) {
  await expect(page).toHaveScreenshot(`${shot.name}.png`, { animations: "disabled", caret: "hide", maxDiffPixels: 0, threshold: 0.1 });
  await page.screenshot({ path: `test-results/scenes/${width(page)}/${shot.name}.png`, animations: "disabled", caret: "hide" });
}

test.describe("снимки экрана", () => {
  test.skip(mode === "prod", "Снимки экрана записаны на dev-сервере");

  for (const [index, scene] of scenes.entries()) {
    test(`главная, сцена ${scene}`, async ({ page }) => {
      await prepare(page);
      await expect(page.locator("main > *")).toHaveCount(scenes.length);
      const shots = await sceneShots(page, index, scene);
      const pinned = shots.some((shot) => shot.progress !== undefined);
      const states: string[] = [];
      for (const shot of shots) {
        await scrollToShot(page, index, shot);
        if (pinned) states.push((await page.screenshot({ animations: "disabled" })).toString("base64"));
        await compare(page, shot);
      }
      // У «липкой» сцены пять точек прогресса дают пять разных картинок, а не одно финальное состояние.
      if (pinned) expect(new Set(states).size).toBe(shots.length);
    });
  }

  for (const route of otherRoutes) {
    test(`страница ${route}`, async ({ page }) => {
      await prepare(page, route);
      const name = route.replaceAll("/", "_").slice(1);
      for (const shot of await pageShots(page, name)) {
        await scrollToShot(page, 0, shot);
        await compare(page, shot);
      }
    });
  }

  test("главная при reduced motion, первый экран и контакт", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await prepare(page);
    for (const [index, scene] of scenes.entries()) {
      if (!["hero", "categories", "services", "rail", "accuracy", "contact"].includes(scene)) continue;
      const [shot] = await sceneShots(page, index, `reduced-${scene}`);
      await scrollToShot(page, index, shot);
      await compare(page, shot);
    }
  });
});

test.describe("вычисленные стили", () => {
  for (const route of ["/", ...otherRoutes]) {
    const name = route === "/" ? "home" : route.replaceAll("/", "_").slice(1);
    test(`${route}: стили, атрибуты и тексты всех элементов`, async ({ page }) => {
      await prepare(page, route);
      expect(await styleDigest(page)).toMatchSnapshot(`styles-${mode}-${name}.txt`);
    });
  }

  test("главная при reduced motion: стили всех элементов", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await prepare(page);
    expect(await styleDigest(page)).toMatchSnapshot(`styles-${mode}-home-reduced.txt`);
  });

  test("главная без JavaScript: стили всех элементов", async ({ browser }, testInfo) => {
    test.skip(mode === "dev", "В dev-режиме CSS без JavaScript не грузится");
    const context = await browser.newContext({ ...testInfo.project.use, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(await styleDigest(page)).toMatchSnapshot(`styles-${mode}-home-nojs.txt`);
    await context.close();
  });
});
