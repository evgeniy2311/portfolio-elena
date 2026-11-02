import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import media from "../lib/works-media.json";
import { RESPONSIVE_WIDTHS, pickSlot, responsivePath, responsiveSrcSet, responsiveWidths, withBase } from "../lib/media-path";
import { go, isPages } from "./helpers/navigation";

/*
 * Адаптивные изображения: AVIF и WebP 320/480/640/960 для каждого кадра, Photo с <picture>,
 * плитка с теми же пропорциями при загрузке и отказе, без /_next/image и двойного префикса.
 */

const root = path.resolve(__dirname, "..");
const script = path.join(root, "scripts/build-images.mjs");
const nodeOnly = (projectName: string) => test.skip(projectName !== "desktop-1440", "Проверка файлов не зависит от ширины экрана");

test.describe("файлы", () => {
  test.beforeEach(({}, testInfo) => nodeOnly(testInfo.project.name));

  test("каждый кадр и исходник: AVIF и WebP всех слотов с правильной шириной", async () => {
    const source = fs.readFileSync(script, "utf8");
    expect(source).toContain(`const WIDTHS = [${RESPONSIVE_WIDTHS.join(", ")}]`);
    const images = Object.values(media).flatMap((entry) => [...entry.source, ...entry.frames]);
    expect(images.length).toBeGreaterThan(200);
    const problems: string[] = [];
    await Promise.all(
      images.map(async (image) => {
        for (const slot of RESPONSIVE_WIDTHS) {
          for (const format of ["avif", "webp"] as const) {
            const file = path.join(root, "public", responsivePath(image.src, slot, format, "")!);
            if (!fs.existsSync(file)) {
              problems.push(`нет ${file}`);
              continue;
            }
            const meta = await sharp(file).metadata();
            const expected = Math.min(slot, image.width);
            if (Math.abs((meta.width ?? 0) - expected) > 1) problems.push(`${file}: ширина ${meta.width}, нужно ${expected}`);
            if (meta.format !== (format === "avif" ? "heif" : "webp")) problems.push(`${file}: формат ${meta.format}`);
            const ratio = (meta.height ?? 0) / (meta.width ?? 1);
            if (Math.abs(ratio - image.height / image.width) > 0.01) problems.push(`${file}: пропорции ${ratio}`);
          }
        }
      }),
    );
    expect(problems.slice(0, 10)).toEqual([]);
  });

  test("повторный запуск ничего не размножает и не сканирует _r", () => {
    const list = () => {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) (entry.isDirectory() ? walk : (file: string) => files.push(file))(path.join(dir, entry.name));
      };
      walk(path.join(root, "public/works/_r"));
      return files.sort();
    };
    const before = list();
    const run = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toContain("построено 0");
    expect(list()).toEqual(before);
    expect(before.some((file) => file.includes(`${path.sep}_r${path.sep}_r`) || /-(320|480|640|960)-(320|480|640|960)\./.test(path.basename(file)))).toBe(false);
  });

  test("нет файла или испорчен реестр: выход с ошибкой и путём", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "images-"));
    fs.mkdirSync(path.join(dir, "public/works/coat"), { recursive: true });
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ coat: { source: [], frames: [{ src: "/works/coat/frame-01.webp", width: 10, height: 10 }] } }));
    const missing = spawnSync(process.execPath, [script, "--manifest", path.join(dir, "manifest.json"), "--public", path.join(dir, "public")], { cwd: dir, encoding: "utf8" });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain(path.join("works", "coat", "frame-01.webp"));

    fs.writeFileSync(path.join(dir, "broken.json"), "{ not json");
    const broken = spawnSync(process.execPath, [script, "--manifest", path.join(dir, "broken.json"), "--public", path.join(dir, "public")], { cwd: dir, encoding: "utf8" });
    expect(broken.status).toBe(1);
    expect(broken.stderr).toContain("broken.json");

    fs.writeFileSync(path.join(dir, "outside.json"), JSON.stringify({ x: { source: [], frames: [{ src: "/../../etc/hosts", width: 1, height: 1 }] } }));
    const outside = spawnSync(process.execPath, [script, "--manifest", path.join(dir, "outside.json"), "--public", path.join(dir, "public")], { cwd: dir, encoding: "utf8" });
    expect(outside.status).toBe(1);
  });

  test("пути: префикс подпапки не удваивается, слоты и srcset с фактической шириной", () => {
    const base = "/portfolio-elena";
    expect(withBase("/works/a/frame-01.webp", base)).toBe("/portfolio-elena/works/a/frame-01.webp");
    expect(withBase("/portfolio-elena/works/a/frame-01.webp", base)).toBe("/portfolio-elena/works/a/frame-01.webp");
    expect(withBase("https://t.me/x", base)).toBe("https://t.me/x");
    expect(responsivePath("/portfolio-elena/works/a/frame-01.webp", 480, "avif", base)).toBe("/portfolio-elena/works/_r/a/frame-01-480.avif");
    expect(responsivePath("/works/a/frame-01.webp", 480, "webp", "")).toBe("/works/_r/a/frame-01-480.webp");
    expect(responsivePath("/works/_r/a/frame-01-480.webp", 320, "webp", "")).toBeNull();
    expect(responsivePath("/icon.svg", 320, "webp", "")).toBeNull();
    expect(responsiveWidths(768)).toEqual([
      { slot: 320, width: 320 },
      { slot: 480, width: 480 },
      { slot: 640, width: 640 },
      { slot: 960, width: 768 },
    ]);
    expect(responsiveWidths(620).map(({ width }) => width)).toEqual([320, 480, 620]);
    expect(responsiveSrcSet("/works/a/f.webp", 955, "avif", "")).toBe("/works/_r/a/f-320.avif 320w, /works/_r/a/f-480.avif 480w, /works/_r/a/f-640.avif 640w, /works/_r/a/f-960.avif 955w");
    expect([pickSlot(16), pickSlot(320), pickSlot(321), pickSlot(750), pickSlot(3840)]).toEqual([320, 320, 480, 960, 960]);
  });
});

