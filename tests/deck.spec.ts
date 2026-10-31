import { expect, test, type Page } from "@playwright/test";
import { deckCards } from "../components/blocks/requests/data";
import { go } from "./helpers/navigation";
import { isPinViewport, pinGeometry, readVar, settle } from "./helpers/scenes";

/*
 * Блок «Задачи заказчиков» (Deck). От 1024×600 одна «липкая» сцена: все карточки в одной ячейке,
 * одинаковой высоты, следующая въезжает снизу, предыдущие уходят в глубину. Регрессия v2: третья
 * карточка (лонгслив 2×2, самая высокая) поднималась раньше остальных, потому что sticky-карточки
 * упирались в низ общего <ol>. Здесь проверяется, что любая карточка, раз встав на место, двигается
 * только на заданную глубину, а при выходе вся сцена уходит вместе.
 */

const deck = "[data-deck]";
const section = "section[aria-labelledby=requests-title]";

async function ready(page: Page) {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
}

type Sample = { y: number; p: number; stageTop: number; stageHeight: number; tops: number[]; heights: number[]; opacity: number[] };

/** Прокрутка в точку и ожидание, пока сглаженное --p догонит прокрутку. */
async function sampleAt(page: Page, y: number, geometry: { start: number; end: number }): Promise<Sample> {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  // Сначала кадр движка после прокрутки: иначе старое --p у границы сцены сойдёт за новое.
  await settle(page);
  const expected = Math.min(1, Math.max(0, (y - geometry.start) / (geometry.end - geometry.start)));
  await expect.poll(async () => Math.abs(Number(await readVar(page, deck, "--p")) - expected), { timeout: 5000 }).toBeLessThan(0.002);
  return page.locator(deck).evaluate((element, scroll) => {
    const stage = element.querySelector<HTMLElement>("[data-stage]")!;
    const stageTop = stage.getBoundingClientRect().top;
    const cards = Array.from(element.querySelectorAll<HTMLElement>("[data-card]"));
    return {
      y: scroll,
      p: Number(getComputedStyle(element).getPropertyValue("--p")),
      stageTop,
      stageHeight: stage.getBoundingClientRect().height,
      tops: cards.map((card) => card.getBoundingClientRect().top - stageTop),
      heights: cards.map((card) => card.offsetHeight),
      opacity: cards.map((card) => Number(getComputedStyle(card).opacity)),
    };
  }, y);
}

test("пять карточек, включая лонгслив 2×2, и тексты из историй", async ({ page }) => {
  await ready(page);
  const cards = page.locator(`${deck} [data-card]`);
  await expect(cards).toHaveCount(5);
  expect(deckCards.map((card) => card.work.slug)).toEqual(["burgundy-coat-city", "burgundy-coat-interior", "longsleeve-colors", "brown-coat-three-looks", "reversible-sheepskin"]);
  for (const [index, card] of deckCards.entries()) {
    await expect(cards.nth(index)).toContainText(card.quote);
    await expect(cards.nth(index)).toContainText(card.result);
    await expect(cards.nth(index).locator("img")).toHaveCount(card.frames.length);
  }
  expect(deckCards[2].frames).toHaveLength(4);
  await expect(page.locator(section).getByRole("link", { name: /Обсудить проект/ })).toHaveCount(1);
});

