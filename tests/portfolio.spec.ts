import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { publicCases } from "../lib/portfolio";

const testBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}

async function scrollMotionSection(page: Page, selector: string, progress: number, progressProperty: string) {
  const target = await page.locator(selector).evaluate((element, requestedProgress) => {
    const stage = element.querySelector<HTMLElement>("[data-motion-stage]") ?? element.firstElementChild as HTMLElement | null;
    if (!stage) throw new Error("Motion stage is missing");
    const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const sectionTop = element.getBoundingClientRect().top + window.scrollY;
    const range = Math.max(1, (element as HTMLElement).offsetHeight - stage.offsetHeight);
    return sectionTop - stickyTop + range * requestedProgress;
  }, progress);
  await page.evaluate((top) => window.scrollTo(0, top), target);
  await expect.poll(async () => Number(await page.locator(selector).evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), progressProperty))).toBeGreaterThanOrEqual(Math.max(0, progress - 0.006));
}

async function motionMetrics(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const stage = element.querySelector<HTMLElement>("[data-motion-stage]") ?? element.firstElementChild as HTMLElement;
    return {
      top: element.getBoundingClientRect().top + window.scrollY,
      stickyTop: Number.parseFloat(getComputedStyle(stage).top) || 0,
      range: (element as HTMLElement).offsetHeight - stage.offsetHeight,
      photoStep: Number((element as HTMLElement).dataset.photoStep),
      revealDuration: Number((element as HTMLElement).dataset.revealDuration),
      starts: Array.from(element.querySelectorAll<HTMLElement>("[data-motion-start-px]")).map((frame) => Number(frame.dataset.motionStartPx)),
      completes: Array.from(element.querySelectorAll<HTMLElement>("[data-motion-complete-px]")).map((frame) => Number(frame.dataset.motionCompletePx)),
    };
  });
}

async function wheelMotionSamples(page: Page, selector: string, step: number, reverse = false) {
  const section = page.locator(selector);
  const metrics = await motionMetrics(page, selector);
  const start = metrics.top - metrics.stickyTop + (reverse ? metrics.range : 0);
  await page.evaluate((top) => window.scrollTo(0, top), start);
  await page.waitForTimeout(60);
  const samples = [{
    scrollY: await page.evaluate(() => window.scrollY),
    visible: Number(await section.getAttribute("data-visible-count")),
  }];
  for (let travelled = 0; travelled < metrics.range; travelled += Math.abs(step)) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(35);
    samples.push(await section.evaluate((element) => ({
      scrollY: window.scrollY,
      visible: Number((element as HTMLElement).dataset.visibleCount),
    })));
  }
  return samples;
}

for (const path of ["/", "/works", "/works/storm", "/works/silhouette", "/works/atelier-in-motion"]) {
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
  await expect(page.locator('[data-work-slug="storm"] [data-case-link]').filter({ visible: true }).first()).toBeFocused();
});

test("quick view and full case have distinct names and Back restores focus to the selected card", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile quick-view return path");
  await page.goto("/works");
  const card = page.locator('.archive-card[data-work-slug="storm"]');
  const quick = card.getByRole("button", { name: "Быстрый просмотр: STORM" });
  const full = card.getByRole("link", { name: "Открыть кейс: полная история STORM" });
  await expect(quick).toBeVisible();
  await expect(full).toBeVisible();
  await quick.click();
  await page.getByRole("dialog").getByRole("link", { name: "Открыть кейс: полная история STORM" }).click();
  await expect(page).toHaveURL(/\/works\/storm\?from=/);
  await page.goBack();
  await expect(page).toHaveURL(/\/works\?selected=storm/);
  await expect(card.getByRole("link", { name: "Открыть кейс: полная история STORM" })).toBeFocused();
  await expect(page.getByRole("dialog")).not.toBeVisible();
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
  await expect(stage.locator("img")).toHaveAttribute("loading", "lazy");
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(1);
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

test("atelier home has the complete editorial structure and one clear work path", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Елена Бадьина" })).toBeVisible();
  await expect(page.getByText("Товар остаётся собой.", { exact: false }).first()).toBeVisible();
  await expect(page.locator("main section")).toHaveCount(9);
  await expect(page.getByRole("link", { name: /Открыть полный кейс о пальто/ })).toHaveAttribute("href", "/works/atelier-in-motion");
  await expect(page.getByRole("button", { name: "Telegram · ссылка уточняется" })).toBeDisabled();
  await expect(page.locator('img[src*="_thumb"], img[src*="photo_64"]')).toHaveCount(0);
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(1);
});

