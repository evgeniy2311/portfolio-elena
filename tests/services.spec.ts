import { expect, test, type Page } from "@playwright/test";
import { go } from "./helpers/navigation";
import { isPinViewport, scrollToPin, settle } from "./helpers/scenes";

/*
 * Блок 5 «Что вы получаете» (design/brief.md, «Atelier Slideshow»): семь услуг, на компьютере
 * сцена с одним текстом в слоте и своим переходом фото на каждую смену; на телефоне и при
 * reduced motion/без JS — список. Тексты дословно из council/copy.md «ТЕКСТЫ» [4].
 */
const section = "#services";
const titles = ["Главное фото", "Воронка карточки", "Образы и сцены", "Новый цвет", "Модель под вашу аудиторию", "Детали крупно", "Видео из фото"];
const transitions = ["curtain", "iris", "wipe", "blinds", "zoom", "split"];

/** Видимые тексты слотов: прямоугольники строк (Range.getClientRects) и итоговая непрозрачность слота. */
async function visibleTexts(page: Page) {
  return page.locator(section).evaluate((root) => {
    const effective = (element: Element) => {
      let opacity = 1;
      for (let node: Element | null = element; node && node !== root.parentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.visibility === "hidden" || style.display === "none") return 0;
        opacity *= Number(style.opacity);
      }
      return opacity;
    };
    return Array.from(root.querySelectorAll<HTMLElement>("[data-text-slot]"), (slot, index) => {
      const opacity = effective(slot);
      const rects: Array<{ left: number; top: number; right: number; bottom: number }> = [];
      const walker = document.createTreeWalker(slot, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim() || effective(node.parentElement!) < 0.02) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          // Строка, срезанная маской (overflow: clip у обёртки), видна только в пределах обёртки.
          let clip = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
          for (let parent: Element | null = node.parentElement; parent && parent !== slot.parentElement; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            if (style.overflow === "visible" && style.clipPath === "none") continue;
            const box = parent.getBoundingClientRect();
            clip = { left: Math.max(clip.left, box.left), top: Math.max(clip.top, box.top), right: Math.min(clip.right, box.right), bottom: Math.min(clip.bottom, box.bottom) };
          }
          if (clip.right - clip.left > 1 && clip.bottom - clip.top > 1) rects.push(clip);
        }
      }
      return { index, opacity, rects, inert: slot.inert, hidden: slot.getAttribute("aria-hidden") === "true" };
    });
  });
}

function overlap(a: { left: number; top: number; right: number; bottom: number }, b: typeof a) {
  return Math.min(Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)));
}

/** Прогресс сцены, при котором позиция (номер слайда + доля) равна position. */
const at = (position: number) => position / titles.length;

test("семь услуг: счётчик 01/07…07/07, воронка 10–12 кадров, тексты дословно", async ({ page }) => {
  await go(page, "/");
  const block = page.locator(section);
  await expect(block).toHaveAttribute("data-ground", "canvas");
  await expect(block.locator("h2")).toHaveText("Что можно заказать");
  await expect(block.locator("h2 em")).toHaveText("заказать");
  const slides = block.locator("[data-slide]");
  await expect(slides).toHaveCount(7);
  for (const [index, title] of titles.entries()) {
    await expect(slides.nth(index).locator("h3")).toHaveText(title);
    await expect(slides.nth(index).locator("[data-service-number]")).toHaveText(`${String(index + 1).padStart(2, "0")} / 07`);
  }
  await expect(slides.nth(1).locator("p")).toContainText("10–12 кадров одной вещи");
  await expect(block).not.toContainText(/8 до 20|15–20/);
  await expect(block.getByRole("link", { name: "Смотреть работы" })).toHaveAttribute("href", /\/works\/?$/);
});

test("«Видео из фото» ведёт к своему блоку, пока его нет — к контактам", async ({ page }) => {
  await go(page, "/");
  const link = page.locator(`${section} [data-slide]`).nth(6).locator("h3 a");
  const target = (await page.locator("#video").count()) > 0 ? "#video" : "#contact";
  await expect(link).toHaveAttribute("href", target);
});

