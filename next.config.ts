import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: process.env.NODE_ENV !== "production" },
  // Arena's live preview is served from a proxied e2b.app origin during development.
  allowedDevOrigins: ["*.e2b.app"],
  // Mode dynamique pour Neon - pas de output:export
  // Les API routes fonctionneront avec la base de données
};

export default nextConfig;
