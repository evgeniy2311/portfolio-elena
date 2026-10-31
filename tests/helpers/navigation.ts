import type { Page } from "@playwright/test";

/*
 * Общая навигация для двух стендов: dev-сервера (без префикса) и статичной сборки GitHub Pages
 * (playwright.pages.config.ts задаёт PW_BASE_PATH=/portfolio-elena). baseURL в обоих конфигах — только origin,
 * поэтому путь «/works» сам по себе ушёл бы мимо префикса: helper добавляет его явно.
 */
export const basePath = process.env.PW_BASE_PATH ?? "";
export const isPages = basePath !== "";

/** `/works` → `/portfolio-elena/works` на стенде Pages. Внешние и относительные адреса не трогает. */
export function withBase(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) return path;
  return `${basePath}${path}`;
}

export function go(page: Page, path: string) {
  return page.goto(withBase(path));
}

/** Регулярное выражение для адреса страницы с учётом префикса и косой черты в конце (Pages: trailingSlash). */
export function urlPattern(path: string) {
  const escaped = withBase(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\/$/, "");
  return new RegExp(`${escaped}/?(?:[?#].*)?$`);
}
