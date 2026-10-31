import { expect, test, type Page } from "@playwright/test";
import { IDLE_SPEED, canLoop, copiesFor, decay, nearestToCenter, releaseVelocity, skewFor, wrap } from "../components/blocks/categories/ribbon-math";
import { categories } from "../components/blocks/categories/data";
import { go } from "./helpers/navigation";

/*
 * «С чем работаю», лента «Silk Ribbon»: плавное торможение при наведении, перетаскивание 1:1
 * и инерция, отмена клика после перетаскивания, касание (горизонталь — лента, вертикаль — страница),
 * клавиатура, пауза, reduced motion и без JS. Математика — на наборах 0/1/9/37 плиток.
 */

const root = "[data-ribbon]";
const viewport = "[data-ribbon-viewport]";
const track = "[data-ribbon-track]";

function shift(page: Page) {
  return page.locator(track).evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
}

/** Сдвиг за интервал с учётом перехода через стык (по модулю ширины копии). */
function copyWidth(page: Page) {
  return page.locator(`${track} [data-copy="1"]`).evaluate((element) => (element as HTMLElement).offsetLeft - (element.previousElementSibling as HTMLElement).offsetLeft);
}

function unwrap(delta: number, width: number) {
  if (delta > width / 2) return delta - width;
  if (delta < -width / 2) return delta + width;
  return delta;
}

async function travel(page: Page, ms: number) {
  const width = await copyWidth(page);
  const before = await shift(page);
  await page.waitForTimeout(ms);
  return unwrap((await shift(page)) - before, width);
}

