import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { works } from "../lib/works";

const longestWork = [...works].sort((a, b) => b.frames.length - a.frames.length)[0];
const routes = ["/", "/works", `/works/${longestWork.slug}`, "/works/white-wrap-blouse"];

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}

async function scrollToProgress(page: Page, selector: string, progress: number) {
  const target = await page.locator(selector).evaluate((element, value) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    return top + (element.getBoundingClientRect().height - window.innerHeight) * value;
  }, progress);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), target);
  await expect
    .poll(async () => Number(await page.locator(selector).evaluate((element) => getComputedStyle(element).getPropertyValue("--p"))))
    .toBeCloseTo(progress, 1);
}

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

for (const path of routes) {
  test(`${path}: страница открывается, без горизонтальной прокрутки и ошибок доступности`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expectNoOverflow(page);
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(serious.map((violation) => violation.id)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("в текстах сайта нет длинного тире и DEMO-пометок", async ({ page }) => {
  for (const path of ["/", "/works", `/works/${longestWork.slug}`]) {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("—");
    expect(text).not.toMatch(/DEMO|прототип/i);
  }
});

test("все изображения главной загружаются", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  });
  await expect
    .poll(() => page.evaluate(() => Array.from(document.images).filter((image) => !image.complete || image.naturalWidth === 0).length), { timeout: 15_000 })
    .toBe(0);
});

test("неизвестная работа отдаёт 404, старые адреса перенаправляются", async ({ page }) => {
  const missing = await page.goto("/works/not-a-real-work");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Такой работы нет" })).toBeVisible();

  await page.goto("/cases/storm");
  await expect(page).toHaveURL(/\/works$/);
  await page.goto("/works/atelier-in-motion");
  await expect(page).toHaveURL(/\/works\/burgundy-coat-city$/);
});

test("архив показывает все работы и фильтрует по типу одежды", async ({ page }) => {
  await page.goto("/works");
  const cards = page.locator("main ul li a[href^='/works/']");
  await expect(cards).toHaveCount(works.length);

  const coats = works.filter((work) => work.category === "coats").length;
  const button = page.getByRole("button", { name: /Пальто и тренчи/ });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(cards).toHaveCount(coats);
  await expect(page.getByText(`Показано работ: ${coats}`)).toBeVisible();

  await page.getByRole("button", { name: /^Все/ }).click();
  await expect(cards).toHaveCount(works.length);
});

test("телефон с карточкой листается до последнего кадра кнопками и клавиатурой", async ({ page }) => {
  await page.goto(`/works/${longestWork.slug}`);
  const total = longestWork.frames.length;
  const next = page.getByRole("button", { name: "Следующий кадр" });
  const previous = page.getByRole("button", { name: "Предыдущий кадр" });
  await expect(previous).toBeDisabled();

  for (let step = 2; step <= total; step += 1) {
    await next.click();
    await expect(page.getByText(`Кадр ${step} из ${total}`)).toBeVisible();
  }
  await expect(next).toBeDisabled();

  await page.getByRole("region", { name: /Воронка карточки/ }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText(`Кадр ${total - 1} из ${total}`)).toBeVisible();
});

test("первый экран сразу показывает работы, услуги сменяют друг друга при прокрутке", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main > section:first-child figure")).toHaveCount(9);
  test.skip(!isDesktop(page), "Сцена услуг работает от 1024 px");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "on");
  const services = "#services";
  const items = page.locator(`${services} ol:first-of-type > li`);
  const opacityOfText = (index: number) => items.nth(index).locator("h3").evaluate((element) => Number(getComputedStyle(element.parentElement!).opacity));

  await scrollToProgress(page, services, 0);
  expect(await opacityOfText(0)).toBeGreaterThan(0.95);
  expect(await opacityOfText(5)).toBeLessThan(0.05);

  await scrollToProgress(page, services, 1);
  expect(await opacityOfText(5)).toBeGreaterThan(0.95);
  expect(await opacityOfText(0)).toBeLessThan(0.05);
  await expectNoOverflow(page);
});

test("сцена сверки деталей помещается в экран ноутбука", async ({ page }) => {
  test.skip(!isDesktop(page), "Сцена работает от 1024 px");
  await page.setViewportSize({ width: 1280, height: 680 });
  await page.goto("/");
  const section = "section[aria-labelledby=accuracy-title]";
  await scrollToProgress(page, section, 1);
  const overflow = await page.locator(section).evaluate((element) => {
    const stage = element.firstElementChild as HTMLElement;
    const list = stage.querySelector("ol") as HTMLElement;
    return list.getBoundingClientRect().bottom - stage.getBoundingClientRect().bottom;
  });
  expect(overflow).toBeLessThanOrEqual(0);
});

test("лента «исходник → карточка» доезжает до последней панели", async ({ page }) => {
  test.skip(!isDesktop(page), "Горизонтальная лента работает от 1024 px");
  await page.goto("/");
  const rail = "#transform";
  await scrollToProgress(page, rail, 1);
  const outro = page.locator(`${rail} a[href='/works']`);
  await expect(outro).toBeInViewport();
  await expectNoOverflow(page);
  await scrollToProgress(page, rail, 0);
  await expect(page.locator(`${rail} h2`)).toBeInViewport();
});

test("при reduced motion всё показано сразу и без «липких» сцен", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-fx", "on");
  const servicesHeight = await page.locator("#services").evaluate((element) => element.getBoundingClientRect().height);
  expect(servicesHeight).toBeLessThan((page.viewportSize()?.height ?? 800) * 6);
  expect(await page.locator("#services ol:first-of-type > li h3").evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element.parentElement!).opacity)))).toEqual([1, 1, 1, 1, 1, 1]);
  for (const opacity of await page.locator("main figure").evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)))) {
    expect(opacity).toBe(1);
  }
});

test("без JavaScript главная показывает весь контент", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const opacity of await page.locator("main figure, [data-reveal]").evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)))) {
    expect(opacity).toBe(1);
  }
  await context.close();
});

test("кнопка «2 кадра бесплатно» появляется на телефоне после первого экрана и ведёт к контакту", async ({ page }) => {
  await page.goto("/");
  const mobile = page.locator(".mobile-cta a");
  if ((page.viewportSize()?.width ?? 0) < 768) {
    // На первом экране кнопка есть в hero, липкая появляется после прокрутки.
    await expect(mobile).toBeHidden();
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.5, behavior: "instant" }));
    await expect(mobile).toBeVisible();
    const box = await mobile.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  } else {
    await expect(mobile).toBeHidden();
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.locator("header").getByRole("link", { name: /2 кадра бесплатно/ }).click();
  await expect(page.locator("#contact h2")).toBeInViewport();
});

test("вопросы раскрываются с клавиатуры", async ({ page }) => {
  await page.goto("/#faq");
  const first = page.locator("#faq summary").first();
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#faq details").first()).toHaveAttribute("open", "");
});
