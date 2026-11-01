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

/**
 * En-têtes HTTP communs.
 *
 * `X-Robots-Tag: noindex` sur `/api/*` évite qu'un endpoint JSON (catalogue,
 * commandes, uploads) soit indexé comme une page de contenu — un doublon
 * classique quand le catalogue est servi à la fois en HTML et en JSON.
 *
 * Pas de `X-Frame-Options` / `frame-ancestors` volontairement : la prévisualisation
 * Arena sert le site dans une iframe proxifiée, et un `DENY` casserait l'aperçu.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  {
    // HSTS : uniquement pertinent (et sans risque) une fois le domaine servi en
    // HTTPS — c'est le cas sur Vercel. `preload` reste volontairement absent.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  env: buildStamp,
  // Ne pas expédier `X-Powered-By: Next.js` : aucun bénéfice, un signal de plus.
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: process.env.NODE_ENV !== "production",
    // Formats modernes servis en priorité par l'optimiseur Next : moins d'octets
    // par visuel, donc de meilleurs Core Web Vitals sur mobile (LCP).
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
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

  async headers() {
    return [
      {
        // Les endpoints JSON ne sont pas du contenu : ni index, ni suivi.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Visuels publics : le nom du fichier ne change pas, on peut les mettre
        // en cache long. Le catalogue, lui, est revalidé côté page (ISR).
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
