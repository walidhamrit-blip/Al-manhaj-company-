import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { SeoPageShell } from "@/components/SeoPageShell";
import {
  absoluteImage,
  pageMetadata,
  productJsonLd,
  itemListJsonLd,
} from "@/lib/seo";
import { SITE, whatsappUrl } from "@/lib/site";
import { findProductBySlug, productSlug } from "@/lib/product-slug";
import { getCatalog, visibleProducts } from "@/lib/store-data";
import type { Product } from "@/db/schema";

/**
 * Fiche produit indexable : `/produits/<titre>--<sku>`
 *
 * C'était le trou principal du site : le catalogue entier (43 produits, prix,
 * descriptions, specs bilingues) n'existait que dans des modales ouvertes par
 * JavaScript. Aucune URL, donc aucune page dans l'index, aucun rich result
 * « produit », aucun prix citable par un moteur génératif.
 *
 * Cette page est rendue **côté serveur**, en arabe (langue par défaut du site),
 * avec le titre anglais en sous-titre : le HTML livré contient le nom, le prix
 * en dinars, la disponibilité, les specs et la description. `revalidate`
 * rafraîchit le prix et le stock toutes les heures.
 */
export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const snapshot = await getCatalog();
  return visibleProducts(snapshot).map((product) => ({ slug: productSlug(product) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getCatalog();
  const product = findProductBySlug(visibleProducts(snapshot), slug);
  if (!product) {
    return pageMetadata({
      title: "المنتج غير موجود | Product not found — المنهج",
      description: "This product is not available in the Al Manhaj catalogue.",
      path: `/produits/${slug}`,
      noindex: true,
    });
  }
  const title = `${product.titleAr} | ${product.titleEn} — شركة المنهج`;
  const description = (
    product.descriptionAr ||
    product.descriptionEn ||
    SITE.taglineAr
  )
    .replace(/\s+/g, " ")
    .slice(0, 158);

  return pageMetadata({
    title,
    description,
    path: `/produits/${productSlug(product)}`,
    image: product.images?.[0],
    type: "website",
    keywords: [product.titleAr, product.titleEn, product.sku, product.categorySlug],
  });
}

function PriceBlock({ product }: { product: Product }) {
  const hasDiscount =
    product.originalPrice != null && product.originalPrice > product.price;
  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <span className="text-3xl font-black text-[#E30613]">
        {Number(product.price).toFixed(2)} د.ل
      </span>
      {hasDiscount ? (
        <span className="text-sm font-bold text-zinc-400 line-through">
          {Number(product.originalPrice).toFixed(2)} د.ل
        </span>
      ) : null}
      <span className="text-xs font-semibold text-zinc-500" dir="ltr">
        {product.price.toFixed(2)} {SITE.currency} · TTC
      </span>
    </div>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const snapshot = await getCatalog();
  const products = visibleProducts(snapshot);
  const product = findProductBySlug(products, slug);

  if (!product) notFound();

  const category =
    snapshot.categories.find((item) => item.slug === product.categorySlug) ?? null;
  const parent = category?.parentSlug
    ? snapshot.categories.find((item) => item.slug === category.parentSlug)
    : null;

  const images = (Array.isArray(product.images) ? product.images : []).filter(
    (image) => typeof image === "string" && image.trim().length > 0
  );

  const related = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.categorySlug === product.categorySlug ||
          item.subcategorySlug === product.subcategorySlug)
    )
    .slice(0, 4);

  const inStock = product.stock > 0;
  const orderMessage = `مرحباً، أريد طلب: ${product.titleAr} (${product.sku}) — السعر ${Number(
    product.price
  ).toFixed(2)} د.ل`;

  const breadcrumbs = [
    { name: "الكتالوج / Catalogue", path: "/catalogue" },
    ...(parent ? [{ name: parent.nameAr, path: `/categories/${parent.slug}` }] : []),
    ...(category && category.slug !== parent?.slug
      ? [{ name: category.nameAr, path: `/categories/${category.slug}` }]
      : []),
    { name: product.titleAr, path: `/produits/${productSlug(product)}` },
  ];

  return (
    <SeoPageShell breadcrumbs={breadcrumbs}>
      <JsonLd data={productJsonLd(product, category)} />
      {related.length > 0 ? (
        <JsonLd
          data={itemListJsonLd(
            `منتجات مشابهة — ${product.titleAr}`,
            related.map((item) => ({
              name: item.titleAr,
              path: `/produits/${productSlug(item)}`,
            }))
          )}
        />
      ) : null}

      <article className="grid gap-6 rounded-lg bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={absoluteImage(images[0])}
              alt={`${product.titleAr} — ${product.titleEn}`}
              width={800}
              height={800}
              className="h-full w-full object-contain"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          {images.length > 1 ? (
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((image, index) => (
                <li key={`${image}-${index}`} className="overflow-hidden rounded border bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={absoluteImage(image)}
                    alt={`${product.titleAr} — صورة ${index + 2}`}
                    width={200}
                    height={200}
                    className="h-24 w-full object-contain"
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E30613]">
            {category ? category.nameAr : product.categorySlug} · SKU {product.sku}
          </p>
          <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
            {product.titleAr}
          </h1>
          <p className="mt-1 text-sm font-semibold text-zinc-500" dir="ltr">
            {product.titleEn}
          </p>

          <PriceBlock product={product} />

          <p className="mt-3 text-xs font-bold">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> متوفر في المخزن
                ({product.stock} قطعة)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                غير متوفر حالياً — اطلب سعراً وموعد توريد
              </span>
            )}
          </p>

          {product.wholesalePrice ? (
            <p className="mt-2 text-xs leading-6 text-zinc-600">
              سعر الجملة: <strong>{Number(product.wholesalePrice).toFixed(2)} د.ل</strong> للقطعة
              ابتداءً من {product.wholesaleMinQty} قطعة لنفس الصنف.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={whatsappUrl(orderMessage)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded bg-[#E30613] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#C10510]"
            >
              اطلب عبر واتساب / Order on WhatsApp
            </a>
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 rounded border border-zinc-300 px-4 py-2.5 text-sm font-extrabold hover:border-[#E30613] hover:text-[#E30613]"
            >
              {SITE.phoneDisplay}
            </a>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-zinc-500">
            التوصيل داخل طرابلس 24–48 ساعة (مجاناً فوق 1,900 د.ل) — الاسترجاع خلال 14
            يوماً للمنتجات غير المفتوحة. الدفع نقداً عند الاستلام أو تحويل مصرفي.
          </p>

          {(product.descriptionAr || product.descriptionEn) && (
            <section className="mt-5 border-t pt-4">
              <h2 className="mb-1.5 text-sm font-extrabold">الوصف</h2>
              <p className="text-sm leading-7 text-zinc-700">{product.descriptionAr}</p>
              {product.descriptionEn ? (
                <p className="mt-2 text-xs leading-6 text-zinc-500" dir="ltr">
                  {product.descriptionEn}
                </p>
              ) : null}
            </section>
          )}

          {(product.specsAr || product.specsEn) && (
            <section className="mt-4 border-t pt-4">
              <h2 className="mb-2 text-sm font-extrabold">المواصفات</h2>
              <dl className="grid gap-1 text-xs leading-6">
                <div className="flex gap-2">
                  <dt className="min-w-24 shrink-0 font-bold text-zinc-500">المواصفات</dt>
                  <dd className="text-zinc-700">{product.specsAr || product.specsEn}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="min-w-24 shrink-0 font-bold text-zinc-500">Brand</dt>
                  <dd className="text-zinc-700" dir="ltr">{product.specsEn || product.specsAr}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="min-w-24 shrink-0 font-bold text-zinc-500">SKU</dt>
                  <dd className="font-mono text-zinc-700" dir="ltr">{product.sku}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </article>

      {related.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-black">منتجات من نفس القسم</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id} className="rounded-lg bg-white p-3 shadow-sm">
                <Link href={`/produits/${productSlug(item)}`} className="group block">
                  <div className="mb-2 aspect-square overflow-hidden rounded bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={absoluteImage(item.images?.[0])}
                      alt={item.titleAr}
                      width={300}
                      height={300}
                      className="h-full w-full object-contain transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="line-clamp-2 text-xs font-bold leading-5 group-hover:text-[#E30613]">
                    {item.titleAr}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#E30613]">
                    {Number(item.price).toFixed(2)} د.ل
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </SeoPageShell>
  );
}
