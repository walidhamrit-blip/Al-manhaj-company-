import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/lib/store-data";

export const metadata: Metadata = pageMetadata({
  title: "البيع أونلاين | Online Sales — شركة المنهج للقرطاسية",
  description:
    "اطلب القرطاسية والأدوات المكتبية أونلاين في طرابلس: كتالوج بالأسعار، سلة، تأكيد عبر واتساب، دفع عند الاستلام، توصيل 24–48 ساعة، واسترجاع خلال 14 يوماً.",
  path: "/vente-en-ligne",
  keywords: [
    "شراء قرطاسية أونلاين ليبيا",
    "توصيل قرطاسية طرابلس",
    "order stationery online Tripoli",
    "cash on delivery Libya",
  ],
});

/** Voir `wholesale/layout.tsx` : fil d'Ariane + FAQ structurée issue du CMS. */
export default async function OnlineSalesLayout({ children }: { children: ReactNode }) {
  const { settings } = await getCatalog();
  const faqs = (settings.onlineSalesPage?.faqs ?? [])
    .map((faq) => ({ question: faq.qAr?.trim() ?? "", answer: faq.aAr?.trim() ?? "" }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
  const faq = faqJsonLd(faqs);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية / Home", path: "/" }, { name: "البيع أونلاين / Online sales", path: "/vente-en-ligne" }])} />
      {faq ? <JsonLd data={faq} /> : null}
      {children}
    </>
  );
}
