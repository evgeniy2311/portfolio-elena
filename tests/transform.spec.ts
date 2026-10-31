import { expect, test, type Page } from "@playwright/test";
import { railPanels } from "../components/blocks/transform/data";
import { storyFor, quoteOf } from "../lib/work-stories";
import { works } from "../lib/works";
import { go } from "./helpers/navigation";
import { isPinViewport, scrollToPin, settle } from "./helpers/scenes";

/*
 * Блок «До и после» (Darkroom Develop): шесть работ с историями «Задача · Что я сделала · Получилось»,
 * горизонтальная лента от 1024 px, карусель со снапом на телефоне, шторка «исходник / результат»
 * только у пар в одной позе, вывод после ленты в обычном потоке.
 */

const rail = "#transform";

/** «18 кадров» → 18; «Две серии по 7 кадров» → 14. Без числа — null. */
function framesClaimed(text: string): number | null {
  const series = text.match(/(Две|Три) серии по (\d+) кадр/);
  if (series) return (series[1] === "Две" ? 2 : 3) * Number(series[2]);
  const plain = text.match(/(\d+) кадр/);
  return plain ? Number(plain[1]) : null;
}

test.describe("данные", () => {
  test("шесть работ: исходники, три поля истории, фактические числа кадров", () => {
    expect(railPanels).toHaveLength(6);
    for (const { work } of railPanels) {
      expect(work.source.length, work.slug).toBeGreaterThan(0);
      const story = storyFor(work);
      expect(story.task.trim(), work.slug).not.toBe("");
      expect(story.did?.trim(), work.slug).toBeTruthy();
      expect(story.result.trim(), work.slug).not.toBe("");
    }
    // Число кадров в «Получилось» совпадает с реальной серией у всех работ, не только у шести.
    for (const work of works) {
      const claimed = framesClaimed(storyFor(work).result);
      if (claimed !== null) expect(claimed, work.slug).toBe(work.frames.length);
    }
  });

  test("цитата в «» только там, где есть дословный запрос, и совпадает с ним", () => {
    for (const work of works) {
      const quote = quoteOf(storyFor(work));
      if (quote === null) continue;
      expect(work.request, work.slug).toBeTruthy();
      expect(quote, work.slug).toBe(work.request);
    }
  });

  test("нет истории — фактические task/result работы, без выдуманных цитат", () => {
    const base = works.find((work) => !work.request)!;
    const story = storyFor({ ...base, slug: "no-such-story" as typeof base.slug });
    expect(story).toEqual({ task: base.task, result: base.result });
    expect(quoteOf(story)).toBeNull();
    const withRequest = works.find((work) => work.request)!;
    const fallback = storyFor({ ...withRequest, slug: "no-such-story" as typeof withRequest.slug });
    expect(quoteOf(fallback)).toBe(withRequest.request);
  });

  test("шторка только у пар в одной позе, с существующими кадрами", () => {
    const withSplit = railPanels.filter((panel) => panel.split);
    expect(withSplit.length).toBeGreaterThan(0);
    expect(withSplit.length).toBeLessThan(railPanels.length);
    for (const { work, split, frames } of withSplit) {
      expect(work.source[split!.source], work.slug).toBeTruthy();
      expect(work.frames[split!.frame], work.slug).toBeTruthy();
      // Кадр пары — первый, большой.
      expect(frames[0], work.slug).toBe(split!.frame);
    }
  });
});

async function ready(page: Page) {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
}

test("панели: истории, метки и ссылка с числом кадров", async ({ page }) => {
  await ready(page);
  const panels = page.locator(`${rail} [data-panel]`);
  await expect(panels).toHaveCount(6);
  for (const [index, { work }] of railPanels.entries()) {
    const panel = panels.nth(index);
    const story = storyFor(work);
    for (const label of ["Прислали", "Задача", "Что я сделала", "Получилось"]) await expect(panel.getByText(label, { exact: true })).toHaveCount(1);
    await expect(panel).toContainText(story.task);
    await expect(panel).toContainText(story.did!);
    await expect(panel).toContainText(story.result);
    await expect(panel.locator(`a[href$='/works/${work.slug}'], a[href$='/works/${work.slug}/']`)).toContainText(`Все ${work.frames.length} кадров`);
  }
});

test("вывод после ленты: в обычном потоке, факты и основная кнопка", async ({ page }) => {
  await ready(page);
  const outro = page.locator("[data-rail-outro]");
  await expect(outro).toHaveCount(1);
  expect(await outro.evaluate((element) => Boolean(element.closest("[data-pin]")))).toBe(false);
  const frames = works.reduce((sum, work) => sum + work.frames.length, 0);
  await expect(outro).toContainText(`${works.length} вещей и ${frames} кадров в портфолио`);
  await expect(outro).toContainText("Пришлите свою вещь, и первые два кадра я сделаю бесплатно.");
  await expect(outro.getByRole("link", { name: /2 кадра бесплатно/ })).toHaveClass(/\bbutton\b/);
});

