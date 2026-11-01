import type { Product } from "@/db/schema";

/**
 * Slugs produits : des URL lisibles, stables et indexables pour les pages
 * détail produit (`/produits/<slug>`).
 *
 * Le catalogue n'avait aucune page produit : tout vivait dans des modales de la
 * page d'accueil, donc rien à indexer (ni titre, ni prix, ni disponibilité par
 * article). La fiche produit existe maintenant côté serveur et son URL combine
 * deux besoins contradictoires :
 *
 *   - **lisibilité / mots-clés** → le titre anglais du produit
 *     (`atelier-dotted-notebook`) ;
 *   - **stabilité** → le SKU, qui ne change pas quand le titre est réécrit
 *     depuis l'admin (`--nb-atelier-01`).
 *
 * D'où la forme `titre-slugifie--sku`. Le séparateur `--` n'apparaît jamais
 * dans la partie slugifiée (qui ne contient que `[a-z0-9-]`), donc le découpage
 * reste sans ambiguïté. L'ancienne URL `/produits/<sku>` continue de résoudre :
 * `skuFromProductSlug` renvoie le SKU dans les deux cas.
 */

const MAX_TITLE_SLUG = 60;

/** Translittère et normalise un texte latin en slug `[a-z0-9-]`. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // Retire les diacritiques (é → e, ü → u) sans toucher aux ligatures latines.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[œŒ]/g, "oe")
    .toLowerCase()
    // Tout ce qui n'est pas latin/chiffre devient un tiret : les titres arabes
    // sont donc retirés ici et n'apportent que le SKU, ce qui est voulu.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Coupe un slug sur un tiret, sans dépasser `max` caractères. */
function truncateSlug(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "");
}

/** Slug canonique d'un produit : `titre-anglais--sku`. */
export function productSlug(
  product: Pick<Product, "sku" | "titleEn">
): string {
  const sku = slugify(product.sku);
  if (!sku) return "produit";
  const title = truncateSlug(slugify(product.titleEn ?? ""), MAX_TITLE_SLUG);
  return title && title !== sku ? `${title}--${sku}` : sku;
}

/**
 * SKU extrait d'un segment d'URL.
 * Accepte `titre--sku`, `sku`, et tolère un SKU suivi d'un suffixe de slug.
 */
export function skuFromProductSlug(slug: string): string {
  const decoded = decodeURIComponent(slug).toLowerCase();
  const parts = decoded.split("--");
  return (parts.length > 1 ? parts[parts.length - 1] : decoded).trim();
}

/** Retrouve un produit à partir du segment d'URL (SKU insensible à la casse). */
export function findProductBySlug<T extends Pick<Product, "sku" | "titleEn">>(
  products: T[],
  slug: string
): T | undefined {
  const sku = skuFromProductSlug(slug);
  const bySku = products.find((product) => product.sku.toLowerCase() === sku);
  if (bySku) return bySku;
  // Dernier recours : comparaison sur le slug complet (SKU contenant lui-même
  // un tiret simple et non un `--`, cas d'un titre vide).
  const normalized = slugify(decodeURIComponent(slug));
  return products.find((product) => productSlug(product) === normalized);
}
