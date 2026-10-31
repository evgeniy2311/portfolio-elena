import { expect, test, type Page } from "@playwright/test";
import { accuracySource, checks } from "../components/blocks/accuracy/data";
import media from "../lib/works-media.json";
import { go } from "./helpers/navigation";
import { isPinViewport, pinGeometry, readVar, scrollToPin, settle } from "./helpers/scenes";

/*
 * Блок «Сверка деталей» (Loupe): исходник с лупой, готовый кадр открывается из той же точки,
 * четыре пункта. Регрессии v2: два пункта раскрыты одновременно, описание раскрывалось
 * анимацией max-height, фраза «Вещь в кадре та же…» была непонятной.
 */

const section = "section[aria-labelledby=accuracy-title]";

async function ready(page: Page) {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
}

/** Видимые прямоугольники текста описаний и подписей: Range.getClientRects с учётом opacity предков и обрезки. */
function visibleSlotText(page: Page) {
  return page.locator(section).evaluate((root) => {
    const effectiveOpacity = (element: Element) => {
      let value = 1;
      for (let node: Element | null = element; node && node !== document.documentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.visibility === "hidden" || style.display === "none") return 0;
        value *= Number(style.opacity);
      }
      return value;
    };
    const slots: Record<string, { text: string; opacity: number; rects: DOMRect[] }[]> = {};
    for (const node of root.querySelectorAll<HTMLElement>("[data-slot]")) {
      const opacity = effectiveOpacity(node);
      if (opacity < 0.01) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const clip = node.closest("[data-clip]")?.getBoundingClientRect();
      const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0 && (!clip || (rect.bottom > clip.top && rect.top < clip.bottom)));
      if (rects.length === 0) continue;
      (slots[node.dataset.slot!] ??= []).push({ text: node.textContent ?? "", opacity, rects: rects.map((rect) => rect.toJSON()) });
    }
    return slots;
  });
}

test.describe("данные", () => {
  test("исходник и кадры — реальные файлы бордового пальто, точки внутри фото", () => {
    const files = media["burgundy-coat-city"];
    expect(files.source.map((image) => image.src)).toContain(accuracySource.src.replace(/^\/portfolio-elena/, ""));
    expect(checks).toHaveLength(4);
    const frames = files.frames.map((image) => image.src);
    for (const check of checks) {
      expect(frames, check.title).toContain(check.image.src.replace(/^\/portfolio-elena/, ""));
      expect(check.focus.x).toBeGreaterThan(5);
      expect(check.focus.x).toBeLessThan(95);
      expect(check.focus.y).toBeGreaterThan(5);
      expect(check.focus.y).toBeLessThan(95);
    }
    // Четыре разные детали — четыре разные точки и четыре разных кадра.
    expect(new Set(checks.map((check) => `${check.focus.x}:${check.focus.y}`)).size).toBe(4);
    expect(new Set(checks.map((check) => check.image.src)).size).toBe(4);
  });
});

test("тексты: новый заголовок, подсказка и четыре пункта", async ({ page }) => {
  await ready(page);
  const root = page.locator(section);
  await expect(root.locator("h2")).toHaveText("Покупательница получит ту же вещь, что видела на фото");
  await expect(root).toContainText("Сравните исходник слева и готовый кадр справа.");
  await expect(root).toContainText("Нейросеть любит дорисовать лишнюю пуговицу или укоротить рукав.");
  await expect(root).not.toContainText("Вещь в кадре та же");
  await expect(root.locator("ol > li")).toHaveCount(4);
  for (const check of checks) await expect(root).toContainText(check.text);
  // Все фото блока загрузились.
  await root.scrollIntoViewIfNeeded();
  for (const image of await root.locator("img").all()) {
    await image.evaluate((element: HTMLImageElement) => (element.loading = "eager"));
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
});

test("от 1024 px: шаг 2 % — один пункт, тексты не накладываются, фокус не прячется", async ({ page }) => {
  test.skip(!isPinViewport(page), "Сцена «липнет» от 1024×600");
  test.setTimeout(180_000);
  await ready(page);
  const seen = new Set<number>();
  for (let step = 0; step <= 50; step += 1) {
    const progress = step / 50;
    // Геометрия заново на каждом шаге: картинки выше могут догрузиться и сдвинуть страницу.
    const geometry = await pinGeometry(page, section);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), geometry.start + (geometry.end - geometry.start) * progress);
    await expect.poll(async () => Math.abs(Number(await readVar(page, section, "--p")) - progress), { timeout: 5000 }).toBeLessThan(0.005);
    await settle(page);
    const actual = Number(await readVar(page, section, "--p"));
    const current = page.locator(`${section} ol > li[aria-current="step"]`);
    await expect(current, `шаг ${progress}`).toHaveCount(1);
    await expect
      .poll(() => current.evaluate((element) => Array.from(element.parentElement!.children).indexOf(element)), { message: `пункт при --p=${actual}` })
      .toBe(Math.min(3, Math.floor(actual * 4)));
    const index = await current.evaluate((element) => Array.from(element.parentElement!.children).indexOf(element));
    seen.add(index);
    for (let wait = 0; wait < 2; wait += 1) {
      const slots = await visibleSlotText(page);
      for (const [name, items] of Object.entries(slots)) {
        const total = items.reduce((sum, item) => sum + item.opacity, 0);
        expect(total, `${name}: сумма opacity, шаг ${progress}`).toBeLessThanOrEqual(1.05);
        for (let a = 0; a < items.length; a += 1) {
          for (let b = a + 1; b < items.length; b += 1) {
            for (const ra of items[a].rects) {
              for (const rb of items[b].rects) {
                const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
                const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
                expect(Math.min(overlapX, overlapY), `${name}: «${items[a].text.slice(0, 20)}» и «${items[b].text.slice(0, 20)}», шаг ${progress}`).toBeLessThanOrEqual(2);
              }
            }
          }
        }
      }
      await page.waitForTimeout(150);
    }
    // Ни один фокусируемый элемент блока не спрятан.
    const hiddenFocusable = await page.locator(section).evaluate((root) =>
      Array.from(root.querySelectorAll<HTMLElement>("a, button, input, [tabindex]"))
        .filter((element) => !element.closest("[inert]") && element.tabIndex >= 0)
        .filter((element) => {
          for (let node: Element | null = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) < 0.05) return true;
          }
          return false;
        }).length,
    );
    expect(hiddenFocusable, `шаг ${progress}`).toBe(0);
  }
  expect([...seen]).toEqual([0, 1, 2, 3]);
});