async function ready(page: Page) {
  await go(page, "/");
  await expect(page.locator(root)).toHaveAttribute("data-ribbon", "on", { timeout: 30_000 });
  await page.locator(viewport).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

test.describe("математика ленты", () => {
  test("0 / 1 / 9 / 37 плиток: без NaN, цикл только от двух", () => {
    expect(copiesFor(0, 0, 1440)).toBe(0);
    expect(copiesFor(1, 300, 1440)).toBe(1);
    expect(copiesFor(9, 9 * 328, 1440)).toBe(2);
    expect(copiesFor(9, 9 * 216, 375)).toBe(2);
    expect(copiesFor(37, 37 * 328, 1440)).toBe(2);
    // Узкий набор на широком экране: копий хватает, чтобы не было пустого стыка.
    expect(copiesFor(2, 2 * 328, 1440)).toBe(4);
    expect([canLoop(0), canLoop(1), canLoop(9), canLoop(37)]).toEqual([false, false, true, true]);
    for (const count of [0, 1, 9, 37]) {
      const width = count * 328;
      for (const x of [-5000, -1, 0, 1, 12345]) {
        const value = wrap(x, width);
        expect(Number.isFinite(value)).toBe(true);
        if (width > 0) {
          expect(value).toBeGreaterThanOrEqual(-width);
          expect(value).toBeLessThan(0);
        }
      }
      const centre = nearestToCenter(-100, count > 0 ? 328 : 0, count * 2, 0, 1440);
      expect(Number.isFinite(centre)).toBe(true);
      expect(centre).toBeLessThan(Math.max(1, count * 2));
    }
  });

  test("инерция и скорость броска не зависят от частоты кадров", () => {
    const at60 = Array.from({ length: 60 }).reduce<number>((v) => decay(v, 1000 / 60), 1000);
    const at120 = Array.from({ length: 120 }).reduce<number>((v) => decay(v, 1000 / 120), 1000);
    expect(at60).toBeCloseTo(at120, 6);
    expect(releaseVelocity([{ t: 0, x: 0 }, { t: 40, x: 40 }, { t: 80, x: 80 }], 80)).toBeCloseTo(1000, 6);
    // Старые точки (старше 80 мс) не учитываются; одна точка — скорость 0.
    expect(releaseVelocity([{ t: 0, x: 0 }, { t: 200, x: 10 }], 200)).toBe(0);
    expect(Math.abs(skewFor(5000))).toBe(5);
    expect(skewFor(Number.NaN)).toBe(0);
    expect(IDLE_SPEED).toBe(-40);
  });
});

test("девять плиток, подпись читается на каждой, обувь — временная типографика", async ({ page }) => {
  await go(page, "/");
  const first = page.locator(`${track} [data-copy="0"] [data-tile]`);
  await expect(first).toHaveCount(9);
  expect(categories.map((tile) => tile.label)).toEqual(["Пальто", "Тренчи", "Куртки", "Дублёнки", "Ветровки", "Полупальто", "Блузки", "Лонгсливы", "Обувь"]);
  for (const label of await first.locator("figcaption").allInnerTexts()) expect(label.trim().length).toBeGreaterThan(2);
  const shoe = page.locator(`${track} [data-copy="0"] [data-temp="shoe"]`);
  await expect(shoe).toContainText("и обувь");
  await expect(shoe).toContainText("Обувь");
  for (const copy of await page.locator(`${track} [data-copy]:not([data-copy="0"])`).evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-hidden")))) expect(copy).toBe("true");
  await expect(page.locator("section[aria-labelledby=categories-title] h2")).toContainText("Верхняя одежда");
  // Плитки — figure без перехода: у архива нет фильтра по категории.
  await expect(page.locator(`${track} a`)).toHaveCount(0);
});

test("дрейф влево; наведение тормозит плавно, без рывка; уход курсора разгоняет", async ({ page, isMobile }) => {
  test.skip(isMobile, "Наведение есть только у мыши");
  await ready(page);
  expect(await travel(page, 500)).toBeLessThan(-8);
  const box = (await page.locator(viewport).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // Первые 150 мс после наведения лента ещё едет (нет жёсткой остановки), потом встаёт.
  expect(await travel(page, 150)).toBeLessThan(-1);
  await page.waitForTimeout(1500);
  expect(Math.abs(await travel(page, 400))).toBeLessThan(1);
  await page.mouse.move(box.x + box.width / 2, box.y - 200);
  await page.waitForTimeout(1200);
  expect(await travel(page, 400)).toBeLessThan(-5);
});

test("перетаскивание мышью идёт 1:1, бросок катится по инерции, клик после перетаскивания отменён", async ({ page, isMobile }) => {
  test.skip(isMobile, "Мышь");
  await ready(page);
  const box = (await page.locator(viewport).boundingBox())!;
  await page.evaluate(() => {
    (window as unknown as { __clicks: number }).__clicks = 0;
    document.addEventListener("click", () => ((window as unknown as { __clicks: number }).__clicks += 1));
  });
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 600, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 590, y, { steps: 2 });
  const start = await shift(page);
  await page.mouse.move(box.x + 470, y, { steps: 6 });
  const dragged = unwrap((await shift(page)) - start, await copyWidth(page));
  // Пока мышь держит ленту, дрейф не добавляется: сдвиг ровно за указателем.
  expect(Math.abs(dragged + 120)).toBeLessThan(3);
  await expect(page.locator(root)).toHaveAttribute("data-dragging", "");
  // Быстрый бросок влево и отпускание. Скорость считается по последним 80 мс (VELOCITY_WINDOW): если между
  // последним движением и отпусканием проходит больше, броска нет, и это правильное поведение. Под нагрузкой
  // команды Playwright приходят с такими паузами, поэтому сам бросок идёт внутри страницы, кадр за кадром,
  // тем же указателем (pointerId мыши), а сдвиг меряется сразу после отпускания.
  const thrown = await page.locator(viewport).evaluate(async (element, { fromX, toX, clientY }) => {
    const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
    const read = () => new DOMMatrixReadOnly(getComputedStyle(element.querySelector("[data-ribbon-track]")!).transform).m41;
    const fire = (type: string, clientX: number) =>
      element.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : 1, clientX, clientY }));
    const steps = 4;
    for (let step = 1; step <= steps; step += 1) {
      await frame();
      fire("pointermove", fromX + ((toX - fromX) * step) / steps);
    }
    fire("pointerup", toX);
    const dragging = element.closest("[data-ribbon]")!.hasAttribute("data-dragging");
    const before = read();
    const start = performance.now();
    while (performance.now() - start < 200) await frame();
    return { dragging, delta: read() - before };
  }, { fromX: box.x + 470, toX: box.x + 300, clientY: y });
  expect(thrown.dragging).toBe(false);
  expect(unwrap(thrown.delta, await copyWidth(page))).toBeLessThan(-20);
  // Настоящее отпускание мыши: жест уже закончен, клик после перетаскивания отменён.
  await page.mouse.up();
  await expect(page.locator(root)).not.toHaveAttribute("data-dragging", "");
  expect(await page.evaluate(() => (window as unknown as { __clicks: number }).__clicks)).toBe(0);
});

test("pointercancel завершает перетаскивание без инерции", async ({ page, isMobile }) => {
  test.skip(isMobile, "Синтетический указатель мыши");
  await ready(page);
  const box = (await page.locator(viewport).boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 600, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 500, y, { steps: 5 });
  await expect(page.locator(root)).toHaveAttribute("data-dragging", "");
  await page.locator(viewport).dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse", isPrimary: true });
  await expect(page.locator(root)).not.toHaveAttribute("data-dragging", "");
  await page.mouse.up();
  await page.mouse.move(box.x + box.width / 2, box.y - 200);
  // Нет броска: скорость возвращается к спокойному дрейфу (≈ −40 px/s).
  await page.waitForTimeout(1500);
  const delta = await travel(page, 500);
  expect(delta).toBeLessThan(0);
  expect(delta).toBeGreaterThan(-40);
});