test("unified shell and CTA vocabulary make local scroll, case routes, and disabled contact distinct", async ({ page }) => {
  for (const path of ["/", "/works", "/works/storm", "/works/atelier-in-motion"]) {
    await page.goto(path);
    await expect(page.locator("header.site-header")).toHaveCount(1);
    await expect(page.locator("footer.site-footer")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Елена Бадьина, главная" })).toHaveCount(1);
    const contact = page.getByRole("button", { name: "Telegram · ссылка уточняется" });
    await expect(contact).toBeDisabled();
    await expect(contact).toHaveAttribute("aria-describedby", /telegram-note$/);
  }

  await page.goto("/");
  await expect(page.getByRole("link", { name: /Смотреть фотоистории/ })).toHaveAttribute("href", "#selected");
  await expect(page.getByRole("link", { name: /Открыть все кейсы/ })).toHaveAttribute("href", "/works");
  const storyLinks = page.locator('[class*="indexCard"]');
  await expect(storyLinks).toHaveCount(3);
  for (const link of await storyLinks.all()) {
    await expect(link).toHaveAttribute("href", /^#/);
    await expect(link).toContainText("К фотоистории на этой странице");
  }
  await expect(page.locator('a a, a button, button a')).toHaveCount(0);
});

test("all four photo stories use one equal physical step and reversible complete states", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one exact motion audit");
  test.setTimeout(120_000);
  const stories = [
    { selector: "#hero", count: 4, progress: "--scene-progress" },
    { selector: "#dark-coat", count: 4, progress: "--dark-progress" },
    { selector: "#windbreaker", count: 5, progress: "--wind-progress" },
    { selector: "#color-coat", count: 4, progress: "--color-progress" },
  ] as const;

  for (const [width, height] of [[1024, 650], [1280, 800], [1440, 650], [1440, 900], [1920, 650], [1920, 900]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const story of stories) {
      const section = page.locator(story.selector);
      await expect(section).toHaveAttribute("data-motion-enhanced", "true");
      const metrics = await motionMetrics(page, story.selector);
      expect(metrics.completes).toHaveLength(story.count);
      const intervals = metrics.completes.slice(1).map((point, index) => point - metrics.completes[index]);
      const reveals = metrics.completes.slice(1).map((point, index) => point - metrics.starts[index + 1]);
      expect(Math.max(...intervals) / Math.min(...intervals), `${story.selector} intervals at ${width}x${height}`).toBeLessThanOrEqual(1.05);
      expect(Math.max(...reveals) / Math.min(...reveals), `${story.selector} reveals at ${width}x${height}`).toBeLessThanOrEqual(1.05);
      expect(intervals.every((value) => value === metrics.photoStep)).toBeTruthy();
      expect(reveals.every((value) => value === metrics.revealDuration)).toBeTruthy();

      await scrollMotionSection(page, story.selector, 0, story.progress);
      await expect(section).toHaveAttribute("data-visible-count", "1");
      await scrollMotionSection(page, story.selector, 1, story.progress);
      expect(Number(await section.getAttribute("data-motion-progress"))).toBeGreaterThanOrEqual(0.995);
      await expect(section).toHaveAttribute("data-visible-count", String(story.count));
      for (let index = 1; index <= story.count; index += 1) {
        expect(Number(await section.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), `--photo-${index}`))).toBeGreaterThanOrEqual(0.999);
      }
      await scrollMotionSection(page, story.selector, 0, story.progress);
      await expect(section).toHaveAttribute("data-visible-count", "1");
      await page.waitForTimeout(80);
      await expect(section).toHaveAttribute("data-motion-raf", "idle");
    }
  }
});