test("описание без анимации max-height, лупа идёт к точке детали", async ({ page }) => {
  await ready(page);
  const descriptions = page.locator(`${section} ol > li [data-slot="description"]`);
  for (const description of await descriptions.all()) {
    const style = await description.evaluate((element) => ({ max: getComputedStyle(element).maxHeight, transition: getComputedStyle(element).transitionProperty }));
    expect(style.max).toBe("none");
    expect(style.transition).not.toContain("max-height");
    expect(style.transition).not.toContain("height");
  }
  test.skip(!isPinViewport(page), "Положение лупы по прокрутке — от 1024 px");
  for (const [index, check] of checks.entries()) {
    await scrollToPin(page, section, (index + 0.5) / 4);
    await expect
      .poll(
        () =>
          page.locator(section).evaluate((root) => {
            const source = root.querySelector("[data-source]")!.getBoundingClientRect();
            const lens = root.querySelector("[data-lens]")!.getBoundingClientRect();
            return { x: ((lens.left + lens.width / 2 - source.left) / source.width) * 100, y: ((lens.top + lens.height / 2 - source.top) / source.height) * 100 };
          }),
        { timeout: 5000 },
      )
      .toEqual({ x: expect.closeTo(check.focus.x, 0), y: expect.closeTo(check.focus.y, 0) });
  }
});

test("1280×680: заголовок, список, исходник и кадр помещаются в сцену", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Один прогон на размер");
  await page.setViewportSize({ width: 1280, height: 680 });
  await ready(page);
  for (const progress of [0, 0.5, 1]) {
    await scrollToPin(page, section, progress);
    const overflow = await page.locator(section).evaluate((root) => {
      const stage = root.querySelector<HTMLElement>("[data-stage]")!.getBoundingClientRect();
      const parts = ["h2", "ol", "[data-source]", "[data-results]", "[data-hint]"].map((selector) => root.querySelector(selector)!.getBoundingClientRect());
      return parts.filter((rect) => rect.top < stage.top - 1 || rect.bottom > stage.bottom + 1 || rect.right > window.innerWidth + 1).length;
    });
    expect(overflow, `прогресс ${progress}`).toBe(0);
  }
});

test("уже 1024 px: касание, свайп и клавиатура, автопереход один раз", async ({ page }) => {
  test.skip(isPinViewport(page), "Пошаговый режим — до 1024 px");
  await ready(page);
  const root = page.locator(section);
  const current = () => root.locator(`ol > li[aria-current="step"]`).evaluate((element) => Array.from(element.parentElement!.children).indexOf(element));
  await root.locator("[data-viewer]").scrollIntoViewIfNeeded();
  // Автопереход на второй пункт один раз после появления.
  await expect.poll(current, { timeout: 6000 }).toBe(1);
  await page.waitForTimeout(3000);
  expect(await current()).toBe(1);
  // Касание по пункту.
  const buttons = root.locator("ol > li button");
  await expect(buttons).toHaveCount(4);
  for (const button of await buttons.all()) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await buttons.nth(3).click();
  await expect.poll(current).toBe(3);
  // Клавиатура.
  await buttons.nth(0).focus();
  await page.keyboard.press("Enter");
  await expect.poll(current).toBe(0);
  // Свайп влево по фото — следующий пункт.
  const viewer = (await root.locator("[data-viewer]").boundingBox())!;
  await root.locator("[data-viewer]").dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientX: viewer.x + viewer.width * 0.8, clientY: viewer.y + viewer.height / 2, isPrimary: true });
  await root.locator("[data-viewer]").dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", clientX: viewer.x + viewer.width * 0.2, clientY: viewer.y + viewer.height / 2, isPrimary: true });
  await expect.poll(current).toBe(1);
  // Активный кадр открыт, описание одно.
  await expect(root.locator(`[data-slot="description"]:visible`)).toHaveCount(1);
});

test("при reduced motion и без JS — четыре статические пары", async ({ browser }) => {
  for (const options of [{ reducedMotion: "reduce" as const }, { javaScriptEnabled: false }]) {
    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 1000 }]) {
      const context = await browser.newContext({ viewport, ...options });
      const page = await context.newPage();
      await go(page, "/");
      const root = page.locator(section);
      await root.scrollIntoViewIfNeeded();
      const results = root.locator("[data-results] figure");
      await expect(results).toHaveCount(4);
      for (const figure of await results.all()) {
        await figure.scrollIntoViewIfNeeded();
        await expect(figure).toBeVisible();
        expect(await figure.evaluate((element) => getComputedStyle(element.querySelector("[data-clip]")!).clipPath)).toBe("none");
      }
      await expect(root.locator("[data-dot]")).toHaveCount(4);
      for (const check of checks) await expect(root.getByText(check.text)).toBeVisible();
      await expect(root.locator("[data-lens]")).toBeHidden();
      await context.close();
    }
  }
});
