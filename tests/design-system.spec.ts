import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { go } from "./helpers/navigation";

/*
 * Дизайн-система версии 3: значения из design/brief.md (контракт) по вычисленным стилям.
 * Элементы-образцы вставляются в страницу без классов блоков: так проверяются общие правила,
 * а не оформление конкретных секций, которые перестраиваются в своих этапах.
 */

const tokens: Record<string, string> = {
  "--canvas": "#f6f2ec",
  "--surface": "#ece5db",
  "--paper": "#fffdfa",
  "--blush": "#eadfdb",
  "--ink": "#1c1714",
  "--muted": "#5e5550",
  "--line": "#ddd3c7",
  "--wine": "#6b1f2c",
  "--wine-deep": "#5a1824",
  "--noir": "#1a1817",
  "--on-dark": "#f4eee6",
  "--on-dark-muted": "#b9b0a6",
  "--champagne": "#d9b892",
  "--on-wine-accent": "#e3c9a8",
  "--on-wine-muted": "#d8c3bf",
  "--tint-mustard": "#efe3c4",
  "--tint-rose": "#eadbdb",
  "--tint-mint": "#dce6e0",
  "--tint-stone": "#e6e1da",
  "--tint-blush": "#efe2e2",
  "--radius": "12px",
  "--radius-small": "4px",
};

const durations: Record<string, number> = { "--dur-1": 160, "--dur-2": 240, "--dur-3": 480, "--dur-4": 800, "--dur-5": 1100 };
/** Сборщик CSS может записать 160ms как .16s. */
const toMs = (value: string) => (value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000);

const clampPx = (min: number, basePx: number, vw: number, max: number, width: number) => Math.min(max, Math.max(min, basePx + (vw * width) / 100));

type Rgb = [number, number, number, number];
function parseColor(value: string): Rgb {
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}
function luminance([r, g, b]: Rgb) {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(parseColor(a)), luminance(parseColor(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Вставляет образцы типографики и кнопок; возвращает вычисленные стили. */
async function specimens(page: Page) {
  return page.evaluate(() => {
    const box = document.createElement("div");
    box.id = "ds-specimens";
    box.innerHTML = `
      <h1>Заголовок</h1><h2>Подзаголовок</h2><p class="eyebrow">Надзаголовок</p>
      <p class="lede">Вводный текст</p><p class="body-sample">Основной текст</p><p class="display">Крупно</p>`;
    document.body.prepend(box);
    const pick = (selector: string) => {
      const style = getComputedStyle(box.querySelector(selector)!);
      return { family: style.fontFamily, size: parseFloat(style.fontSize), weight: style.fontWeight, lineHeight: style.lineHeight, transform: style.textTransform, spacing: style.letterSpacing };
    };
    return { h1: pick("h1"), h2: pick("h2"), eyebrow: pick(".eyebrow"), lede: pick(".lede"), body: pick(".body-sample"), display: pick(".display") };
  });
}

test("цвета, скругления и длительности совпадают с брифом", async ({ page }) => {
  await go(page, "/");
  const values = await page.evaluate((names) => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim().toLowerCase()]));
  }, [...Object.keys(tokens), ...Object.keys(durations)]);
  for (const name of Object.keys(durations)) {
    expect(toMs(values[name]), name).toBeCloseTo(durations[name], 3);
    delete values[name];
  }
  expect(values).toEqual(tokens);
});

test("типографика: H1, H2, display, надзаголовок, лид и основной текст", async ({ page }) => {
  await go(page, "/");
  await page.evaluate(() => document.fonts.ready);
  const width = page.viewportSize()!.width;
  const s = await specimens(page);
  for (const role of [s.h1, s.h2, s.display]) expect(role.family).toContain("Cormorant Garamond");
  for (const role of [s.eyebrow, s.lede, s.body]) expect(role.family).toContain("Manrope");
  expect(s.h1.size).toBeCloseTo(clampPx(44, 24, 5.2, 96, width), 0);
  expect(s.h2.size).toBeCloseTo(clampPx(40, 25.6, 3.6, 80, width), 0);
  expect(s.display.size).toBeCloseTo(clampPx(48, 28.8, 6, 112, width), 0);
  expect(s.lede.size).toBeCloseTo(clampPx(17, 16, 0.35, 21, width), 0);
  expect(s.body.size).toBe(17);
  expect(s.body.weight).toBe("400");
  expect(s.h1.weight).toBe("500");
  expect(s.eyebrow.weight).toBe("600");
  expect(s.eyebrow.transform).toBe("uppercase");
  expect(s.eyebrow.size).toBeGreaterThanOrEqual(12);
  expect(s.eyebrow.size).toBeLessThanOrEqual(13);
  expect(parseFloat(s.eyebrow.spacing) / s.eyebrow.size).toBeCloseTo(0.14, 2);
});

test("старые коричневые токены удалены из кода и стилей", async ({ page }) => {
  const root = path.resolve(__dirname, "..");
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(css|tsx?)$/.test(entry.name) && /--(cocoa|cocoa-soft|camel)\b/.test(fs.readFileSync(file, "utf8"))) offenders.push(path.relative(root, file));
    }
  };
  for (const dir of ["app", "components", "lib"]) walk(path.join(root, dir));
  expect(offenders).toEqual([]);
  await go(page, "/");
  expect(await page.evaluate(() => ["--cocoa", "--cocoa-soft", "--camel"].map((name) => getComputedStyle(document.documentElement).getPropertyValue(name)))).toEqual(["", "", ""]);
});