test("real wheel 120, 240, and 360 preserves equal reveals and reverse order", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one exact wheel audit");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1024, height: 650 });
  await page.goto("/");
  for (const [selector, count] of [["#hero", 4], ["#dark-coat", 4], ["#windbreaker", 5], ["#color-coat", 4]] as const) {
    for (const step of [120, 240, 360]) {
      const samples = await wheelMotionSamples(page, selector, step);
      const visible = samples.map((sample) => sample.visible);
      expect(visible.every((value, index) => index === 0 || value >= visible[index - 1]), `${selector} forward ${step}`).toBeTruthy();
      expect(visible.at(-1), `${selector} final ${step}`).toBe(count);
      if (step === 120) {
        const completionSamples = Array.from({ length: count - 1 }, (_, index) => visible.findIndex((value) => value >= index + 2));
        const sampleIntervals = completionSamples.slice(1).map((point, index) => point - completionSamples[index]);
        expect(Math.max(...sampleIntervals) - Math.min(...sampleIntervals), `${selector} wheel-step spread`).toBeLessThanOrEqual(1);
        expect(visible.every((value, index) => index === 0 || value - visible[index - 1] <= 1), `${selector} no double completion`).toBeTruthy();
      }
    }
    const reverse = await wheelMotionSamples(page, selector, -120, true);
    const reverseVisible = reverse.map((sample) => sample.visible);
    expect(reverseVisible.every((value, index) => index === 0 || value <= reverseVisible[index - 1]), `${selector} reverse`).toBeTruthy();
    expect(reverseVisible.at(-1), `${selector} reverse final`).toBe(1);
  }
});

test("motion breakpoint is shared and low windows keep a compact complete layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one breakpoint audit");
  for (const [width, height, enhanced] of [[1023, 700, false], [1024, 700, true], [1025, 700, true], [1440, 559, false], [1440, 560, true]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const selector of ["#hero", "#dark-coat", "#windbreaker", "#color-coat"]) {
      await expect(page.locator(selector)).toHaveAttribute("data-motion-enhanced", String(enhanced));
    }
    await expectNoOverflow(page);
  }
});

test("photo-story text and visible media never collide at start, mid reveals, or final", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one motion collision matrix");
  test.setTimeout(120_000);
  const stories = [
    { selector: "#hero", copy: "[class*='copy']", media: "[class*='artwork']", count: 4, progress: "--scene-progress" },
    { selector: "#dark-coat", copy: "[class*='storyCopy']", media: "[class*='darkCollage']", count: 4, progress: "--dark-progress" },
    { selector: "#windbreaker", copy: "[class*='windHeading']", media: "[class*='windFrames']", count: 5, progress: "--wind-progress" },
    { selector: "#color-coat", copy: "[class*='colorCopy']", media: "[class*='colorFrames']", count: 4, progress: "--color-progress" },
  ] as const;
  for (const [width, height] of [[1024, 650], [1280, 800], [1440, 650], [1440, 900], [1920, 650], [1920, 900]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const story of stories) {
      const section = page.locator(story.selector);
      const metrics = await motionMetrics(page, story.selector);
      const samples = [0, ...metrics.starts.slice(1).map((start, index) => (start + metrics.completes[index + 1]) / 2), ...metrics.completes.slice(1), metrics.range];
      for (const scrollPx of samples) {
        await scrollMotionSection(page, story.selector, Math.min(1, scrollPx / metrics.range), story.progress);
        const result = await section.evaluate((element, selectors) => {
          const copy = element.querySelector(selectors.copy)!.getBoundingClientRect();
          const media = element.querySelector(selectors.media)!.getBoundingClientRect();
          const gap = Math.max(media.left - copy.right, copy.left - media.right, media.top - copy.bottom, copy.top - media.bottom);
          const frames = Array.from(element.querySelectorAll<HTMLElement>("[data-motion-complete]"))
            .filter((frame) => Number(getComputedStyle(frame).opacity) > 0.01)
            .map((frame) => frame.getBoundingClientRect());
          return {
            gap,
            framesInside: frames.every((frame) => frame.left >= -1 && frame.right <= window.innerWidth + 1 && frame.top >= 73 && frame.bottom <= window.innerHeight + 1),
          };
        }, { copy: story.copy, media: story.media });
        expect(result.gap, `${story.selector} ${width}x${height} at ${scrollPx}`).toBeGreaterThanOrEqual(0);
        expect(result.framesInside, `${story.selector} frames ${width}x${height} at ${scrollPx}`).toBeTruthy();
      }
    }
  }
});

