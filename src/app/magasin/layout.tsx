import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "مغازنا | Our store — شركة المنهج للقرطاسية",
  description:
    "Visit Al Manhaj Company for Stationery in Al Bivi, Tripoli — school supplies, office tools, engineering equipment, printer ink and computer accessories.",
};

export default function MagasinLayout({ children }: { children: ReactNode }) {
  return children;
}
