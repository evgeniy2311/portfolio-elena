import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const output = process.argv[2] ?? "artifacts/screenshots/final";
const baseURL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  [320, 700],
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 1000],
  [1920, 1080],
];
const pages = [
  ["home", "/", "h1"],
  ["works", "/works", ".archive-row:visible, .archive-card:visible"],
  ["with-sources", "/works/storm", "#sources"],
  ["without-sources", "/works/silhouette", ".final-funnel"],
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const [width, height] of viewports) {
  const page = await browser.newPage({ viewport: { width, height } });
  for (const [name, path, readySelector] of pages) {
    await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
    await page.locator(readySelector).first().waitFor({ state: "visible" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(500, window.innerHeight * .8)) {
        window.scrollTo(0, y);
        await wait(35);
      }
      window.scrollTo(0, 0);
      await Promise.all(Array.from(document.images).filter((image) => image.currentSrc).map((image) => image.decode().catch(() => undefined)));
    });
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