test.describe("сцена от 1024 px", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isPinViewport(page), "Сцена работает от 1024 × 600");
    await go(page, "/");
    await expect(page.locator(section)).toHaveAttribute("data-pinned", "on");
  });

  test("шаг 2 % вперёд и назад: тексты не пересекаются, сумма непрозрачности ≤ 1,05, скрытые недоступны", async ({ page }) => {
    test.setTimeout(180_000);
    const steps = Array.from({ length: 51 }, (_, index) => index / 50);
    for (const progress of [...steps, ...steps.slice(0, -1).reverse()]) {
      await scrollToPin(page, section, progress);
      await settle(page);
      const slots = await visibleTexts(page);
      const visible = slots.filter((slot) => slot.opacity > 0.02 && slot.rects.length > 0);
      const sum = slots.reduce((total, slot) => total + slot.opacity, 0);
      expect(sum, `сумма непрозрачности при ${progress}`).toBeLessThanOrEqual(1.05);
      for (const a of visible)
        for (const b of visible) {
          if (a.index >= b.index) continue;
          for (const ra of a.rects) for (const rb of b.rects) expect(overlap(ra, rb), `слоты ${a.index}/${b.index} при ${progress}`).toBeLessThanOrEqual(2);
        }
      for (const slot of slots) if (slot.opacity === 0) expect(slot.inert && slot.hidden, `слот ${slot.index} скрыт, но доступен при ${progress}`).toBe(true);
    }
  });

  test("на стыке слот пуст, на плато читается одна услуга; Tab не попадает в скрытые", async ({ page }) => {
    await scrollToPin(page, section, at(2));
    await settle(page);
    let slots = await visibleTexts(page);
    expect(slots.filter((slot) => slot.opacity > 0.02)).toEqual([]);

    await scrollToPin(page, section, at(2.5));
    await settle(page);
    slots = await visibleTexts(page);
    const readable = slots.filter((slot) => slot.opacity > 0.95);
    expect(readable.map((slot) => slot.index)).toEqual([2]);
    expect(slots.filter((slot) => slot.index !== 2).every((slot) => slot.inert)).toBe(true);
    await expect(page.locator(`${section} [data-service-counter]`)).toHaveAttribute("data-value", "3");

    // Ссылка седьмой услуги скрыта, Tab её пропускает.
    await expect(page.locator(`${section} [data-slide]`).nth(6).locator("h3 a")).not.toBeFocused();
    const focusable = await page.locator(`${section} [data-slide]`).nth(6).locator("h3 a").evaluate((element) => {
      (element as HTMLElement).focus();
      return document.activeElement === element;
    });
    expect(focusable).toBe(false);
  });

  test("текст и превью прижаты к верху подложки; превью не повторяет главное фото посреди перехода", async ({ page }) => {
    await scrollToPin(page, section, at(1.5));
    await settle(page);
    const slide = page.locator(`${section} [data-slide]`).nth(1);
    const tops = await slide.evaluate((element) => {
      const top = (selector: string) => element.querySelector(selector)!.getBoundingClientRect().top;
      return { tint: top("span[data-tint]"), text: top("[data-text-slot] h3"), preview: top("div[aria-hidden='true'] img") };
    });
    expect(tops.text - tops.tint, "текст у верха подложки").toBeLessThan(120);
    expect(tops.preview - tops.tint, "превью у верха подложки").toBeLessThan(120);
    // Фото следующей услуги только начинает открываться (t .88): превью уже погасло.
    await scrollToPin(page, section, at(1.88));
    await settle(page);
    const opacity = await slide.locator("div[aria-hidden='true']:has(img)").evaluate((element) => Number(getComputedStyle(element).opacity));
    expect(opacity).toBeLessThan(0.05);
  });

  test("у каждой смены свой переход фото", async ({ page }) => {
    const seen: string[] = [];
    for (const [offset, kind] of transitions.entries()) {
      const index = offset + 1;
      const figure = page.locator(`${section} [data-slide]`).nth(index).locator("figure");
      await expect(figure).toHaveAttribute("data-transition", kind);
      await scrollToPin(page, section, at(index));
      await settle(page);
      const clip = await figure.evaluate((element) => getComputedStyle(element).clipPath);
      const expected = { curtain: /^inset/, iris: /^circle/, wipe: /^polygon/, blinds: /^polygon/, zoom: /^inset/, split: /^polygon/ }[kind]!;
      expect(clip, kind).toMatch(expected);
      seen.push(clip.replace(/[\d.]+/g, "#"));
    }
    expect(new Set(seen).size, "формы переходов различаются").toBe(transitions.length);
    // На плато кадр раскрыт полностью.
    await scrollToPin(page, section, at(3.5));
    await settle(page);
    const plateau = await page.locator(`${section} [data-slide]`).nth(3).locator("figure").evaluate((element) => element.getBoundingClientRect().width);
    expect(plateau).toBeGreaterThan(100);
  });
});

test("ниже 1024 px: список, у каждого кадра своё появление, тексты всегда видны", async ({ page }) => {
  test.skip(isPinViewport(page), "Список проверяется на телефоне и планшете");
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
  await expect(page.locator(section)).not.toHaveAttribute("data-pinned", "on");
  const slides = page.locator(`${section} [data-slide]`);
  for (let index = 0; index < 7; index += 1) {
    const figure = slides.nth(index).locator("figure");
    await figure.scrollIntoViewIfNeeded();
    if (index === 0) continue;
    await expect(slides.nth(index)).toHaveClass(/is-in/);
    // Переход доигран: форма своего перехода в конечном положении, кадр виден.
    await expect.poll(() => figure.evaluate((element) => getComputedStyle(element).getPropertyValue("--svc-q").trim())).toBe("1");
    expect(await figure.evaluate((element) => getComputedStyle(element).clipPath)).toMatch(/^(inset|circle|polygon)/);
  }
  const opacities = await page.locator(`${section} [data-text-slot]`).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
  expect(opacities).toEqual([1, 1, 1, 1, 1, 1, 1]);
  expect(await page.locator(`${section} [data-text-slot][inert]`).count()).toBe(0);
});

for (const mode of ["reduced", "nojs"] as const) {
  test(`${mode === "reduced" ? "reduced motion" : "без JavaScript"}: статичный список без переходов`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: mode !== "nojs", reducedMotion: mode === "reduced" ? "reduce" : "no-preference", viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await go(page, "/");
    if (mode === "reduced") await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    const height = await page.locator(section).evaluate((element) => element.getBoundingClientRect().height);
    const texts = await page.locator(`${section} [data-text-slot]`).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
    expect(texts).toEqual([1, 1, 1, 1, 1, 1, 1]);
    const clips = await page.locator(`${section} figure`).evaluateAll((elements) => elements.map((element) => getComputedStyle(element).clipPath));
    expect(clips.every((clip) => clip === "none")).toBe(true);
    expect(await page.locator(`${section} [data-text-slot][inert]`).count()).toBe(0);
    expect(height).toBeLessThan(1000 * 7);
    await context.close();
  });
}