test("кнопки: 4 px, высота 52/48, контраст обычного, наведённого, фокусного и неактивного состояния ≥ 4.5", async ({ page }) => {
  await go(page, "/");
  const width = page.viewportSize()!.width;
  await page.evaluate(() => {
    const wrap = (ground: string, html: string) => `<div style="padding:24px;background:var(${ground})" data-ground="${ground.slice(2)}">${html}</div>`;
    const box = document.createElement("div");
    box.id = "ds-buttons";
    box.innerHTML =
      wrap("--canvas", `<a class="button" href="#x" id="b-primary">Основная</a> <a class="button button-ghost" href="#x" id="b-secondary">Вторичная</a> <a class="button button-ghost" aria-disabled="true" tabindex="0" id="b-disabled">Неактивная</a> <a class="text-link" href="#x" id="b-tertiary">Ссылка</a>`) +
      wrap("--noir", `<a class="button button-light" href="#x" id="b-light">Светлая</a> <a class="button button-ghost-light" href="#x" id="b-ghost-light">Контур</a>`) +
      wrap("--wine-deep", `<a class="button button-light" aria-disabled="true" tabindex="0" id="b-light-disabled">Неактивная</a>`);
    document.body.prepend(box);
    // Переходы в проверке не нужны: читаем конечные цвета состояний сразу.
    const style = document.createElement("style");
    style.textContent = "#ds-buttons * { transition: none !important; }";
    document.head.append(style);
  });

  const read = (id: string) =>
    page.locator(`#${id}`).evaluate((element) => {
      const style = getComputedStyle(element);
      let ground = element.parentElement!;
      while (getComputedStyle(ground).backgroundColor === "rgba(0, 0, 0, 0)") ground = ground.parentElement!;
      const bg = style.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(ground).backgroundColor : style.backgroundColor;
      return { color: style.color, bg, radius: style.borderTopLeftRadius, height: element.getBoundingClientRect().height, outline: style.outlineColor, outlineWidth: style.outlineWidth, opacity: style.opacity, ground: getComputedStyle(ground).backgroundColor };
    });

  for (const id of ["b-primary", "b-secondary", "b-disabled", "b-light", "b-ghost-light", "b-light-disabled"]) {
    const normal = await read(id);
    expect(normal.radius, id).toBe("4px");
    expect(normal.height, id).toBe(width < 768 ? 48 : 52);
    expect(normal.opacity, id).toBe("1");
    expect(contrast(normal.color, normal.bg), `${id} обычная`).toBeGreaterThanOrEqual(4.5);
    await page.locator(`#${id}`).hover();
    const hovered = await read(id);
    expect(contrast(hovered.color, hovered.bg), `${id} наведение`).toBeGreaterThanOrEqual(4.5);
    if (id.includes("disabled")) expect(hovered.bg, `${id}: неактивная не реагирует на наведение`).toBe(normal.bg);
    await page.mouse.move(0, 0);
    await page.locator(`#${id}`).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const focused = await read(id);
    expect(focused.outlineWidth, `${id} фокус`).toBe("2px");
    expect(contrast(focused.outline, focused.ground), `${id} рамка фокуса`).toBeGreaterThanOrEqual(3);
  }
  const tertiary = await read("b-tertiary");
  expect(tertiary.height).toBeGreaterThanOrEqual(44);
  expect(contrast(tertiary.color, tertiary.bg)).toBeGreaterThanOrEqual(4.5);
});

test("шрифты next/font: Cormorant 500/600 обычный и курсив, Manrope 400/500/600", async ({ page }) => {
  await go(page, "/");
  await page.evaluate(() => document.fonts.ready);
  const faces = await page.evaluate(() => Array.from(document.fonts, (face) => ({ family: face.family.replaceAll(/["']/g, ""), style: face.style, weight: face.weight })));
  const covers = (family: string, style: string, weight: number) =>
    faces.some((face) => {
      if (face.family !== family || face.style !== style) return false;
      const [from, to = from] = face.weight.split(" ").map(Number);
      return weight >= from && weight <= to;
    });
  for (const style of ["normal", "italic"]) for (const weight of [500, 600]) expect(covers("Cormorant Garamond", style, weight), `Cormorant ${style} ${weight}`).toBe(true);
  for (const weight of [400, 500, 600]) expect(covers("Manrope", "normal", weight), `Manrope ${weight}`).toBe(true);
  expect(covers("Cormorant Garamond", "normal", 400), "Cormorant 400 больше не нужен").toBe(false);
});

test("375 px и масштаб 200 %: нет горизонтальной прокрутки", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-375" && testInfo.project.name !== "desktop-1440", "Две крайние ширины");
  // Масштаб 200 % на экране 1280×720 даёт ту же раскладку, что окно 640×360 CSS-пикселей (WCAG 1.4.10).
  const size = testInfo.project.name === "mobile-375" ? { width: 375, height: 812 } : { width: 640, height: 360 };
  await page.setViewportSize(size);
  for (const route of ["/", "/works", "/works/burgundy-coat-city"]) {
    await go(page, route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});
