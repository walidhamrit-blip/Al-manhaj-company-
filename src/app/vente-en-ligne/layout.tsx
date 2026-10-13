import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "البيع أونلاين | Online Sales — شركة المنهج للقرطاسية",
  description:
    "Order online from Al Manhaj stationery in Tripoli — catalog, cart, WhatsApp confirmation, cash on delivery, order tracking and 14-day returns.",
};

export default function OnlineSalesLayout({ children }: { children: ReactNode }) {
  return children;
}
