import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SeoPageShell } from "@/components/SeoPageShell";
import { absoluteImage, faqJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { SITE, whatsappUrl } from "@/lib/site";
import { productSlug } from "@/lib/product-slug";
import { getCatalog, visibleCategories, visibleProducts } from "@/lib/store-data";
import { getProductParentSlug } from "@/lib/category-hierarchy";

/**
 * Hub du catalogue : `/catalogue`
 *
 * Rôle double :
 *  1. **maillage interne** — un point d'entrée HTML qui liste toutes les
 *     catégories et tous les produits (les moteurs n'ont pas à deviner le
 *     contenu caché derrière les modales JavaScript) ;
 *  2. **fiche factuelle pour le GEO** — un bloc « faits » au format
 *     question/réponse (qui, où, quoi, prix, livraison, paiement, horaires)
 *     directement citable par un moteur génératif, sans inférence.
 */
export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "الكتالوج الكامل | Full catalogue — شركة المنهج للقرطاسية",
  description:
    "كل منتجات شركة المنهج للقرطاسية في طرابلس: دفاتر وأقلام وأدوات هندسية وحقائب مدرسية وملحقات حاسوب وأحبار طابعات — بالأسعار بالدينار الليبي وبيع بالجملة.",
  path: "/catalogue",
  keywords: [
    "كتالوج قرطاسية",
    "أسعار القرطاسية طرابلس",
    "stationery catalogue Tripoli",
    "office supplies price list Libya",
  ],
});

const FAQ_FACTS = [
  {
    q: "من هي شركة المنهج للقرطاسية؟",
    a: "شركة المنهج للقرطاسية (Al Manhaj Company for Stationery) متجر قرطاسية وأدوات مكتبية وهندسية في البيفي، طرابلس، ليبيا. تبيع بالتقسيط وبالجملة للمدارس والجامعات ومراكز الطباعة والشركات.",
  },
  {
    q: "أين يوجد المتجر؟",
    a: "البيفي، طرابلس، ليبيا. الهاتف والواتساب: +218 91-214-5050، البريد: info@almanhaj.ly. أوقات العمل: السبت – الخميس من 09:00 إلى 21:00.",
  },
  {
    q: "ما هي الأسعار والعملة؟",
    a: "جميع الأسعار بالدينار الليبي (LYD / د.ل) وتشمل الضريبة حيث تنطبق. سعر الجملة يبدأ من 10 قطع للصنف الواحد بخصم حتى 30%.",
  },
  {
    q: "كيف يمكن الطلب والتوصيل والدفع؟",
    a: "الطلب من الموقع يفتح رسالة واتساب مع ملخص السلة. التوصيل داخل طرابلس خلال 24–48 ساعة ومجاني فوق 1,900 د.ل، وخارج طرابلس عبر شركات الشحن. الدفع نقداً عند الاستلام أو تحويل مصرفي، والدفع الإلكتروني قيد التفعيل بعد ترخيص موثوق.",
  },
  {
    q: "هل يمكن الاسترجاع؟",
    a: "نعم، خلال 14 يوماً للمنتجات غير المفتوحة وغير المستخدمة. عيوب المصنع تُستبدل خلال 7 أيام. الأحبار المفتوحة والورق المقطع حسب الطلب غير قابلة للاسترجاع إلا لعيب مصنعي.",
  },
];