test("касание: горизонтальный жест двигает ленту, вертикальный прокручивает страницу", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CDP-касания только в Chromium");
  await ready(page);
  expect(await page.locator(viewport).evaluate((element) => getComputedStyle(element).touchAction)).toBe("pan-y");
  const client = await page.context().newCDPSession(page);
  const box = (await page.locator(viewport).boundingBox())!;
  const y = Math.round(box.y + box.height / 2);
  const swipe = async (from: [number, number], to: [number, number]) => {
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from[0], y: from[1] }] });
    for (let step = 1; step <= 8; step += 1) {
      const point = { x: from[0] + ((to[0] - from[0]) * step) / 8, y: from[1] + ((to[1] - from[1]) * step) / 8 };
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const before = await shift(page);
  await swipe([Math.round(box.x + box.width * 0.7), y], [Math.round(box.x + box.width * 0.3), y]);
  const moved = Math.abs((await shift(page)) - before);
  expect(moved).toBeGreaterThan(40);

  await page.waitForTimeout(800);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await swipe([Math.round(box.x + box.width / 2), y + 60], [Math.round(box.x + box.width / 2), y - 140]);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore + 40);
});

test("клавиатура: фокус останавливает дрейф, стрелки и кнопки листают на плитку", async ({ page }) => {
  await ready(page);
  const ribbonViewport = page.locator(viewport);
  await ribbonViewport.focus();
  await page.waitForTimeout(1500);
  expect(Math.abs(await travel(page, 400))).toBeLessThan(1);
  // Плитка в центре видна и выделена.
  await expect(page.locator(`${track} [data-tile][data-center]`)).toHaveCount(1);
  await expect(page.locator(`${track} [data-tile][data-center]`)).toBeInViewport();
  const step = await page.locator(`${track} [data-copy="0"] [data-tile]`).evaluateAll((tiles) => (tiles[1] as HTMLElement).offsetLeft - (tiles[0] as HTMLElement).offsetLeft);
  const before = await shift(page);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(700);
  const delta = unwrap((await shift(page)) - before, await copyWidth(page));
  expect(Math.abs(Math.abs(delta) - step)).toBeLessThan(3);
  await expect(page.getByRole("button", { name: "Следующая категория" })).toBeVisible();
  for (const name of ["Предыдущая категория", "Следующая категория"]) {
    const box = (await page.getByRole("button", { name }).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test("«Пауза» останавливает дрейф, «Пуск» возвращает", async ({ page }) => {
  await ready(page);
  const pause = page.locator(`${root} [data-loop-pause]`);
  await expect(pause).toHaveAccessibleName("Пауза ленты категорий");
  await pause.click();
  await expect(pause).toHaveAccessibleName("Пуск ленты категорий");
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(1, 1);
  await page.waitForTimeout(1600);
  expect(Math.abs(await travel(page, 400))).toBeLessThan(1);
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await page.locator(viewport).blur();
  await page.waitForTimeout(1500);
  expect(await travel(page, 400)).toBeLessThan(-5);
});

test("reduced motion: одна копия, обычная прокрутка со snap, подписи видны", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  await expect(page.locator(root)).toHaveAttribute("data-ribbon", "native");
  await expect(page.locator(`${track} [data-copy="1"]`)).toBeHidden();
  const style = await page.locator(viewport).evaluate((element) => ({ overflow: getComputedStyle(element).overflowX, snap: getComputedStyle(element).scrollSnapType }));
  expect(style.overflow).toBe("auto");
  expect(style.snap).toContain("x");
  expect(await shift(page)).toBe(0);
  await expect(page.locator(`${track} [data-copy="0"] figcaption`).first()).toBeVisible();
  // Кнопки листают обычную прокрутку.
  await page.locator(viewport).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Следующая категория" }).click();
  await expect.poll(() => page.locator(viewport).evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
});

test("без JavaScript: одна копия и обычная прокрутка", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await go(page, "/");
  await expect(page.locator(`${track} [data-copy="0"] [data-tile]`)).toHaveCount(9);
  await expect(page.locator(`${track} [data-copy="1"]`)).toBeHidden();
  expect(await page.locator(viewport).evaluate((element) => getComputedStyle(element).overflowX)).toBe("auto");
  await context.close();
});
