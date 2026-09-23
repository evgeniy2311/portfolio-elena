import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}

for (const path of ["/", "/works", "/works/storm", "/works/silhouette"]) {
  test(`${path} has no overflow, console errors, missing assets, or serious accessibility violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.status() === 404 && response.request().resourceType() !== "document") errors.push(`404 ${response.url()}`); });
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    if (path === "/works") await expect(page.locator(".archive-card").first()).toBeAttached();
    await expectNoOverflow(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("archive contains 12 lean listings and URL filters support Back and Reset", async ({ page }) => {
  await page.goto("/works");
  await expect(page.locator(".archive-row")).toHaveCount(12);
  await expect(page.locator(".archive-card")).toHaveCount(12);
  await page.getByRole("button", { name: "WB", exact: true }).click();
  await expect(page).toHaveURL(/platform=WB/);
  await expect(page.getByText("6 работ", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "С исходниками" }).click();
  await expect(page).toHaveURL(/sources=1/);
  await expect(page.getByText("1 работа", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/platform=WB/);
  await expect(page).not.toHaveURL(/sources=1/);
  await page.getByRole("button", { name: /Сбросить фильтры/ }).click();
  await expect(page).toHaveURL(/\/works$/);
  await expect(page.getByText("12 работ", { exact: true })).toBeVisible();
});

test("confirmed-data filter honestly returns no demo results", async ({ page }) => {
  await page.goto("/works");
  await page.getByRole("button", { name: "С подтверждёнными данными" }).click();
  await expect(page.getByText("0 работ", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Нет совпадений" })).toBeVisible();
});

test("mobile quick view has distinct controls, closes with Escape, and returns focus", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile interaction");
  await page.goto("/works");
  const opener = page.locator(".archive-card").first().getByRole("button", { name: /Быстрый просмотр/ });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("01 / 03", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Следующий превью-слайд" }).click();
  await expect(page.getByText("02 / 03", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("archive to case and browser Back restore query, selected work, and scroll", async ({ page }) => {
  await page.goto("/works?platform=WB");
  await expect(page.getByText("6 работ", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 700));
  const before = await page.evaluate(() => window.scrollY);
  const row = page.locator(".archive-row").filter({ hasText: "STORM" });
  const card = page.locator(".archive-card").filter({ hasText: "STORM" });
  const openLink = (await row.isVisible()) ? row.getByRole("link", { name: /Открыть кейс/ }) : card.getByRole("link", { name: /Открыть кейс/ });
  await openLink.click();
  await expect(page).toHaveURL(/\/works\/storm\?from=/);
  await page.goBack();
  await expect(page).toHaveURL(/\/works\?platform=WB/);
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(Math.max(0, before - 80));
});

test("source and fidelity sections render only for a case with publishable sources", async ({ page }) => {
  await page.goto("/works/storm");
  await expect(page.locator("#sources")).toBeVisible();
  await expect(page.locator("#fidelity")).toBeVisible();
  await expect(page.locator("#sources figure")).toHaveCount(3);
  await page.goto("/works/silhouette");
  await expect(page.locator("#sources")).toHaveCount(0);
  await expect(page.locator("#fidelity")).toHaveCount(0);
  await expect(page.getByText("Исходные материалы клиента")).toHaveCount(0);
});

for (const [slug, count] of [["silhouette", 6], ["storm", 10], ["northline", 15]] as const) {
  test(`${slug} carousel supports a ${count}-slide series and contact sheet`, async ({ page }) => {
    await page.goto(`/works/${slug}`);
    await expect(page.locator(".filmstrip button")).toHaveCount(count);
    await expect(page.getByText(`01 / ${String(count).padStart(2, "0")}`, { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Показать всю серию ↓" }).click();
    await expect(page.locator(".contact-sheet article")).toHaveCount(count);
  });
}

test("optional previous design and metric schema do not leave empty sections", async ({ page }) => {
  await page.goto("/works/silhouette");
  await expect(page.locator(".before-after")).toHaveCount(0);
  await expect(page.locator(".case-metrics")).toHaveCount(0);
  await page.goto("/works/form");
  await expect(page.locator(".before-after")).toBeVisible();
  await expect(page.locator(".case-metrics")).toHaveCount(0);
  await page.goto("/works/northline");
  await expect(page.locator(".case-metrics")).toHaveCount(0);
});

test("direct route, previous/next, legacy redirect, and unknown slug behave correctly", async ({ page }) => {
  await page.goto("/works/storm");
  await expect(page.getByText("Кейс 01 / 12", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Следующий кейс: SILHOUETTE/ }).click();
  await expect(page).toHaveURL(/\/works\/silhouette$/);
  await page.goto("/cases/storm");
  await expect(page).toHaveURL(/\/works\/storm$/);
  const response = await page.goto("/works/unknown-demo-case");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Такой работы нет" })).toBeVisible();
});

test("final carousel works with mouse and keyboard", async ({ page }) => {
  await page.goto("/works/storm");
  const stage = page.locator(".work-stage");
  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("02 / 10", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Следующий слайд" }).click();
  await expect(page.getByText("03 / 10", { exact: true }).last()).toBeVisible();
});

test("touch carousel distinguishes horizontal swipe from vertical scroll", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "touch interaction");
  await page.goto("/works/storm#final-funnel");
  const stage = page.locator(".work-stage");
  await stage.scrollIntoViewIfNeeded();
  const box = await stage.boundingBox();
  if (!box) throw new Error("Missing carousel stage");
  const client = await page.context().newCDPSession(page);
  const startX = box.x + box.width * .75;
  const endX = box.x + box.width * .25;
  const y = Math.min(box.y + box.height * .35, 700);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: endX, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByText("02 / 10", { exact: true }).last()).toBeVisible();
  const before = await page.evaluate(() => window.scrollY);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y: 650 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width / 2 + 5, y: 350 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test("reduced motion leaves no running animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => document.getAnimations().filter((item) => item.playState === "running").length)).toBe(0);
});

test("320 and 1920 widths have no document overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one cross-width audit is sufficient");
  test.setTimeout(90_000);
  for (const width of [320, 1920]) {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 1080 });
    for (const path of ["/", "/works", "/works/storm", "/works/silhouette"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expectNoOverflow(page);
    }
  }
});
