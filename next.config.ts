import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Mode dynamique pour Neon - pas de output:export
  // Les API routes fonctionneront avec la base de données
};

export default nextConfig;
