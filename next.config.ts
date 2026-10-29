import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
