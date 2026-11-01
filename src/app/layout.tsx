import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import BuildBadge from "@/components/BuildBadge";
import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/store-data";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE, SITE_URL } from "@/lib/site";

/**
 * Métadonnées globales.
 *
 * `metadataBase` est indispensable : sans lui, Next.js n'émet pas de canonical
 * absolu et les URL Open Graph restent relatives (Google les ignore ou les
 * résout contre le domaine de rendu — y compris les URL de preview Vercel, ce
 * qui produit des doublons d'indexation). Voir `src/lib/site.ts` pour l'ordre
 * de résolution du domaine.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "شركة المنهج للقرطاسية | Al Manhaj Company for Stationery",
    template: "%s",
  },
  description:
    "Al Manhaj Company for Stationery — school supplies, office tools, engineering equipment, computer hardware, cabinets and printer ink in Al Bivi, Tripoli, Libya. Retail & wholesale with WhatsApp ordering.",
  applicationName: SITE.nameAr,
  keywords: [
    "قرطاسية طرابلس",
    "شركة المنهج للقرطاسية",
    "أدوات مكتبية ليبيا",
    "بيع بالجملة قرطاسية",
    "أحبار طابعات طرابلس",
    "stationery Tripoli",
    "office supplies Libya",
    "wholesale stationery Tripoli",
    "printer ink Libya",
    "engineering equipment Libya",
  ],
  authors: [{ name: SITE.legalNameEn, url: SITE_URL }],
  creator: SITE.legalNameEn,
  publisher: SITE.legalNameEn,
  category: "shopping",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.nameAr,
    title: "شركة المنهج للقرطاسية | Al Manhaj Company for Stationery",
    description:
      "Office supplies, school stationery, engineering equipment and printer consumables — retail & wholesale in Al Bivi, Tripoli (Libya).",
    locale: "ar_LY",
    alternateLocale: ["en_US"],
    images: [
      {
        url: SITE.socialImage,
        width: SITE.socialImageWidth,
        height: SITE.socialImageHeight,
        alt: "Al Manhaj Company for Stationery — Tripoli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شركة المنهج للقرطاسية | Al Manhaj Company for Stationery",
    description:
      "Stationery, office and engineering supplies, printer ink — retail & wholesale in Tripoli, Libya.",
    images: [SITE.socialImage],
  },
  formatDetection: { telephone: true, email: true, address: true },
  // Balise de vérification Google Search Console. Renseigne la variable sur
  // Vercel puis redéploie : la balise apparaît dans le <head> de chaque page.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
          ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
            ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
            : {}),
        },
      }
    : process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { verification: { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } }
      : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEEEEE" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Les données structurées ont besoin du NAP réel (téléphone, e-mail, photo de
  // la boutique) : on charge la fiche magasin, avec repli sur le seed hors base.
  const { settings } = await getCatalog();
  const structuredData = [organizationJsonLd(settings), websiteJsonLd()];

  return (
    // Server component on purpose: the build stamp travels in the RSC payload,
    // no client code recomputes it, so server HTML and hydration always agree.
    <html
      lang="ar"
      dir="rtl"
      data-build-sha={process.env.BUILD_SHA ?? "local"}
      data-build-env={process.env.BUILD_ENV ?? "dev"}
      data-build-time={process.env.BUILD_TIME ?? ""}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* App Router root layout is the correct place for these fonts. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased selection:bg-[#E30613] selection:text-white"
        style={{ fontFamily: "'Inter','IBM Plex Sans Arabic',system-ui,sans-serif" }}
      >
        <JsonLd data={structuredData} />
        {children}
        <BuildBadge />
        <Analytics />
      </body>
    </html>
  );
}
