import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { works } from "../lib/works";
import { go } from "./helpers/navigation";
import { isPinViewport, pinGeometry, settle } from "./helpers/scenes";

/*
 * Общие инварианты приёмки версии 3 (план, Verification contract «Автоматические инварианты»), которые
 * не принадлежат одному блоку: выход из «липких» сцен, пустые полосы, стыки секций, горизонтальный
 * overflow по всей прокрутке и контраст текста. Пересечения текстов services/accuracy и стопка
 * проверяются в своих наборах (services.spec, accuracy.spec, deck.spec).
 */

const longestWork = [...works].sort((a, b) => b.frames.length - a.frames.length)[0];

async function ready(page: Page) {
  await go(page, "/");
  // Атрибут ставит ScrollFx после гидрации: до этого движок сцены не двигает.
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
}

/** Ждёт окончания конечных CSS-анимаций и переходов (появления), бесконечные петли не ждёт. */
async function animationsDone(page: Page) {
  await page.evaluate(async () => {
    const finite = document.getAnimations().filter((animation) => Number.isFinite(Number(animation.effect?.getComputedTiming().endTime)));
    await Promise.race([Promise.all(finite.map((animation) => animation.finished.catch(() => undefined))), new Promise((resolve) => setTimeout(resolve, 5000))]);
  });
}

/** Прокрутка к y и ожидание, пока сцены перестанут двигаться (появления закончились, два одинаковых замера подряд). */
async function scrollAndRest(page: Page, y: number, probe: () => Promise<unknown>) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await settle(page);
  await animationsDone(page);
  let previous = "";
  await expect
    .poll(async () => {
      await settle(page);
      const now = JSON.stringify(await probe());
      const same = now === previous;
      previous = now;
      return same;
    }, { timeout: 8000 })
    .toBe(true);
}

/** Видимое содержимое секции: прямоугольники текста (Range.getClientRects) и медиа, с учётом opacity, visibility и clipping. */
function contentBoxes(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((section) => {
    const visibleBox = (element: Element) => {
      let clip = { top: -Infinity, bottom: Infinity, left: -Infinity, right: Infinity };
      let opacity = 1;
      for (let node: Element | null = element; node && node !== document.documentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return null;
        opacity *= Number(style.opacity);
        if (node !== element && (style.overflowX !== "visible" || style.overflowY !== "visible")) {
          const rect = node.getBoundingClientRect();
          clip = { top: Math.max(clip.top, rect.top), bottom: Math.min(clip.bottom, rect.bottom), left: Math.max(clip.left, rect.left), right: Math.min(clip.right, rect.right) };
        }
      }
      return opacity > 0.05 ? clip : null;
    };
    const boxes: { top: number; bottom: number }[] = [];
    const add = (rect: DOMRect, clip: { top: number; bottom: number; left: number; right: number }) => {
      const top = Math.max(rect.top, clip.top);
      const bottom = Math.min(rect.bottom, clip.bottom);
      const left = Math.max(rect.left, clip.left);
      const right = Math.min(rect.right, clip.right);
      if (bottom - top > 1 && right - left > 1) boxes.push({ top, bottom });
    };
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim() || !node.parentElement) continue;
      const clip = visibleBox(node.parentElement);
      if (!clip) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) add(rect, clip);
    }
    // Медиа и элементы со своим видимым фоном или рамкой (рамка коллажа, кнопка, тёмная панель): их край виден.
    const painted = (style: CSSStyleDeclaration) => {
      const alpha = (color: string) => {
        if (!color || color === "transparent") return 0;
        const parts = color.replace(/^[a-z]+\(|\)$/g, "").split(/[\s,/]+/).filter(Boolean);
        return color.startsWith("rgba") || color.includes("/") ? Number(parts[3] ?? 1) : 1;
      };
      if (alpha(style.backgroundColor) > 0.05 || style.backgroundImage !== "none") return true;
      return ["Top", "Bottom"].some((side) => parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && alpha(style.getPropertyValue(`border-${side.toLowerCase()}-color`)) > 0.05);
    };
    for (const element of Array.from(section.querySelectorAll("*"))) {
      const media = element.matches("img, video, picture, svg, canvas, button, input");
      if (!media && !painted(getComputedStyle(element))) continue;
      const clip = visibleBox(element);
      if (clip) add(element.getBoundingClientRect(), clip);
    }
    return boxes;
  });
}

