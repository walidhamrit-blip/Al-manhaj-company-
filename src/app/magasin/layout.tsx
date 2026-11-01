import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata, storeJsonLd } from "@/lib/seo";
import { getCatalog } from "@/lib/store-data";

export const metadata: Metadata = pageMetadata({
  title: "مغازنا | Our store — شركة المنهج للقرطاسية",
  description:
    "زوروا شركة المنهج للقرطاسية في البيفي، طرابلس: أدوات مدرسية ومكتبية وهندسية، أحبار طابعات وملحقات حاسوب. العنوان وأوقات العمل والهاتف والموقع على الخريطة.",
  path: "/magasin",
  keywords: [
    "قرطاسية البيفي طرابلس",
    "عنوان شركة المنهج",
    "stationery store Tripoli",
    "Al Manhaj store Al Bivi",
  ],
});

/**
 * Layout serveur de `/magasin`.
 *
 * C'est la page qui porte le `LocalBusiness` : adresse, coordonnées, horaires
 * et téléphone y sont exposés en JSON-LD, exactement comme sur la fiche Google
 * Business Profile. C'est ce couple page + JSON-LD qui fait remonter le magasin
 * dans les recherches « près de moi » et dans les réponses IA locales.
 */
export default async function MagasinLayout({ children }: { children: ReactNode }) {
  const { settings } = await getCatalog();
  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية / Home", path: "/" }, { name: "المغازن / Our store", path: "/magasin" }])} />
      {children}
    </>
  );
}
