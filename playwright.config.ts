import { defineConfig } from "@playwright/test";

/*
 * Dev-стенд: `next dev` на 3000. Сервер всегда запускается заново (reuseExistingServer: false):
 * случайно оставленный процесс на порту даёт явную ошибку, а не прогон против старого кода.
 * Второй dev-сервер на 3001 — стенд состояний с NEXT_PUBLIC_QA_FIXTURE (только dev, в сборку не попадает).
 * Статичная сборка GitHub Pages проверяется отдельным конфигом playwright.pages.config.ts.
 * Сравнение «рефакторинг без изменения вида» (refactor-parity) запускается только с PARITY=1.
 */
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export const projects = [
  { name: "mobile-375", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
  { name: "laptop-1024", use: { viewport: { width: 1024, height: 768 } } },
  { name: "desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
];

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/export.spec.ts", ...(process.env.PARITY ? [] : ["**/refactor-parity.spec.ts"])],
  timeout: 45_000,
  use: { baseURL: externalBaseURL ?? "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: externalBaseURL
    ? undefined
    : [
        { command: "npm run dev -- --hostname 127.0.0.1 --port 3000", url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 120_000 },
        // Стенд состояний (tests/qa-harness.spec.ts): тестовые контакты и ролики, свой каталог .next-qa.
        {
          command: "npm run dev -- --hostname 127.0.0.1 --port 3001",
          url: "http://127.0.0.1:3001",
          env: { NEXT_PUBLIC_QA_FIXTURE: "contacts,videos" },
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ],
  projects,
});
