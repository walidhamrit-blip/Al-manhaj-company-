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
      <body className="antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