async function contentBox(page: Page, selector: string) {
  const boxes = await contentBoxes(page, selector);
  if (!boxes.length) return null;
  return { top: Math.min(...boxes.map((box) => box.top)), bottom: Math.max(...boxes.map((box) => box.bottom)) };
}

/** Самая высокая пустая полоса окна внутри «липкого» stage: от верха stage (не выше шапки) до низа (не ниже окна). */
async function emptyBand(page: Page, selector: string) {
  const boxes = await contentBoxes(page, `${selector} [data-stage]`);
  const frame = await page.locator(`${selector} [data-stage]`).first().evaluate((stage) => {
    const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    const rect = stage.getBoundingClientRect();
    return { top: Math.max(rect.top, header), bottom: Math.min(rect.bottom, window.innerHeight) };
  });
  const spans = boxes
    .map((box) => ({ top: Math.max(box.top, frame.top), bottom: Math.min(box.bottom, frame.bottom) }))
    .filter((box) => box.bottom > box.top)
    .sort((a, b) => a.top - b.top);
  let cursor = frame.top;
  let widest = { size: 0, at: frame.top };
  for (const span of spans) {
    if (span.top - cursor > widest.size) widest = { size: span.top - cursor, at: cursor };
    cursor = Math.max(cursor, span.bottom);
  }
  if (frame.bottom - cursor > widest.size) widest = { size: frame.bottom - cursor, at: cursor };
  return { size: Math.round(widest.size), at: Math.round(widest.at) };
}

function spaceSection(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:var(--space-section)";
    document.body.append(probe);
    const value = probe.getBoundingClientRect().height;
    probe.remove();
    return value;
  });
}

/** Метит «липкие» сцены по порядку: у стопки «Задачи заказчиков» data-pin стоит на обёртке без id. */
async function pins(page: Page) {
  return page.locator("main [data-pin]").evaluateAll((sections) =>
    sections.map((section, index) => {
      section.setAttribute("data-pin-index", String(index));
      return { selector: `[data-pin-index="${index}"]`, id: section.id || section.closest("section")?.id || `pin-${index}` };
    }),
  );
}