test("desktop hero fits its breakpoint and keeps the offer visible in low viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one responsive hero audit");
  for (const [width, height] of [[1024, 650], [1100, 650], [1440, 650], [1920, 650]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const hero = page.locator("#hero");
    const bounds = await hero.evaluate((element) => {
      const rect = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
      return { artwork: rect('[class*="artwork"]'), cta: rect('a[href="#selected"]') };
    });
    expect(bounds.artwork.left, `${width}x${height} artwork left`).toBeGreaterThanOrEqual(-1);
    expect(bounds.artwork.right, `${width}x${height} artwork right`).toBeLessThanOrEqual(width + 1);
    expect(bounds.cta.top, `${width}x${height} CTA top`).toBeGreaterThanOrEqual(-1);
    expect(bounds.cta.bottom, `${width}x${height} CTA bottom`).toBeLessThanOrEqual(height + 1);
    await expect(hero.getByRole("link", { name: /Смотреть фотоистории/ })).toBeVisible();
    await expectNoOverflow(page);
  }
});

test("mobile hero supports buttons, keyboard, and a visible counter", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile swipe controls");
  await page.goto("/");
  await page.getByRole("button", { name: "Следующий кадр" }).click();
  await expect(page.getByTestId("hero-counter")).toContainText("02 / 04");
  const strip = page.getByTestId("hero-strip");
  await strip.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("hero-counter")).toContainText("03 / 04");
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 320);
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test("mobile hero accepts a real horizontal touch swipe", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile touch gesture");
  await page.goto("/");
  const strip = page.getByTestId("hero-strip");
  const box = await strip.boundingBox();
  if (!box) throw new Error("Hero strip is missing");
  const client = await page.context().newCDPSession(page);
  const y = box.y + Math.min(box.height * 0.35, 220);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width * 0.82, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width * 0.18, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByTestId("hero-counter")).toContainText(/0[2-4] \/ 04/);
});

test("compact photo stories support buttons, keyboard, swipe, and vertical page scroll", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile photo-story controls");
  await page.goto("/");
  for (const selector of ["#dark-coat", "#windbreaker", "#color-coat"]) {
    const section = page.locator(selector);
    await expect(section).toHaveAttribute("data-motion-enhanced", "false");
    const controls = section.locator("[data-photo-controls]");
    await expect(controls).toBeVisible();
    await controls.getByRole("button", { name: "Следующая фотография" }).click();
    await expect(controls.locator("p")).toContainText("02 /");
    const strip = section.locator("[data-photo-strip]");
    await strip.focus();
    await page.keyboard.press("ArrowRight");
    await expect(controls.locator("p")).toContainText("03 /");
  }

  const section = page.locator("#windbreaker");
  const strip = section.locator("[data-photo-strip]");
  await strip.scrollIntoViewIfNeeded();
  const box = await strip.boundingBox();
  if (!box) throw new Error("Windbreaker strip is missing");
  const client = await page.context().newCDPSession(page);
  const y = Math.min(box.y + box.height * 0.35, 700);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width * 0.82, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width * 0.18, y }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(section.locator("[data-photo-controls] p")).toContainText(/0[2-5] \/ 05/);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 320);
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test("source and scenario comparison works with click and arrow keys", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByTestId("source-scenario-toggle");
  const source = page.getByRole("button", { name: "Исходный материал" });
  const scenario = page.getByRole("button", { name: "Визуальный сценарий" });
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await scenario.click();
  await expect(scenario).toHaveAttribute("aria-pressed", "true");
  await toggle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(source).toHaveAttribute("aria-pressed", "true");
});

