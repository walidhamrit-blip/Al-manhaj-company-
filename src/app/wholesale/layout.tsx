import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/lib/store-data";

export const metadata: Metadata = pageMetadata({
  title: "البيع بالجملة | Wholesale B2B — شركة المنهج للقرطاسية",
  description:
    "أسعار الجملة للمدارس والجامعات ومراكز الطباعة والشركات في ليبيا: خصومات متدرجة حتى 30% من 10 قطع للصنف، توصيل داخل طرابلس، وطلب عرض سعر عبر واتساب.",
  path: "/wholesale",
  keywords: [
    "بيع بالجملة قرطاسية",
    "توريد مدرسي ليبيا",
    "wholesale stationery Libya",
    "B2B office supplies Tripoli",
  ],
});

/**
 * Layout serveur de `/wholesale`.
 *
 * Il ajoute deux choses que la page cliente ne pouvait pas fournir :
 *  - le fil d'Ariane structuré ;
 *  - le `FAQPage` construit à partir des questions **réellement affichées**
 *    (elles viennent du CMS, donc le JSON-LD ne peut pas diverger du contenu).
 */
export default async function WholesaleLayout({ children }: { children: ReactNode }) {
  const { settings } = await getCatalog();
  const faqs = (settings.wholesalePage?.faqs ?? [])
    .map((faq) => ({ question: faq.qAr?.trim() ?? "", answer: faq.aAr?.trim() ?? "" }))
    .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
  const faq = faqJsonLd(faqs);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية / Home", path: "/" }, { name: "البيع بالجملة / Wholesale", path: "/wholesale" }])} />
      {faq ? <JsonLd data={faq} /> : null}
      {children}
    </>
  );
}
