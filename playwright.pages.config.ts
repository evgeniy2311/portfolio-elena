import { defineConfig } from "@playwright/test";
import { projects } from "./playwright.config";

/*
 * Стенд GitHub Pages: настоящая статичная сборка out/ под префиксом /portfolio-elena.
 * Перед запуском: NEXT_PUBLIC_BASE_PATH=/portfolio-elena npm run build.
 * Server redirects и proxy в статике не существуют: такие проверки остаются в dev-наборе.
 */
const basePath = "/portfolio-elena";
process.env.PW_BASE_PATH = basePath;

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/refactor-parity.spec.ts", "**/qa-harness.spec.ts"],
  timeout: 45_000,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: {
    command: `node scripts/serve-export.mjs`,
    url: `http://127.0.0.1:3100${basePath}/`,
    env: { PORT: "3100", BASE_PATH: basePath, EXPORT_DIR: "out" },
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects,
});
