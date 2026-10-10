import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
