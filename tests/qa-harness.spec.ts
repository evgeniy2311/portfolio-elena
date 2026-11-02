import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PHASE_DEVELOPMENT_SERVER, PHASE_EXPORT, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import nextConfig from "../next.config";
import { parseQaFixture } from "../lib/site";
import { QA_SENTINEL, qaVideoRoute } from "./fixtures/site";

/*
 * Стенд состояний. Dev-сервер с NEXT_PUBLIC_QA_FIXTURE=contacts,videos поднимает playwright.config.ts на порту 3001.
 * Production и export с флагом не собираются, а в готовой сборке нет следов тестовых данных.
 */
const root = path.resolve(__dirname, "..");
// PLAYWRIGHT_QA_URL — свой стенд, когда тесты идут против уже запущенного сервера (PLAYWRIGHT_BASE_URL).
const qaOrigin = process.env.PLAYWRIGHT_QA_URL ?? "http://127.0.0.1:3001";

test.describe("dev-сервер с тестовыми данными", () => {
  test.use({ baseURL: qaOrigin });

  test("contacts: в блоке контактов тестовая ссылка Telegram", async ({ page }) => {
    await page.goto("/");
    const telegram = page.locator("#contact a[href^='https://t.me/']");
    await expect(telegram).toHaveAttribute("href", /^https:\/\/t\.me\/qa_fixture_sentinel\?text=/);
    await expect(telegram).toHaveAttribute("target", "_blank");
    await expect(telegram).toHaveAttribute("rel", /noopener/);
  });

  test("videos: тестовый поток настоящий и проигрывается в HTML video", async ({ page }) => {
    await page.route(`**${qaVideoRoute}-*`, (route) => {
      const ext = route.request().url().endsWith(".webm") ? "webm" : "mp4";
      return route.fulfill({ path: path.join(__dirname, `fixtures/qa-video.${ext}`), contentType: `video/${ext}` });
    });
    await page.goto("/");
    for (const [ext, type] of [["webm", "video/webm"], ["mp4", "video/mp4"]] as const) {
      const state = await page.evaluate(
        async ({ src, type }) => {
          const video = document.createElement("video");
          video.muted = true;
          video.playsInline = true;
          video.preload = "auto";
          const source = document.createElement("source");
          source.src = src;
          source.type = type;
          video.append(source);
          document.body.append(video);
          await new Promise<void>((resolve, reject) => {
            video.addEventListener("loadeddata", () => resolve(), { once: true });
            video.addEventListener("error", () => reject(new Error("video error")), { once: true });
            source.addEventListener("error", () => reject(new Error("source error")), { once: true });
            setTimeout(() => reject(new Error("timeout")), 8000);
          });
          const result = { readyState: video.readyState, duration: video.duration, width: video.videoWidth };
          video.remove();
          return result;
        },
        { src: `${qaVideoRoute}-1.${ext}`, type },
      );
      expect(state.readyState, ext).toBeGreaterThanOrEqual(2);
      expect(state.duration, ext).toBeGreaterThan(0.5);
      expect(state.width, ext).toBe(240);
    }
  });

  test("videos: блок показывает четыре настоящих HTML video", async ({ page }) => {
    await page.goto("/");
    const videos = page.locator("#video video");
    await expect(videos).toHaveCount(4);
    for (const video of await videos.all()) await expect(video.locator("source")).toHaveCount(2);
    await expect(page.locator("#video")).not.toContainText("Ролики скоро");
  });
});

test.describe("защита сборки", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Проверка сборки не зависит от ширины экрана");
  });

  test("неизвестное значение флага даёт явную ошибку", () => {
    expect([...parseQaFixture("contacts,videos")]).toEqual(["contacts", "videos"]);
    expect(parseQaFixture(undefined).size).toBe(0);
    expect(parseQaFixture("").size).toBe(0);
    expect(() => parseQaFixture("contact")).toThrow(/неизвестное значение «contact»/);
    expect(() => parseQaFixture("videos,prices")).toThrow(/«prices»/);
  });

  test("next.config: флаг разрешён только dev-серверу без basePath", () => {
    const saved = { qa: process.env.NEXT_PUBLIC_QA_FIXTURE, base: process.env.NEXT_PUBLIC_BASE_PATH };
    try {
      process.env.NEXT_PUBLIC_QA_FIXTURE = "contacts";
      delete process.env.NEXT_PUBLIC_BASE_PATH;
      for (const phase of [PHASE_PRODUCTION_BUILD, PHASE_EXPORT, PHASE_PRODUCTION_SERVER]) expect(() => nextConfig(phase), phase).toThrow(/только для next dev/);
      expect(nextConfig(PHASE_DEVELOPMENT_SERVER).distDir).toBe(".next-qa");
      process.env.NEXT_PUBLIC_BASE_PATH = "/portfolio-elena";
      expect(() => nextConfig(PHASE_DEVELOPMENT_SERVER)).toThrow(/только для next dev/);
      delete process.env.NEXT_PUBLIC_QA_FIXTURE;
      expect(nextConfig(PHASE_PRODUCTION_BUILD).output).toBe("export");
    } finally {
      for (const [key, value] of [["NEXT_PUBLIC_QA_FIXTURE", saved.qa], ["NEXT_PUBLIC_BASE_PATH", saved.base]] as const) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  test("production и export с флагом: сборка останавливается до Next", () => {
    for (const env of [{}, { NEXT_PUBLIC_BASE_PATH: "/portfolio-elena" }]) {
      const started = Date.now();
      const result = spawnSync(process.execPath, [path.join(root, "scripts/build-site.mjs")], {
        cwd: root,
        env: { ...process.env, ...env, NEXT_PUBLIC_QA_FIXTURE: "videos" },
        encoding: "utf8",
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("запрещены в production и export");
      expect(Date.now() - started).toBeLessThan(5000);
      expect(fs.existsSync(path.join(root, "proxy.ts"))).toBe(true);
    }
  });

  test("готовая сборка чистая, а проверка находит подброшенный маркер", () => {
    const clean = spawnSync(process.execPath, [path.join(root, "scripts/assert-production-clean.mjs")], { cwd: root, encoding: "utf8" });
    expect(clean.stdout + clean.stderr).toContain("чисто");
    expect(clean.status).toBe(0);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-scan-"));
    fs.mkdirSync(path.join(dir, "static/chunks"), { recursive: true });
    fs.writeFileSync(path.join(dir, "static/chunks/app.js"), `const t="https://t.me/${QA_SENTINEL.replaceAll("-", "_")}";`);
    const dirty = spawnSync(process.execPath, [path.join(root, "scripts/assert-production-clean.mjs"), dir], { encoding: "utf8" });
    expect(dirty.status).toBe(1);
    expect(dirty.stderr).toContain("app.js");
  });
});
