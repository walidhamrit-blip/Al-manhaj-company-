import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "شركة المنهج للقرطاسية | Al Manhaj Company for Stationery",
  description:
    "Al Manhaj Company for Stationery — school supplies, office tools, engineering equipment, computer hardware, cabinets and printer ink in Al Bivi, Tripoli, Libya. Retail & wholesale with WhatsApp ordering.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-black selection:text-white" style={{ fontFamily: "'Inter','IBM Plex Sans Arabic',system-ui,sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