export default async function CataloguePage() {
  const snapshot = await getCatalog();
  const products = visibleProducts(snapshot);
  const categories = visibleCategories(snapshot);
  const categoriesBySlug = new Map(categories.map((item) => [item.slug, item]));

  const faq = faqJsonLd(FAQ_FACTS.map((fact) => ({ question: fact.q, answer: fact.a })));

  const byCategory = new Map<string, typeof products>();
  for (const product of products) {
    const parentSlug = getProductParentSlug(product, categoriesBySlug);
    const bucket = byCategory.get(parentSlug) ?? [];
    bucket.push(product);
    byCategory.set(parentSlug, bucket);
  }

  return (
    <SeoPageShell breadcrumbs={[{ name: "الكتالوج / Catalogue", path: "/catalogue" }]}>
      <JsonLd
        data={itemListJsonLd(
          "الكتالوج الكامل — شركة المنهج للقرطاسية",
          products.map((product) => ({
            name: product.titleAr,
            path: `/produits/${productSlug(product)}`,
          }))
        )}
      />

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">
          الكتالوج الكامل — {products.length} منتج
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-700">
          {SITE.nameAr} — {SITE.taglineAr} كل منتج في هذه الصفحة له صفحة خاصة
          بالأسعار والمواصفات والمخزون، ويمكن طلبه مباشرة عبر واتساب{" "}
          <span dir="ltr">{SITE.phoneDisplay}</span>.
        </p>
        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["الأقسام", `${categories.filter((item) => !item.parentSlug).length}`],
            ["المنتجات المنشورة", `${products.length}`],
            ["العملة", "دينار ليبي (LYD)"],
            ["البيع بالجملة", "من 10 قطع — حتى 30%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-zinc-200 bg-zinc-50 p-2.5">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</dt>
              <dd className="mt-0.5 text-sm font-black">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-black">الأقسام</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug} className="rounded-lg bg-white p-2.5 shadow-sm">
              <Link href={`/categories/${category.slug}`} className="group block">
                <div className="mb-2 h-28 overflow-hidden rounded bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={absoluteImage(category.imageUrl)}
                    alt={category.nameAr}
                    width={400}
                    height={280}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs font-black leading-5 group-hover:text-[#E30613]">
                  {category.nameAr}
                </p>
                <p className="text-[10px] font-semibold text-zinc-500" dir="ltr">
                  {category.nameEn}
                </p>
                <p className="mt-1 text-[10px] font-bold text-zinc-400">
                  {(byCategory.get(category.slug) ?? []).length} منتج
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {categories
        .filter((category) => !category.parentSlug)
        .map((category) => {
          const items = byCategory.get(category.slug) ?? [];
          if (items.length === 0) return null;
          return (
            <section key={category.slug} className="mt-8">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-black">
                  <Link href={`/categories/${category.slug}`} className="hover:text-[#E30613] hover:underline">
                    {category.nameAr}
                  </Link>
                </h2>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-xs font-bold text-[#E30613] hover:underline"
                >
                  عرض القسم كاملاً ←
                </Link>
              </div>
              <ul className="grid gap-x-4 gap-y-1 rounded-lg bg-white p-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => (
                  <li key={product.id} className="border-b border-dashed border-zinc-100 py-1.5">
                    <Link
                      href={`/produits/${productSlug(product)}`}
                      className="flex items-baseline justify-between gap-3 hover:text-[#E30613] hover:underline"
                    >
                      <span className="font-semibold leading-5">{product.titleAr}</span>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-zinc-500">
                        {Number(product.price).toFixed(2)} د.ل
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      <section className="mt-10 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        {faq ? <JsonLd data={faq} /> : null}
        <h2 className="text-lg font-black">أسئلة وأجوبة سريعة عن المتجر</h2>
        <dl className="mt-3 space-y-3">
          {FAQ_FACTS.map((fact) => (
            <div key={fact.q}>
              <dt className="text-sm font-extrabold">{fact.q}</dt>
              <dd className="mt-1 text-sm leading-7 text-zinc-700">{fact.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={whatsappUrl("مرحباً، أريد الاستفسار عن الكتالوج والأسعار")}
            target="_blank"
            rel="noopener"
            className="inline-flex rounded bg-[#E30613] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#C10510]"
          >
            اطلب عبر واتساب
          </a>
          <Link
            href="/vente-en-ligne"
            className="inline-flex rounded border border-zinc-300 px-4 py-2.5 text-sm font-extrabold hover:border-[#E30613] hover:text-[#E30613]"
          >
            كيف أشتري أونلاين؟
          </Link>
        </div>
      </section>
    </SeoPageShell>
  );
}
