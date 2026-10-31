import { expect, test } from "@playwright/test";
import { go } from "./helpers/navigation";

/*
 * Блок 4 «Почему так бывает» (design/brief.md, «Ink Line»): светлая сцена blush, три проблемы
 * с номером, заголовком, текстом и исходным фото; линии над строками рисуются слева, заголовок
 * читается по словам. Тексты дословно из council/copy.md «ТЕКСТЫ» [3].
 */
const section = "#pains";

const items = [
  {
    title: "На белом фоне вещь теряется",
    text: "В выдаче сотни похожих карточек. Плоский кадр покупательница пролистывает и даже не замечает.",
    caption: "Обычное фото на белом фоне",
    image: /beige-windbreaker\/source-1/,
  },
  {
    title: "Фотосессия долгая и дорогая",
    text: "Студия, модель, стилист, ожидание. А на каждый новый цвет всё сначала.",
    caption: "Этот кадр сделан без фотосессии",
    image: /beige-windbreaker\/frame-01/,
  },
  {
    title: "Нейросеть рисует похожую, но другую вещь",
    text: "Меняет пуговицы, длину, карманы. Потом приходят возвраты с причиной «не соответствует фото».",
    caption: "Пуговицы как на оригинале",
    image: /burgundy-coat-city\/frame-03/,
  },
];

test("три строки на blush: номера Manrope, тексты дословно, исходные фото", async ({ page }) => {
  await go(page, "/");
  const block = page.locator(section);
  await expect(block).toHaveAttribute("data-ground", "blush");
  expect(await block.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(234, 223, 219)");
  await expect(block.locator(".eyebrow")).toHaveText("Почему так бывает");
  await expect(block.locator("h2")).toHaveText("Хорошая вещь, а продаётся плохо");
  await expect(block.locator("h2 em")).toHaveText("плохо");

  const rows = block.locator("ol > li");
  await expect(rows).toHaveCount(3);
  for (const [index, item] of items.entries()) {
    const row = rows.nth(index);
    const number = row.locator("[data-pain-number]");
    await expect(number).toHaveText(`0${index + 1}`);
    const font = await number.evaluate((element) => {
      const style = getComputedStyle(element);
      return { family: style.fontFamily, numeric: style.fontVariantNumeric };
    });
    expect(font.family).toMatch(/Manrope/);
    expect(font.numeric).toContain("tabular-nums");
    await expect(row.locator("h3")).toHaveText(item.title);
    await expect(row.locator("p")).toHaveText(item.text);
    await expect(row.locator("figcaption")).toHaveText(item.caption);
    expect(await row.locator("img").getAttribute("src")).toMatch(item.image);
  }
});

test("прежнего рекламного абзаца после списка нет", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator(section)).not.toContainText("Я делаю кадры, которые останавливают взгляд");
  await expect(page.locator(section).locator("p")).toHaveCount(4); // надзаголовок + три текста
});

test("порядок в строке: номер, заголовок, текст, фото; на телефоне фото 72 % ширины", async ({ page }) => {
  await go(page, "/");
  const row = page.locator(`${section} ol > li`).first();
  await row.scrollIntoViewIfNeeded();
  const boxes = await row.evaluate((element) => {
    const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
    const [number, title, text, image] = ["[data-pain-number]", "h3", "p", "figure"].map(box);
    return { number: { top: number.top, left: number.left }, title: { top: title.top, left: title.left }, text: { top: text.top }, image: { top: image.top, left: image.left, width: image.width }, row: element.getBoundingClientRect().width };
  });
  const width = page.viewportSize()!.width;
  if (width < 768) {
    expect(boxes.title.top).toBeGreaterThanOrEqual(boxes.number.top - 2);
    expect(boxes.text.top).toBeGreaterThan(boxes.title.top);
    expect(boxes.image.top).toBeGreaterThan(boxes.text.top);
    expect(boxes.image.width / boxes.row).toBeCloseTo(0.72, 1);
  } else if (width >= 1024) {
    // 80px | 1fr | 280px: номер слева, текст в середине, фото справа шириной 280.
    expect(boxes.title.left).toBeGreaterThan(boxes.number.left + 60);
    expect(boxes.image.left).toBeGreaterThan(boxes.title.left);
    expect(Math.round(boxes.image.width)).toBe(280);
  }
});

test("при прокрутке линии рисуются, а заголовок читается по словам", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
  const words = page.locator(`${section} h2 [data-word]`);
  await expect(words).toHaveCount(4); // «а» неразрывно с «продаётся»
  // Блок ещё ниже экрана: слова приглушены (.18), линии не нарисованы.
  const first = await words.first().evaluate((element) => Number(getComputedStyle(element).opacity));
  expect(first).toBeLessThan(0.3);
  await page.locator(`${section} ol`).scrollIntoViewIfNeeded();
  await page.locator(`${section} h2`).evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25, behavior: "instant" }));
  await expect.poll(() => words.evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)))).toEqual([1, 1, 1, 1]);
  const row = page.locator(`${section} ol > li`).first();
  await row.scrollIntoViewIfNeeded();
  await expect.poll(() => row.locator("[data-rule]").evaluate((element) => getComputedStyle(element).transform)).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
  await expect.poll(() => row.locator("h3").evaluate((element) => Number(getComputedStyle(element.parentElement!).opacity))).toBe(1);
});

test("reduced motion: все слова и строки видны, линии нарисованы", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
  const opacities = await page.locator(`${section} [data-word], ${section} li *`).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
  expect(opacities.every((value) => value === 1)).toBe(true);
  for (const transform of await page.locator(`${section} [data-rule]`).evaluateAll((elements) => elements.map((element) => getComputedStyle(element).transform))) {
    expect(transform).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
  }
});

test("без JavaScript: все слова и строки видны, линии нарисованы", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await go(page, "/");
  const opacities = await page.locator(`${section} [data-word], ${section} li *`).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
  expect(opacities.every((value) => value === 1)).toBe(true);
  for (const transform of await page.locator(`${section} [data-rule]`).evaluateAll((elements) => elements.map((element) => getComputedStyle(element).transform))) {
    expect(transform).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
  }
  await context.close();
});
