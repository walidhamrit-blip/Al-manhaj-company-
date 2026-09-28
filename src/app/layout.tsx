import "../../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Store Arena - Boutique en ligne",
  description: "Store ecommerce créé sur Arena.ai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