test.describe("«липкие» сцены", () => {
  test.setTimeout(150_000);

  test("выход: в точке отлипания и на 1 px дальше скачок ≤ 4 px; stage закрывает окно без полос > 48 px", async ({ page }) => {
    test.skip(!isPinViewport(page), "Сцены «липнут» от 1024×600");
    await ready(page);
    const list = await pins(page);
    expect(list.length).toBe(5);
    for (const { selector, id } of list) {
      const stageTop = () =>
        page.locator(selector).evaluate((section) => {
          const stage = section.querySelector<HTMLElement>("[data-stage]") ?? (section.firstElementChild as HTMLElement);
          return Math.round(stage.getBoundingClientRect().top * 10) / 10;
        });
      // Часть окна внутри секции (ниже шапки), которую не закрывает stage.
      const bands = () =>
        page.locator(selector).evaluate((section) => {
          const stage = section.querySelector<HTMLElement>("[data-stage]") ?? (section.firstElementChild as HTMLElement);
          const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
          const box = section.getBoundingClientRect();
          const rect = stage.getBoundingClientRect();
          return { above: Math.round(rect.top - Math.max(box.top, header)), below: Math.round(Math.min(box.bottom, window.innerHeight) - rect.bottom) };
        });

      const geometry = await pinGeometry(page, selector);
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollAndRest(page, geometry.start + (geometry.end - geometry.start) * progress, bands);
        const band = await bands();
        expect(band.above, `${id}: полоса над сценой при ${progress}`).toBeLessThanOrEqual(48);
        expect(band.below, `${id}: полоса под сценой при ${progress}`).toBeLessThanOrEqual(48);
      }

      const end = (await pinGeometry(page, selector)).end;
      await scrollAndRest(page, end - 1, stageTop);
      const before = await stageTop();
      await scrollAndRest(page, end, stageTop);
      const atEnd = await stageTop();
      await scrollAndRest(page, end + 1, stageTop);
      const after = await stageTop();
      expect(Math.abs(atEnd - before), `${id}: скачок перед точкой выхода`).toBeLessThanOrEqual(4);
      expect(Math.abs(after - atEnd), `${id}: скачок в точке выхода +1 px`).toBeLessThanOrEqual(4);
    }
  });

  // Бриф (design/brief.md, приёмка п. 1): «No band of empty background over 48 px inside a pinned stage».
  test("внутри stage нет пустой полосы фона > 48 px (прогресс 0, .25, .5, .75, 1)", async ({ page }) => {
    test.skip(!isPinViewport(page), "Сцены «липнут» от 1024×600");
    await ready(page);
    const failures: string[] = [];
    for (const { selector, id } of await pins(page)) {
      const geometry = await pinGeometry(page, selector);
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollAndRest(page, geometry.start + (geometry.end - geometry.start) * progress, () => emptyBand(page, selector));
        const band = await emptyBand(page, selector);
        if (band.size > 48) failures.push(`${id} при ${progress}: ${band.size} px от y=${band.at}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

test("стыки секций: одинаковый фон ≤ --space-section + 8, разный ≤ 2 × --space-section + 8", async ({ page }) => {
  test.setTimeout(120_000);
  await ready(page);
  const space = await spaceSection(page);
  const blocks = await page.locator("main > [data-ground]").evaluateAll((elements) =>
    elements.map((element, index) => {
      element.setAttribute("data-seam-index", String(index));
      return { index, name: element.id || (element.hasAttribute("data-rail-outro") ? "transform-outro" : element.className.toString().split(" ")[0]), ground: element.getAttribute("data-ground") };
    }),
  );
  expect(blocks.length).toBeGreaterThanOrEqual(13);
  const failures: string[] = [];
  for (let index = 1; index < blocks.length; index += 1) {
    const a = `[data-seam-index="${index - 1}"]`;
    const b = `[data-seam-index="${index}"]`;
    // Стык в середине окна: у «липкой» сцены выше stage уже доехал до низа секции.
    const seam = await page.locator(b).evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    const probe = async () => [await contentBox(page, a), await contentBox(page, b)];
    await scrollAndRest(page, seam - (page.viewportSize()?.height ?? 800) / 2, probe);
    const [upper, lower] = await probe();
    if (!upper || !lower) continue;
    const gap = lower.top - upper.bottom;
    const same = blocks[index - 1].ground === blocks[index].ground;
    const limit = (same ? space : 2 * space) + 8;
    if (gap > limit) failures.push(`${blocks[index - 1].name} (${blocks[index - 1].ground}) → ${blocks[index].name} (${blocks[index].ground}): ${gap.toFixed(1)} > ${limit.toFixed(1)}`);
  }
  expect(failures).toEqual([]);
});

test("нет горизонтальной прокрутки на всей высоте главной", async ({ page }) => {
  test.setTimeout(120_000);
  await ready(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewport = page.viewportSize()?.height ?? 800;
  for (let y = 0; y < height; y += viewport / 2) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await settle(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `y=${Math.round(y)}`).toBeLessThanOrEqual(0);
  }
});

const contrastFailures = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) =>
  results.violations.flatMap((violation) => violation.nodes.map((node) => `${node.target.join(" ")}: ${node.failureSummary?.split("\n").slice(-1)[0]}`));

for (const path of ["/", "/works", `/works/${longestWork.slug}`, "/works/white-wrap-blouse"]) {
  test(`${path}: контраст текста ≥ 4.5:1 в конечном состоянии (reduced motion, axe color-contrast)`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: test.info().project.use.viewport ?? undefined });
    const page = await context.newPage();
    await go(page, path);
    await expect(page.locator("h1")).toHaveCount(1);
    await animationsDone(page);
    expect(contrastFailures(await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze())).toEqual([]);
    await context.close();
  });

  test(`${path}: контраст текста ≥ 4.5:1 с движением, в месте чтения каждого блока`, async ({ page }) => {
    test.setTimeout(180_000);
    await go(page, path);
    await expect(page.locator("h1")).toHaveCount(1);
    const blocks = await page.locator("main > *, footer").evaluateAll((elements) =>
      elements.map((element, index) => {
        element.setAttribute("data-contrast-index", String(index));
        return index;
      }),
    );
    const failures: string[] = [];
    for (const index of blocks) {
      const selector = `[data-contrast-index="${index}"]`;
      // Место чтения: верх блока в верхней четверти окна (у «липкой» сцены это её начало).
      const top = await page.locator(selector).evaluate((element) => element.getBoundingClientRect().top + window.scrollY - window.innerHeight / 4);
      await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y), behavior: "instant" }), top);
      await settle(page);
      await animationsDone(page);
      await page.waitForTimeout(300);
      failures.push(...contrastFailures(await new AxeBuilder({ page }).include(selector).withRules(["color-contrast"]).analyze()));
    }
    expect(failures).toEqual([]);
  });
}
