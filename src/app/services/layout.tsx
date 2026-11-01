import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "خدمات الطباعة والنسخ | Printing Services — شركة المنهج للقرطاسية",
  description:
    "خدمات طباعة ونسخ وتجليد في طرابلس: طباعة A4/A3، تصوير مستندات، تغليف حراري، لامينيشن، طباعة بطاقات وأختام للشركات والمدارس — طلب عبر واتساب.",
  path: "/services",
  keywords: [
    "خدمات طباعة طرابلس",
    "تصوير مستندات ليبيا",
    "printing services Tripoli",
    "photocopy Libya",
  ],
});

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية / Home", path: "/" }, { name: "الخدمات / Services", path: "/services" }])} />
      {children}
    </>
  );
}