test("comparison layout keeps at least 16 pixels between text and media across the collision matrix", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one exhaustive responsive collision audit");
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const widths = [600, 700, 768, 800, 899, 900, 901, 1024, 1100, 1200, 1280, 1319, 1320, 1321, 1440, 1600, 1920];
  const heights = [560, 600, 650, 700, 768, 900];
  const toggle = page.getByTestId("source-scenario-toggle");

  for (const width of widths) {
    for (const height of heights) {
      await page.setViewportSize({ width, height });
      for (const mode of ["source", "scenario"] as const) {
        await toggle.getByRole("button", { name: mode === "source" ? "Исходный материал" : "Визуальный сценарий" }).click();
        const geometry = await toggle.evaluate((media) => {
          const grid = media.parentElement!;
          const headline = grid.querySelector("h2")!.getBoundingClientRect();
          const body = grid.querySelector("h2 + p")!.getBoundingClientRect();
          const controls = media.querySelector("[role='group']")!.getBoundingClientRect();
          const stage = media.querySelector("[aria-live='polite']")!.getBoundingClientRect();
          const separatedBy = (a: DOMRect, b: DOMRect) => Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom);
          return {
            headlineMediaGap: separatedBy(headline, stage),
            bodyMediaGap: separatedBy(body, stage),
            headlineControlsGap: separatedBy(headline, controls),
            bodyControlsGap: separatedBy(body, controls),
            controlsStageGap: separatedBy(controls, stage),
            left: Math.min(controls.left, stage.left),
            right: Math.max(controls.right, stage.right),
            documentWidth: document.documentElement.scrollWidth,
          };
        });
        expect(geometry.headlineMediaGap, `${width}x${height} ${mode} headline/media`).toBeGreaterThanOrEqual(16);
        expect(geometry.bodyMediaGap, `${width}x${height} ${mode} body/media`).toBeGreaterThanOrEqual(16);
        expect(geometry.headlineControlsGap, `${width}x${height} ${mode} headline/controls`).toBeGreaterThanOrEqual(16);
        expect(geometry.bodyControlsGap, `${width}x${height} ${mode} body/controls`).toBeGreaterThanOrEqual(16);
        expect(geometry.controlsStageGap, `${width}x${height} ${mode} controls/stage`).toBeGreaterThanOrEqual(0);
        expect(geometry.left).toBeGreaterThanOrEqual(-1);
        expect(geometry.right).toBeLessThanOrEqual(width + 1);
        expect(geometry.documentWidth).toBeLessThanOrEqual(width);
      }
    }
  }
});

test("reduced motion keeps every hero frame and section visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const selector of ["#hero", "#dark-coat", "#windbreaker", "#color-coat"]) {
    await expect(page.locator(selector)).toHaveAttribute("data-motion-enhanced", "false");
    await expect(page.locator(selector)).toHaveAttribute("data-motion-listener", "inactive");
    await expect(page.locator(selector)).toHaveAttribute("data-motion-raf", "idle");
  }
  await expect(page.locator("#hero li")).toHaveCount(4);
  for (const figure of await page.locator("#dark-coat figure").all()) await expect(figure).toHaveCSS("opacity", "1");
  for (const section of await page.locator("[data-atelier-reveal]").all()) await expect(section).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().filter((item) => item.playState === "running").length)).toBe(0);
});

test("reduced motion can be toggled live in both directions", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("desktop"), "desktop live media query");
  await page.goto("/");
  const stories = ["#hero", "#dark-coat", "#windbreaker", "#color-coat"].map((selector) => page.locator(selector));
  for (const story of stories) await expect(story).toHaveAttribute("data-motion-enhanced", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const story of stories) await expect(story).toHaveAttribute("data-motion-enhanced", "false");
  expect(await page.evaluate(() => document.getAnimations().filter((item) => item.playState === "running").length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const story of stories) await expect(story).toHaveAttribute("data-motion-enhanced", "true");
});

