import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { SeoPageShell } from "@/components/SeoPageShell";
import { absoluteImage, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { productSlug } from "@/lib/product-slug";
import { getCatalog, visibleCategories, visibleProducts } from "@/lib/store-data";
import { getProductParentSlug, getProductSubcategorySlug } from "@/lib/category-hierarchy";

/**
 * Page rayon indexable : `/categories/<slug>`
 *
 * Le site n'avait aucune URL de rayon : les catégories n'existaient que comme
 * filtres d'état React. Ce sont pourtant les requêtes qui rapportent en
 * référencement local (« أدوات مكتبية طرابلس », « دفاتر مدرسية ليبيا »).
 *
 * La page liste les sous-rayons et tous les produits du rayon (liens vers les
 * fiches), avec le texte de description de la catégorie — contenu unique et
 * bilingue qui manquait totalement au HTML livré.
 */
export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const snapshot = await getCatalog();
  return visibleCategories(snapshot).map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getCatalog();
  const category = snapshot.categories.find((item) => item.slug === slug);
  if (!category) {
    return pageMetadata({
      title: "القسم غير موجود | Category not found — المنهج",
      description: "This category is not part of the Al Manhaj catalogue.",
      path: `/categories/${slug}`,
      noindex: true,
    });
  }

  return pageMetadata({
    title: `${category.nameAr} | ${category.nameEn} — شركة المنهج للقرطاسية`,
    description: (category.descriptionAr || category.descriptionEn).slice(0, 158),
    path: `/categories/${category.slug}`,
    image: category.imageUrl,
    keywords: [category.nameAr, category.nameEn, `${category.nameEn} Tripoli`],
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const snapshot = await getCatalog();
  const category = snapshot.categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const categoriesBySlug = new Map(
    snapshot.categories.map((item) => [item.slug, item])
  );
  const children = snapshot.categories.filter(
    (item) => item.parentSlug === category.slug
  );
  const products = visibleProducts(snapshot).filter((product) => {
    if (category.parentSlug) {
      return getProductSubcategorySlug(product, categoriesBySlug) === category.slug;
    }
    return getProductParentSlug(product, categoriesBySlug) === category.slug;
  });
  const parent = category.parentSlug
    ? categoriesBySlug.get(category.parentSlug)
    : null;

  const breadcrumbs = [
    { name: "الكتالوج / Catalogue", path: "/catalogue" },
    ...(parent ? [{ name: parent.nameAr, path: `/categories/${parent.slug}` }] : []),
    { name: category.nameAr, path: `/categories/${category.slug}` },
  ];

  return (
    <SeoPageShell breadcrumbs={breadcrumbs}>
      <JsonLd
        data={itemListJsonLd(
          category.nameAr,
          products.map((product) => ({
            name: product.titleAr,
            path: `/produits/${productSlug(product)}`,
          }))
        )}
      />

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={absoluteImage(category.imageUrl)}
              alt={category.nameAr}
              width={192}
              height={192}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#E30613]">
              {category.badgeAr || category.badgeEn}
            </p>
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">
              {category.nameAr}
            </h1>
            <p className="text-sm font-semibold text-zinc-500" dir="ltr">
              {category.nameEn}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-700">
              {category.descriptionAr}
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-6 text-zinc-500" dir="ltr">
              {category.descriptionEn}
            </p>
          </div>
        </div>
      </section>

      {children.length > 0 ? (
        <nav aria-label="الأقسام الفرعية" className="mt-5">
          <h2 className="mb-2 text-sm font-extrabold">الأقسام الفرعية</h2>
          <ul className="flex flex-wrap gap-2">
            {children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`/categories/${child.slug}`}
                  className="inline-flex rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold hover:border-[#E30613] hover:text-[#E30613]"
                >
                  {child.nameAr}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <h2 className="mt-6 mb-3 text-lg font-black">
        {products.length} منتج في هذا القسم
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <li key={product.id} className="rounded-lg bg-white p-2.5 shadow-sm">
            <Link href={`/produits/${productSlug(product)}`} className="group block">
              <div className="mb-2 aspect-square overflow-hidden rounded bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={absoluteImage(product.images?.[0])}
                  alt={product.titleAr}
                  width={320}
                  height={320}
                  className="h-full w-full object-contain transition group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="line-clamp-2 min-h-10 text-xs font-bold leading-5 group-hover:text-[#E30613]">
                {product.titleAr}
              </p>
              <p className="mt-1 text-sm font-black text-[#E30613]">
                {Number(product.price).toFixed(2)} د.ل
              </p>
              <p className="text-[10px] font-semibold text-zinc-400" dir="ltr">
                {product.sku}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {products.length === 0 ? (
        <p className="rounded bg-white p-4 text-sm text-zinc-600">
          لا توجد منتجات منشورة في هذا القسم حالياً —{" "}
          <Link href="/catalogue" className="font-bold text-[#E30613] hover:underline">
            تصفح كل الكتالوج
          </Link>
          .
        </p>
      ) : null}
    </SeoPageShell>
  );
}
