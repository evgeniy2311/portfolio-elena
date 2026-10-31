import { expect, test, type Page } from "@playwright/test";
import { go } from "./helpers/navigation";

/*
 * Политика CTA: отдельной секции пробы нет; липкая панель «2 кадра бесплатно» уже 1024 px
 * появляется после блока услуг (на архиве и кейсе — после первого экрана) и скрыта, пока виден
 * первый экран или контакты. Скрытая панель недоступна для Tab.
 */

const bar = (page: Page) => page.locator("[data-mobile-cta]");
const narrow = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function expectHidden(page: Page) {
  await expect(bar(page)).toBeHidden();
  await expect.poll(() => bar(page).evaluate((element) => getComputedStyle(element).visibility === "hidden" || getComputedStyle(element).display === "none")).toBe(true);
}

/** Tab по странице ни разу не попадает в скрытую панель. */
async function tabSkipsBar(page: Page) {
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[data-mobile-cta]")))).toBe(false);
  }
}

test("главная: секции пробы нет и ссылок на неё тоже", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("#trial")).toHaveCount(0);
  await expect(page.locator("a[href$='#trial']")).toHaveCount(0);
  const anchors = await page.locator("a[href*='#']").evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).hash.slice(1)).filter(Boolean));
  for (const id of new Set(anchors)) await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
});

test("главная: панель скрыта до услуг, видна после, скрыта при контактах", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
  if (!narrow(page)) {
    await scrollTo(page, await page.locator("#services").evaluate((element) => element.getBoundingClientRect().top + window.scrollY));
    await expect(bar(page)).toBeHidden();
    expect(await bar(page).evaluate((element) => getComputedStyle(element).display)).toBe("none");
    return;
  }
  // Первый экран: панель скрыта, Tab её не находит.
  await expectHidden(page);
  await tabSkipsBar(page);
  const viewport = page.viewportSize()!.height;
  const servicesTop = await page.locator("#services").evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  // Чуть выше услуг: всё ещё скрыта.
  await scrollTo(page, servicesTop - viewport - 40);
  await expectHidden(page);
  // Услуги на экране: видна, цель не меньше 44 px.
  await scrollTo(page, servicesTop - viewport / 2);
  await expect(bar(page)).toBeVisible();
  const box = await bar(page).locator("a").boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  const barBox = await bar(page).boundingBox();
  expect(barBox!.height).toBeGreaterThanOrEqual(64);
  // Контакты на экране: снова скрыта.
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expectHidden(page);
  // Вернулись к первому экрану: скрыта.
  await scrollTo(page, 0);
  await expectHidden(page);
});

test("прыжки по якорям через услуги: состояние по фактическому положению", async ({ page }) => {
  test.skip(!narrow(page), "Панель только уже 1024 px");
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", "hide");
  const viewport = page.viewportSize()!.height;
  const processTop = await page.locator("#process").evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const servicesTop = await page.locator("#services").evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  // Сразу далеко за услуги (как переход по «Как работаю»): панель видна.
  await scrollTo(page, processTop);
  await expect(bar(page)).toBeVisible();
  // Обратно выше услуг одним прыжком, минуя их: скрыта.
  await scrollTo(page, servicesTop - viewport - 200);
  await expectHidden(page);
});

test("подвал не прячется под панелью", async ({ page }) => {
  test.skip(!narrow(page), "Панель только уже 1024 px");
  await go(page, "/");
  const servicesTop = await page.locator("#services").evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, servicesTop);
  await expect(bar(page)).toBeVisible();
  await scrollTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
  const footerText = await page.locator("footer.site-footer .shell").boundingBox();
  const padding = await page.locator("footer.site-footer").evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom));
  expect(padding).toBeGreaterThanOrEqual(64);
  expect(footerText!.y + footerText!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 64 + 1);
});

for (const route of ["/works", "/works/burgundy-coat-city"]) {
  test(`${route}: панель после первого экрана, скрыта при контактах`, async ({ page }) => {
    await go(page, route);
    await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/);
    if (!narrow(page)) {
      await expect(bar(page)).toBeHidden();
      return;
    }
    await expectHidden(page);
    const firstBottom = await page.locator("[data-first-screen]").evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY);
    await scrollTo(page, firstBottom + 20);
    await expect(bar(page)).toBeVisible();
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expectHidden(page);
  });
}

test("главная: основной оффер ровно три раза (первый экран, «До и после», цены) плюс панель", async ({ page }) => {
  await go(page, "/");
  const primary = page.locator("main a.button:not(.button-ghost):not(.button-light)", { hasText: "2 кадра бесплатно" });
  await expect(primary).toHaveCount(3);
  for (const where of ["[data-first-screen]", "#transform", "#prices"]) await expect(page.locator(where).locator("a.button:not(.button-ghost)", { hasText: "2 кадра бесплатно" }), where).toHaveCount(1);
  // Шапка, «Обо мне», вопросы и контакты не повторяют оффер кнопкой.
  for (const where of ["header", "#about", "#faq", "#contact"]) await expect(page.locator(where).getByText("2 кадра бесплатно"), where).toHaveCount(0);
  await expect(page.locator("[data-mobile-cta] a", { hasText: "2 кадра бесплатно" })).toHaveCount(1);
});
