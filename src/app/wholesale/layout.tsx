import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "البيع بالجملة | Wholesale B2B — شركة المنهج للقرطاسية",
  description:
    "Al Manhaj wholesale for schools, copy centers and companies in Tripoli — tiered B2B pricing, product ranges, delivery and a WhatsApp quote.",
};

export default function WholesaleLayout({ children }: { children: ReactNode }) {
  return children;
}
