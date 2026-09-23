import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const output = process.argv[2] ?? "artifacts/screenshots/equal-step-2026-08-22";
const baseURL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000";

const shots = [
  { name: "home-320", path: "/", width: 320, height: 568, fullPage: true, touch: true },
  { name: "home-375", path: "/", width: 375, height: 812, fullPage: true, touch: true },
  { name: "home-430", path: "/", width: 430, height: 932, fullPage: true, touch: true },
  { name: "home-768", path: "/", width: 768, height: 1024, fullPage: true },
  { name: "home-1024", path: "/", width: 1024, height: 768, fullPage: false },
  { name: "home-1440", path: "/", width: 1440, height: 900, fullPage: false },
  { name: "home-1920", path: "/", width: 1920, height: 900, fullPage: false },
  { name: "home-low-1440", path: "/", width: 1440, height: 650, fullPage: false },
  { name: "home-low-1920", path: "/", width: 1920, height: 650, fullPage: false },
  ...[1, 2, 3, 4].map((frame) => ({ name: `hero-complete-${frame}`, path: "/", width: 1440, height: 900, selector: "#hero", completeFrame: frame })),
  ...[1, 2, 3, 4].map((frame) => ({ name: `dark-coat-complete-${frame}`, path: "/", width: 1440, height: 900, selector: "#dark-coat", completeFrame: frame })),
  ...[1, 2, 3, 4, 5].map((frame) => ({ name: `windbreaker-complete-${frame}`, path: "/", width: 1440, height: 900, selector: "#windbreaker", completeFrame: frame })),
  ...[1, 2, 3, 4].map((frame) => ({ name: `color-coat-complete-${frame}`, path: "/", width: 1440, height: 900, selector: "#color-coat", completeFrame: frame })),
  ...[768, 900, 1024, 1100, 1280, 1440].map((width) => ({ name: `compare-${width}`, path: "/", width, height: 768, scrollSelector: "#compare" })),
  { name: "home-reduced-motion", path: "/", width: 1440, height: 1000, fullPage: true, reduced: true },
  { name: "home-no-js", path: "/", width: 1024, height: 768, fullPage: true, javaScriptEnabled: false },
  { name: "flagship-story", path: "/works/atelier-in-motion", width: 1440, height: 1000, fullPage: true },
  { name: "demo-story", path: "/works/storm", width: 1440, height: 1000, fullPage: true },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    isMobile: shot.touch === true,
    hasTouch: shot.touch === true,
    javaScriptEnabled: shot.javaScriptEnabled !== false,
  });
  if (shot.reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseURL}${shot.path}`, { waitUntil: "domcontentloaded" });
  if (shot.javaScriptEnabled === false) {
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
    await page.keyboard.press("Home");
  } else {
    await page.evaluate(async (walkPage) => {
      await document.fonts.ready;
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      if (walkPage) {
        for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(500, window.innerHeight * 0.8)) {
          window.scrollTo(0, y);
          await wait(30);
        }
      }
      window.scrollTo(0, 0);
      await wait(160);
    }, shot.fullPage === true);
  }
  if (shot.selector) {
    await page.locator(shot.selector).evaluate((element, options) => {
      const stage = element.querySelector("[data-motion-stage]") ?? element.firstElementChild;
      if (!(stage instanceof HTMLElement)) throw new Error("Motion stage is missing");
      const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
      const sectionTop = element.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, element.offsetHeight - stage.offsetHeight);
      const frame = options.completeFrame ? element.querySelector(`[data-motion-complete][data-frame='${options.completeFrame}'], [data-motion-complete][data-photo='${options.completeFrame}'], [data-motion-complete]:nth-of-type(${options.completeFrame})`) : null;
      const completePx = frame instanceof HTMLElement ? Number(frame.dataset.motionCompletePx) : null;
      const target = completePx === null || Number.isNaN(completePx) ? range * (options.progress ?? 0) : completePx;
      window.scrollTo(0, sectionTop - stickyTop + target);
    }, { progress: shot.progress, completeFrame: shot.completeFrame });
    await page.waitForTimeout(260);
  }
  if (shot.scrollSelector) {
    await page.locator(shot.scrollSelector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);
  }
  await page.screenshot({ path: `${output}/${shot.name}.png`, fullPage: shot.fullPage });
  await page.close();
}

await browser.close();
