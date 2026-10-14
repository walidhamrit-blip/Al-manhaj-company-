import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import BuildBadge from "@/components/BuildBadge";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "شركة المنهج للقرطاسية | Al Manhaj Company for Stationery",
  description:
    "Al Manhaj Company for Stationery — school supplies, office tools, engineering equipment, computer hardware, cabinets and printer ink in Al Bivi, Tripoli, Libya. Retail & wholesale with WhatsApp ordering.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Server component on purpose: the build stamp travels in the RSC payload,
    // no client code recomputes it, so server HTML and hydration always agree.
    <html
      lang="ar"
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
        {children}
        <BuildBadge />
        <Analytics />
      </body>
    </html>
  );
}
