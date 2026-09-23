import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: { command: "npm run dev -- --hostname 127.0.0.1 --port 3000", url: "http://127.0.0.1:3000", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "mobile-375", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "laptop-1024", use: { viewport: { width: 1024, height: 768 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
  ],
});