test("atelier pages remain complete when JavaScript is disabled", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one isolated no-JS context is sufficient");
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  for (const path of ["/", "/works/atelier-in-motion"]) {
    await page.goto(`${testBaseURL}${path}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main img").first()).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expectNoOverflow(page);
    if (path === "/") {
      expect(await page.locator("#hero").evaluate((element) => (element as HTMLElement).offsetHeight)).toBeLessThan(768 * 1.6);
      expect(await page.locator("#dark-coat").evaluate((element) => (element as HTMLElement).offsetHeight)).toBeLessThan(768 * 2);
    }
  }
  const unknown = await page.goto(`${testBaseURL}/works/not-in-registry`);
  expect(unknown?.status()).toBe(404);
  await expect(page.locator(".skip-link")).toHaveCount(1);
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Такой работы нет" })).toBeVisible();
  await context.close();
});

test("mobile atelier controls meet the 44 pixel touch target", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "touch target audit");
  await page.goto("/");
  const controls = page.locator(
    ".skip-link, header button:visible, header a:visible, main button:visible, main a:visible, footer button:visible, footer a:visible",
  );
  for (let index = 0; index < await controls.count(); index += 1) {
    const box = await controls.nth(index).boundingBox();
    if (!box) continue;
    expect(box.width, `target ${index} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `target ${index} height`).toBeGreaterThanOrEqual(44);
  }
});

test("320 and 1920 widths have no document overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one cross-width audit is sufficient");
  test.setTimeout(90_000);
  for (const width of [320, 1920]) {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 1080 });
    for (const path of ["/", "/works", "/works/storm", "/works/silhouette", "/works/atelier-in-motion"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expectNoOverflow(page);
    }
  }
});

test("reviewer responsive matrix keeps the unified shell, headings, and touch actions inside the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one exhaustive reviewer matrix");
  test.setTimeout(180_000);
  const viewports = [
    [320, 568], [360, 800], [375, 667], [375, 812], [390, 844], [430, 932],
    [768, 1024], [1024, 768], [1024, 650], [1280, 800], [1440, 650], [1440, 900],
    [1920, 650], [1920, 900], [844, 390], [720, 800],
  ] as const;
  const paths = ["/", "/works", "/works/storm", "/works/atelier-in-motion"];

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const path of paths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("header.site-header"), `${path} ${width}x${height} header`).toBeVisible();
      await expect(page.locator("footer.site-footer"), `${path} ${width}x${height} footer`).toBeAttached();
      await expectNoOverflow(page);
      const issues = await page.evaluate(({ checkTargets }) => {
        const failures: string[] = [];
        const viewportWidth = window.innerWidth;
        for (const heading of document.querySelectorAll<HTMLElement>("h1, h2, h3")) {
          const rect = heading.getBoundingClientRect();
          if (rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1)) failures.push(`heading: ${heading.textContent?.trim().slice(0, 32)}`);
        }
        if (checkTargets) {
          for (const element of document.querySelectorAll<HTMLElement>("a, button, select")) {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) continue;
            if (rect.width < 44 || rect.height < 44) failures.push(`target ${Math.round(rect.width)}x${Math.round(rect.height)}: ${element.textContent?.trim().slice(0, 28)}`);
          }
        }
        return failures;
      }, { checkTargets: width <= 430 });
      expect(issues, `${path} ${width}x${height}`).toEqual([]);
    }
  }
});