test("от 1024 px: последняя панель доезжает целиком, вывод идёт следом", async ({ page }) => {
  test.skip(!isPinViewport(page), "Лента «липнет» от 1024 px");
  await ready(page);
  await scrollToPin(page, rail, 1);
  const last = page.locator(`${rail} [data-panel]`).last();
  const box = (await last.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  // Панель целиком в окне и не выше шапки.
  expect(box.y).toBeGreaterThanOrEqual(64);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  await expect.poll(() => last.evaluate((element) => Number(getComputedStyle(element).getPropertyValue("--pp")))).toBeGreaterThan(0.7);
  // Тексты не выходят за панель.
  const clipped = await last.evaluate((panel) => Array.from(panel.querySelectorAll("p, h3")).some((node) => node.getBoundingClientRect().bottom > panel.getBoundingClientRect().bottom + 1));
  expect(clipped).toBe(false);
});

test("проявление: только изображения, результат «проявлен» у центра, текст без размытия", async ({ page }) => {
  test.skip(!isPinViewport(page), "Проявление по ходу ленты — от 1024 px");
  await ready(page);
  const panel = page.locator(`${rail} [data-panel]`).nth(2);
  const result = panel.locator("[data-result] img").first();
  // Панель у правого края окна: ещё не проявлена.
  await scrollToPin(page, rail, 0);
  const geometry = await page.locator(rail).evaluate((section, index) => {
    const panels = section.querySelectorAll<HTMLElement>("[data-panel]");
    const track = section.querySelector<HTMLElement>("[data-rail-track]")!;
    const shift = parseFloat(getComputedStyle(section).getPropertyValue("--rail-shift"));
    const trackLeft = track.getBoundingClientRect().left;
    return { left: panels[index].getBoundingClientRect().left - trackLeft, trackLeft, shift, width: window.innerWidth };
  }, 2);
  const progressAt = (panelLeftInViewport: number) => Math.min(1, Math.max(0, (geometry.trackLeft + geometry.left - panelLeftInViewport) / geometry.shift));
  await scrollToPin(page, rail, progressAt(geometry.width * 0.95));
  await settle(page);
  expect(await result.evaluate((element) => getComputedStyle(element).filter)).toMatch(/grayscale|blur/);
  await scrollToPin(page, rail, progressAt(geometry.width * 0.08));
  await settle(page);
  // Проявлен: фильтра нет или он нулевой (grayscale(0) … blur(0px)).
  await expect.poll(() => result.evaluate((element) => getComputedStyle(element).filter)).toMatch(/^none$|^grayscale\(0\) contrast\(1\) blur\(0px\)$/);
  // Ни один текст ленты не размывается.
  const blurredText = await page.locator(rail).evaluate((section) =>
    Array.from(section.querySelectorAll("p, h2, h3, a, span")).some((node) => {
      for (let element: Element | null = node; element && element !== section; element = element.parentElement) {
        if (getComputedStyle(element).filter.includes("blur")) return true;
      }
      return false;
    }),
  );
  expect(blurredText).toBe(false);
});

test("шторка: клавиши двигают на 5 %, у непарных кадров её нет", async ({ page }) => {
  await ready(page);
  const panels = page.locator(`${rail} [data-panel]`);
  for (const [index, panel] of railPanels.entries()) {
    const slider = panels.nth(index).getByRole("slider", { name: "Сравнить исходник и результат" });
    await expect(slider).toHaveCount(panel.split ? 1 : 0);
  }
  const index = railPanels.findIndex((panel) => panel.split);
  const host = panels.nth(index);
  const slider = host.getByRole("slider", { name: "Сравнить исходник и результат" });
  await host.scrollIntoViewIfNeeded();
  if (isPinViewport(page)) {
    await scrollToPin(page, rail, 0);
  }
  await slider.focus();
  const before = Number(await slider.inputValue());
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await slider.inputValue())).toBe(before + 5);
  const clip = await host.locator("[data-split-result]").evaluate((element) => getComputedStyle(element).clipPath);
  expect(clip).toContain(`${before + 5}%`);
  const box = (await slider.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("уже 1024 px: карусель со снапом, панели 88 %, вертикальная прокрутка не захвачена", async ({ page }) => {
  test.skip(isPinViewport(page), "Карусель — до 1024 px");
  await ready(page);
  const carousel = page.locator(`${rail} [data-rail-panels]`);
  const info = await carousel.evaluate((element) => ({
    snap: getComputedStyle(element).scrollSnapType,
    scrollable: element.scrollWidth > element.clientWidth,
    // 88 % ширины ленты без боковых полей: следующая панель выглядывает справа.
    ratio:
      (element.querySelector("[data-panel]") as HTMLElement).getBoundingClientRect().width /
      (element.clientWidth - parseFloat(getComputedStyle(element).paddingLeft) - parseFloat(getComputedStyle(element).paddingRight)),
  }));
  expect(info.snap).toContain("x");
  expect(info.snap).toContain("mandatory");
  expect(info.scrollable).toBe(true);
  expect(info.ratio).toBeGreaterThan(0.84);
  expect(info.ratio).toBeLessThan(0.92);
  await carousel.scrollIntoViewIfNeeded();
  const box = (await carousel.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
  // Горизонтальный ход у карусели свой.
  await carousel.evaluate((element) => element.scrollBy({ left: element.clientWidth, behavior: "instant" }));
  await expect.poll(() => carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("при reduced motion фильтров нет, всё видно сразу", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  const filters = await page.locator(`${rail} img`).evaluateAll((images) => images.map((image) => getComputedStyle(image).filter));
  expect(filters.every((filter) => filter === "none")).toBe(true);
  for (const opacity of await page.locator(`${rail} [data-panel] p`).evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)))) expect(opacity).toBe(1);
});
