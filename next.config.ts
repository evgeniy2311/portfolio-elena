import type { NextConfig } from "next";

// Превью для просмотра без установки: статичная сборка для GitHub Pages (.github/workflows/preview.yml).
const pagesBase = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = pagesBase
  ? {
      output: "export",
      basePath: pagesBase,
      trailingSlash: true,
      images: { unoptimized: true },
      experimental: { globalNotFound: true },
    }
  : {
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

export default nextConfig;