test("display headings keep whole words and stay inside every control viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one cross-width typography audit");
  test.setTimeout(120_000);
  for (const [width, height] of [[320, 700], [375, 812], [768, 900], [900, 650], [1024, 700], [1100, 768], [1280, 900], [1440, 900], [1920, 900]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const issues = await page.locator("h1, h2, h3").evaluateAll((headings) => {
      const failures: string[] = [];
      headings.forEach((heading, headingIndex) => {
        const style = getComputedStyle(heading);
        const bounds = heading.getBoundingClientRect();
        if (style.overflowWrap === "anywhere" || style.wordBreak === "break-all") failures.push(`${headingIndex}: unsafe wrapping`);
        if (bounds.left < -1 || bounds.right > window.innerWidth + 1) failures.push(`${headingIndex}: heading outside viewport`);
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode() as Text | null;
        while (node) {
          for (const match of node.data.matchAll(/[^\s.,:;!?()]+/gu)) {
            const range = document.createRange();
            range.setStart(node, match.index ?? 0);
            range.setEnd(node, (match.index ?? 0) + match[0].length);
            const wordRects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
            if (wordRects.length !== 1) failures.push(`${headingIndex}: split word ${match[0]}`);
            if (wordRects.some((rect) => rect.left < -1 || rect.right > window.innerWidth + 1)) failures.push(`${headingIndex}: clipped word ${match[0]}`);
          }
          node = walker.nextNode() as Text | null;
        }
      });
      return failures;
    });
    expect(issues, `${width}x${height}`).toEqual([]);
    await expectNoOverflow(page);
  }
});

test("every public route passes landmarks, network, axe, overflow, and asset hygiene crawl", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one exhaustive registry crawl");
  test.setTimeout(180_000);
  const paths = ["/", "/works", "/works/atelier-in-motion", ...publicCases.map((item) => `/works/${item.slug}`)];
  for (const path of paths) {
    const errors: string[] = [];
    const external: string[] = [];
    const onConsole = (message: { type(): string; text(): string }) => { if (message.type() === "error") errors.push(message.text()); };
    const onPageError = (error: Error) => errors.push(error.message);
    const onResponse = (response: { status(): number; url(): string; request(): { resourceType(): string } }) => {
      if (response.status() >= 400 && response.request().resourceType() !== "document") errors.push(`${response.status()} ${response.url()}`);
    };
    const onRequest = (request: { url(): string }) => {
      const url = new URL(request.url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname) && !["data:", "blob:"].includes(url.protocol)) external.push(request.url());
    };
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("response", onResponse);
    page.on("request", onRequest);
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("main"), `${path} main`).toHaveCount(1);
    await expect(page.locator("h1"), `${path} h1`).toHaveCount(1);
    await expect(page.locator("footer"), `${path} footer`).toHaveCount(1);
    await expect(page.locator(".skip-link"), `${path} skip link`).toHaveCount(1);
    await expectNoOverflow(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")), path).toEqual([]);
    const runtimeSources = await page.locator("img").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).currentSrc || image.getAttribute("src") || ""));
    expect(runtimeSources.filter((source) => /photo_64|_thumb|\.jpe?g(?:\?|$)/i.test(source)), path).toEqual([]);
    expect(await page.locator('link[rel="preload"][as="image"]').count(), `${path} image preloads`).toBeLessThanOrEqual(1);
    expect((await page.content()).includes("photo_64"), path).toBeFalsy();
    expect(errors, path).toEqual([]);
    expect(external, path).toEqual([]);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
    page.off("request", onRequest);
  }

  const redirect = await page.goto("/cases/storm");
  expect(redirect?.status()).toBe(200);
  await expect(page).toHaveURL(/\/works\/storm$/);
  const unknown = await page.goto("/works/not-in-registry");
  expect(unknown?.status()).toBe(404);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  for (const path of paths.filter((item) => item !== "/")) expect(sitemapText).toContain(path);
});

test("skip link focuses main across every route family", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one keyboard audit");
  for (const path of ["/", "/works", "/works/storm", "/works/atelier-in-motion", "/works/not-in-registry", "/not-a-public-route"]) {
    await page.goto(path);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link"), path).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main"), path).toBeFocused();
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Елена Бадьина, главная" })).toBeFocused();
});

test("homepage motion does not introduce measurable layout shift", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one CLS audit");
  await page.addInitScript(() => {
    (window as unknown as { __atelierCls: number }).__atelierCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
        if (!entry.hadRecentInput) (window as unknown as { __atelierCls: number }).__atelierCls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += 500) {
    await page.evaluate((value) => window.scrollTo(0, value), top);
    await page.waitForTimeout(12);
  }
  expect(await page.evaluate(() => (window as unknown as { __atelierCls: number }).__atelierCls)).toBeLessThanOrEqual(0.01);
});