test("от 1024 px: равные высоты, без подъёма карточек, сцена уходит целиком", async ({ page }) => {
  test.skip(!isPinViewport(page), "Стопка «липнет» от 1024×600");
  test.setTimeout(180_000);
  await ready(page);
  // Геометрия после того, как страница устоялась (поздний замер ленты, шрифты): два одинаковых замера подряд.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (await pinGeometry(page, deck)).start);
  let geometry = await pinGeometry(page, deck);
  await expect
    .poll(async () => {
      await page.waitForTimeout(400);
      const next = await pinGeometry(page, deck);
      const same = next.start === geometry.start && next.end === geometry.end;
      geometry = next;
      return same;
    })
    .toBe(true);
  expect(geometry.sticky).toBe(true);
  const header = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")));
  const step = 40;
  const forward: Sample[] = [];
  for (let y = geometry.start - 2 * step; y <= geometry.end + 2 * step; y += step) forward.push(await sampleAt(page, y, geometry));
  forward.push(await sampleAt(page, geometry.end, geometry), await sampleAt(page, geometry.end + 1, geometry));
  forward.sort((a, b) => a.y - b.y);
  const backward: Sample[] = [];
  for (let y = geometry.end + 2 * step; y >= geometry.start - 2 * step; y -= step) backward.push(await sampleAt(page, y, geometry));

  for (const sample of [...forward, ...backward]) {
    // Одинаковые layout-высоты (трансформации глубины их не меняют).
    const heights = sample.heights;
    expect(Math.max(...heights) - Math.min(...heights), `высоты при y=${sample.y}`).toBeLessThanOrEqual(2);
    if (sample.p > 0 && sample.p < 1) expect(Math.abs(sample.stageTop - header), `сцена прилипла при y=${sample.y}`).toBeLessThanOrEqual(1);
    sample.tops.forEach((top, index) => {
      // Видимая карточка, вставшая на место, поднимается только на глубину (≤ 3 × 14 px), не выше.
      if (sample.opacity[index] > 0.05 && top <= 2) expect(top, `карточка ${index + 1} при y=${sample.y}`).toBeGreaterThanOrEqual(-14 * 3 - 2);
    });
  }

  // До входа следующие карточки целиком ниже сцены: не выглядывают и не стоят в обратном порядке.
  const before = forward.find((sample) => sample.p === 0)!;
  before.tops.slice(1).forEach((top, card) => expect(top, `карточка ${card + 2} до входа`).toBeGreaterThanOrEqual(before.stageHeight - 1));

  // Вперёд: ни одна карточка не опускается; назад: ни одна не поднимается. Вход снизу и глубина
  // монотонны, а «подъём» v2 нарушал бы оба направления у припаркованной карточки.
  const pinned = (list: Sample[]) => list.filter((sample) => sample.p > 0 && sample.p < 1);
  const check = (list: Sample[], direction: 1 | -1) => {
    const inside = pinned(list);
    for (let index = 1; index < inside.length; index += 1) {
      inside[index].tops.forEach((top, card) => {
        const delta = (top - inside[index - 1].tops[card]) * direction;
        expect(delta, `карточка ${card + 1}, y=${inside[index].y}`).toBeLessThanOrEqual(1);
      });
    }
  };
  check(forward, 1);
  check(backward, -1);

  // Выход: в точке отлипания и на 1 px дальше скачок ≤ 4 px; дальше карточки уходят вместе со сценой.
  const atEnd = forward.find((sample) => sample.y === geometry.end)!;
  const pastEnd = forward.find((sample) => sample.y === geometry.end + 1)!;
  atEnd.tops.forEach((top, card) => expect(Math.abs(pastEnd.tops[card] - top)).toBeLessThanOrEqual(4));
  expect(Math.abs(atEnd.stageTop - pastEnd.stageTop)).toBeLessThanOrEqual(4);
  const released = forward.filter((sample) => sample.y > geometry.end);
  for (const sample of released) sample.tops.forEach((top, card) => expect(Math.abs(top - atEnd.tops[card]), `после выхода, карточка ${card + 1}`).toBeLessThanOrEqual(1));
  // Глубина не нарушает порядок: у последней карточки (впереди) верх ниже всех видимых задних.
  const front = atEnd.tops[4];
  atEnd.tops.slice(0, 4).forEach((top, card) => {
    if (atEnd.opacity[card] > 0.05) expect(top).toBeLessThan(front);
  });
});

test("от 1024 px: фокус только у передней карточки", async ({ page }) => {
  test.skip(!isPinViewport(page), "Стопка «липнет» от 1024×600");
  await ready(page);
  const geometry = await pinGeometry(page, deck);
  await sampleAt(page, geometry.start + (geometry.end - geometry.start) * 0.5, geometry);
  const focusable = await page.locator(`${deck} [data-card] a`).evaluateAll((links) => links.filter((link) => getComputedStyle(link).visibility !== "hidden").length);
  expect(focusable).toBe(1);
});

test("уже 1024 px: обычный список с «подъёмом», все тексты и кадры доступны", async ({ page }) => {
  test.skip(isPinViewport(page), "Список — до 1024 px");
  await ready(page);
  await expect(page.locator(`${deck}[data-pinned]`)).toHaveCount(0);
  const cards = page.locator(`${deck} [data-card]`);
  for (let index = 0; index < 5; index += 1) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/is-in/);
    await expect.poll(() => card.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
    for (const image of await card.locator("img").all()) await expect(image).toBeVisible();
  }
});

for (const size of [
  { width: 1440, height: 650, label: "низкое окно 1440×650" },
  { width: 1024, height: 600, label: "1024×600" },
  { width: 1280, height: 680, label: "1280×680" },
  { width: 720, height: 500, label: "масштаб 200 % (720×500)" },
]) {
  test(`${size.label}: тексты карточек не обрезаны`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Один прогон на размер");
    await page.setViewportSize({ width: size.width, height: size.height });
    await ready(page);
    const clipped = await page.locator(`${deck} [data-card]`).evaluateAll((cards) =>
      cards.flatMap((card, index) => {
        const box = card.getBoundingClientRect();
        const scale = box.height / (card as HTMLElement).offsetHeight || 1;
        return Array.from(card.querySelectorAll("blockquote, p, h3, a"))
          .filter((node) => (node.getBoundingClientRect().bottom - box.top) / scale > (card as HTMLElement).clientHeight + 1)
          .map((node) => `${index + 1}: ${node.textContent?.slice(0, 30)}`);
      }),
    );
    expect(clipped).toEqual([]);
  });
}

test("при reduced motion и без JS — обычный список", async ({ browser }) => {
  for (const options of [{ reducedMotion: "reduce" as const }, { javaScriptEnabled: false }]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
    const page = await context.newPage();
    await go(page, "/");
    const opacity = await page.locator(`${deck} [data-card]`).evaluateAll((cards) => cards.map((card) => Number(getComputedStyle(card).opacity)));
    expect(opacity).toEqual([1, 1, 1, 1, 1]);
    const height = await page.locator(deck).evaluate((element) => element.getBoundingClientRect().height);
    // Без «липкой» сцены нет 450vh хода.
    expect(height).toBeLessThan(5 * 1000);
    await context.close();
  }
});
