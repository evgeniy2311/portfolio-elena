import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import devConfig from "../playwright.config";
import pagesConfig from "../playwright.pages.config";
import { basePath, go, withBase } from "./helpers/navigation";

/*
 * Стенд GitHub Pages (npm run test:pages): статичная сборка out/ под /portfolio-elena и сама сборка.
 * Проверки сборки не зависят от ширины экрана и идут один раз, в проекте desktop-1440.
 */

const root = path.resolve(__dirname, "..");

/** Сырой HTTP-запрос: page.goto и fetch нормализуют «..» в адресе раньше, чем он дойдёт до сервера. */
function rawGet(rawPath: string) {
  return new Promise<{ status: number; body: string; location?: string }>((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port: 3100, path: rawPath, method: "GET" }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, body, location: response.headers.location }));
    });
    request.on("error", reject);
    request.end();
  });
}

test.describe("стенд Pages", () => {
  test("архив по адресу с префиксом отдаётся со статусом 200", async ({ page }) => {
    const response = await go(page, "/works/");
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain(`${basePath}/works/`);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("неизвестный путь отдаёт 404 без подмены главной страницей", async ({ page }) => {
    const response = await go(page, "/no-such-page/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("#services")).toHaveCount(0);
    const outside = await rawGet("/works/");
    expect(outside.status).toBe(404);
  });

  test("каталог без косой черты перенаправляется, как на Pages", async () => {
    const response = await rawGet(`${basePath}/works`);
    expect(response.status).toBe(301);
    expect(response.location).toBe(`${basePath}/works/`);
  });

  test("обход каталога и битая кодировка не читают файлы вне out/", async () => {
    const secret = fs.readFileSync(path.join(root, "package.json"), "utf8").slice(0, 40);
    for (const attack of [`${basePath}/../package.json`, `${basePath}/%2e%2e/package.json`, `${basePath}/%2E%2E%2Fpackage.json`, `${basePath}/..%5cpackage.json`, `${basePath}/%00index.html`, `${basePath}/%E0%A4%A`]) {
      const response = await rawGet(attack);
      expect([400, 404], attack).toContain(response.status);
      expect(response.body, attack).not.toContain(secret);
    }
  });

  test("ресурсы отдаются с правильным типом", async ({ request }) => {
    const html = await request.get(withBase("/"));
    expect(html.headers()["content-type"]).toContain("text/html");
    const css = (await html.text()).match(/href="([^"]+\.css)"/)?.[1];
    expect(css, "в HTML есть ссылка на CSS").toBeTruthy();
    expect((await request.get(css!)).headers()["content-type"]).toContain("text/css");
  });
});

test.describe("сборка", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Проверка сборки не зависит от ширины экрана");
  });

  test("dev и Pages наборы не переиспользуют случайно запущенный сервер", () => {
    const servers = [devConfig.webServer, pagesConfig.webServer].flatMap((server) => (Array.isArray(server) ? server : server ? [server] : []));
    expect(servers.length).toBeGreaterThanOrEqual(2);
    for (const server of servers) expect(server.reuseExistingServer).toBe(false);
  });

  /** Временный проект с поддельным Next, чтобы проверить обёртку сборки без настоящей сборки. */
  function fakeProject(nextScript: string) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-site-"));
    fs.mkdirSync(path.join(dir, "node_modules/next/dist/bin"), { recursive: true });
    fs.writeFileSync(path.join(dir, "node_modules/next/dist/bin/next"), nextScript);
    fs.writeFileSync(path.join(dir, "proxy.ts"), "export const original = true;\n");
    return dir;
  }

  function runBuild(dir: string, env: Record<string, string> = {}) {
    const { NEXT_PUBLIC_QA_FIXTURE: _qa, NEXT_PUBLIC_BASE_PATH: _base, ...rest } = process.env;
    void _qa;
    void _base;
    return spawnSync(process.execPath, [path.join(root, "scripts/build-site.mjs")], { cwd: dir, env: { ...rest, ...env }, encoding: "utf8" });
  }

  test("сбой Next при export-сборке: proxy.ts сохранён и возвращён", () => {
    const dir = fakeProject(`const fs = require("fs"); if (fs.existsSync("proxy.ts")) { console.error("proxy.ts не убран"); process.exit(9); } process.exit(1);`);
    const result = runBuild(dir, { NEXT_PUBLIC_BASE_PATH: "/portfolio-elena" });
    expect(result.status).toBe(1);
    expect(fs.readFileSync(path.join(dir, "proxy.ts"), "utf8")).toBe("export const original = true;\n");
    expect(fs.existsSync(path.join(dir, ".proxy.ts.export-backup"))).toBe(false);
    expect(fs.existsSync(path.join(dir, ".build-site.lock"))).toBe(false);
  });

  test("обычная сборка не трогает proxy.ts", () => {
    const dir = fakeProject(`const fs = require("fs"); process.exit(fs.existsSync("proxy.ts") ? 0 : 9);`);
    expect(runBuild(dir).status).toBe(0);
  });

  test("оставшаяся резервная копия: сборка останавливается и ничего не перезаписывает", () => {
    const dir = fakeProject(`process.exit(0);`);
    fs.writeFileSync(path.join(dir, ".proxy.ts.export-backup"), "export const backup = true;\n");
    const result = runBuild(dir, { NEXT_PUBLIC_BASE_PATH: "/portfolio-elena" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("резервная копия");
    expect(fs.readFileSync(path.join(dir, "proxy.ts"), "utf8")).toBe("export const original = true;\n");
    expect(fs.readFileSync(path.join(dir, ".proxy.ts.export-backup"), "utf8")).toBe("export const backup = true;\n");
  });

  test("вторая сборка во время первой получает понятный отказ", () => {
    const dir = fakeProject(`process.exit(0);`);
    fs.writeFileSync(path.join(dir, ".build-site.lock"), "123");
    const result = runBuild(dir, { NEXT_PUBLIC_BASE_PATH: "/portfolio-elena" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("другая сборка");
    expect(fs.existsSync(path.join(dir, "proxy.ts"))).toBe(true);
  });
});
