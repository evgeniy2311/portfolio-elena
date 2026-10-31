import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/*
 * Превью для просмотра без установки: статичная сборка для GitHub Pages (.github/workflows/preview.yml).
 * Стенд состояний NEXT_PUBLIC_QA_FIXTURE разрешён только dev-серверу: любая другая фаза (сборка, export,
 * next start) с непустым флагом останавливается здесь, независимо от NODE_ENV дочернего процесса.
 */
export default function config(phase: string): NextConfig {
  const pagesBase = process.env.NEXT_PUBLIC_BASE_PATH;
  const qaFixture = process.env.NEXT_PUBLIC_QA_FIXTURE;
  if (qaFixture && (phase !== PHASE_DEVELOPMENT_SERVER || pagesBase)) {
    throw new Error(`NEXT_PUBLIC_QA_FIXTURE=${qaFixture} разрешён только для next dev без NEXT_PUBLIC_BASE_PATH. Production и export собираются без тестовых данных.`);
  }

  if (pagesBase) {
    return {
      output: "export",
      basePath: pagesBase,
      trailingSlash: true,
      images: { unoptimized: true },
      experimental: { globalNotFound: true },
    };
  }

  return {
    // Dev-сервер стенда состояний работает рядом с обычным, поэтому у него свой каталог сборки.
    ...(qaFixture ? { distDir: ".next-qa" } : {}),
    images: { formats: ["image/avif", "image/webp"], qualities: [75] },
    experimental: { globalNotFound: true },
    async redirects() {
      // Адреса прошлой DEMO-версии.
      return [
        { source: "/cases/:path*", destination: "/works", permanent: true },
        { source: "/works/atelier-in-motion", destination: "/works/burgundy-coat-city", permanent: true },
      ];
    },
  };
}
