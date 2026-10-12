import type { NextConfig } from "next";

// Build stamp: which deployment is being served. Evaluated once per build, so
// every page of the same build carries the same values. Passed through the
// `env` field below, which inlines these as literals on the server AND in the
// client bundle (plain process.env.VERCEL_* is not exposed to the browser).
const buildStamp = {
  BUILD_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  BUILD_ENV: process.env.VERCEL_ENV ?? "dev",
  BUILD_TIME: new Date().toISOString(),
};

const nextConfig: NextConfig = {
  env: buildStamp,
  images: {
    unoptimized: process.env.NODE_ENV !== "production",
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
  },
  // Arena's live preview is served from a proxied e2b.app origin during development.
  allowedDevOrigins: ["*.e2b.app"],
  // The dev route indicator ("Compiling…" badge) is mistaken for an error on the
  // live preview: hide it. Development only — production builds are unaffected.
  devIndicators: false,
  // Mode dynamique pour Neon - pas de output:export
  // Les API routes fonctionneront avec la base de données
};

export default nextConfig;
