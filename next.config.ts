import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Pour Cloudflare Pages static - génère le dossier 'out'
  output: 'export',
  trailingSlash: false,
};

export default nextConfig;
