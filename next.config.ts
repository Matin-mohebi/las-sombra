import type { NextConfig } from "next";

/**
 * - Local/sandbox dev & build: standalone server (default).
 * - GitHub Pages CI: PAGES_BUILD=1 → static export into out/ with basePath /<repo>.
 */
const pagesBuild = process.env.PAGES_BUILD === "1";
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(pagesBuild
    ? {
        output: "export" as const,
        basePath: basePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
