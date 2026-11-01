import type { MetadataRoute } from "next";
import { absoluteUrl, absoluteUrl as abs } from "@/lib/site";
import { getCatalog, visibleCategories, visibleProducts } from "@/lib/store-data";
import { productSlug } from "@/lib/product-slug";

/**
 * `sitemap.xml` généré à la demande.
 *
 * Ce que la version précédente n'avait pas : **aucun sitemap du tout**. Google
 * ne découvrait donc que les 6 pages liées depuis le menu, et aucune fiche
 * produit n'existait. Le sitemap liste désormais :
 *
 *  - les pages institutionnelles (accueil, magasin, services, vente en ligne,
 *    gros, catalogue, pages légales) ;
 *  - `/catalogue` — le hub de maillage interne vers tous les rayons et produits ;
 *  - une URL par rayon et sous-rayon (`/categories/<slug>`) ;
 *  - une URL par produit visible (`/produits/<slug>`) avec ses images, ce qui
 *    alimente aussi Google Images ;
 *  - les versions arabes et anglaises ne sont pas listées séparément : la
 *    bascule de langue est côté client (même URL), voir le rapport d'audit —
 *    des URLs `/en/...` dédiées seraient la prochaine étape pour le hreflang.
 *
 * Revalidation horaire : un produit ajouté depuis l'admin entre dans le sitemap
 * en moins d'une heure, sans redéploiement.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await getCatalog();
  const products = visibleProducts(snapshot);
  const categories = visibleCategories(snapshot);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/catalogue"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/vente-en-ligne"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/wholesale"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/services"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/magasin"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/returns"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: abs(`/categories/${category.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: category.parentSlug ? 0.6 : 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: abs(`/produits/${productSlug(product)}`),
    lastModified: product.createdAt ? new Date(product.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
    images: (Array.isArray(product.images) ? product.images : [])
      .filter((image) => typeof image === "string" && image.trim().length > 0)
      .slice(0, 3)
      .map((image) => abs(image)),
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