/** Пропорции и положение кадра блока «Почему так бывает» (первый Photo с ленивой загрузкой). */
async function painBox(page: Page) {
  const image = page.locator("section[aria-labelledby=pains-title] img[data-photo]").first();
  await image.scrollIntoViewIfNeeded();
  return image;
}

test.describe("на странице", () => {
  test("375: браузер берёт небольшой адаптивный AVIF; нигде нет /_next/image и двойного префикса", async ({ page }) => {
    await go(page, "/");
    const hero = page.locator("main img[data-photo]").first();
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    const current = await hero.evaluate((image: HTMLImageElement) => image.currentSrc);
    expect(current).toMatch(/\/works\/_r\/[^/]+\/[^/]+-(320|480|640|960)\.avif$/);
    if (page.viewportSize()!.width <= 375) expect(current).toMatch(/-(320|480)\.avif$/);
    for (const route of ["/", "/works", "/works/burgundy-coat-city"]) {
      await go(page, route);
      const urls = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img, source")).flatMap((element) => [element.getAttribute("src") ?? "", element.getAttribute("srcset") ?? ""]).join(" "),
      );
      expect(urls, route).not.toContain("/_next/image");
      expect(urls, route).not.toContain("/portfolio-elena/portfolio-elena");
      if (isPages) for (const url of urls.split(/[\s,]+/).filter((item) => item.startsWith("/works"))) expect(url, route).toContain("/portfolio-elena/");
    }
  });

  test("кадр грузится: плитка --surface с пропорциями кадра, без сдвига раскладки", async ({ page }) => {
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/works/_r/beige-windbreaker/source-1-*", async (route) => {
      await held;
      await route.continue();
    });
    await go(page, "/");
    const image = await painBox(page);
    const before = await image.evaluate((element: HTMLImageElement) => {
      // offsetTop/offsetHeight не зависят от анимации появления (transform) родителя.
      return { width: element.offsetWidth, height: element.offsetHeight, top: element.offsetTop, bg: getComputedStyle(element).backgroundColor, complete: element.complete && element.naturalWidth > 0 };
    });
    expect(before.complete).toBe(false);
    expect(before.height).toBeGreaterThan(50);
    expect(before.bg).toBe("rgb(236, 229, 219)");
    release();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    const after = await image.evaluate((element: HTMLImageElement) => ({ width: element.offsetWidth, height: element.offsetHeight, top: element.offsetTop }));
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
  });

  test("кадр не загрузился: та же плитка, без значка битой картинки и сдвига", async ({ page }) => {
    await page.route("**/works/_r/beige-windbreaker/source-1-*", (route) => route.abort());
    await go(page, "/");
    const image = await painBox(page);
    await expect(image).toHaveAttribute("data-failed", "");
    // Подменённый прозрачный кадр декодируется без ошибки: браузер не рисует значок битой картинки.
    // (naturalWidth у <img> внутри <picture> после подмены Chromium отдаёт 0, поэтому проверяется decode.)
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.decode().then(() => element.complete, () => false))).toBe(true);
    const state = await image.evaluate((element: HTMLImageElement) => {
      const rect = element.getBoundingClientRect();
      return { ratio: rect.height / rect.width, expected: Number(element.getAttribute("height")) / Number(element.getAttribute("width")), src: element.currentSrc, bg: getComputedStyle(element).backgroundColor, alt: element.alt };
    });
    expect(state.src).toMatch(/^data:image\/svg\+xml/);
    expect(state.bg).toBe("rgb(236, 229, 219)");
    expect(state.alt.length).toBeGreaterThan(0);
    const aspect = await image.evaluate((element) => getComputedStyle(element).aspectRatio);
    if (aspect === "auto" || aspect.startsWith("auto")) expect(Math.abs(state.ratio - state.expected)).toBeLessThan(0.02);
  });
});
