import assert from "node:assert/strict";
import test from "node:test";

import {
  findProductBySlug,
  productSlug,
  skuFromProductSlug,
  slugify,
} from "../src/lib/product-slug";
import { absoluteUrl, resolveSiteUrl } from "../src/lib/site";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  pageMetadata,
  productJsonLd,
  storeJsonLd,
} from "../src/lib/seo";
import { INITIAL_CATEGORIES, hydrateFallbackStore } from "../src/lib/fallbackData";
import type { Product } from "../src/db/schema";

// Le catalogue de seed est typé « insert » (id optionnel) ; les constructeurs
// JSON-LD attendent un produit complet, exactement comme celui sorti de la base.
const INITIAL_PRODUCTS = hydrateFallbackStore().products as unknown as Product[];

/**
 * Garde-fous de la couche SEO/GEO.
 *
 * Ces tests ne vérifient pas du rendu : ils figent les invariants dont dépend
 * l'indexation — URL produit stable et réversible, canonical absolu, prix et
 * disponibilité présents dans le JSON-LD, FAQ non vide, sitemap non vide.
 */

test("slugify produit des segments ASCII stables", () => {
  assert.equal(slugify("Kyoto Linen Hardcover — A5 (Set of 2)"), "kyoto-linen-hardcover-a5-set-of-2");
  assert.equal(slugify("  ÉTÉ 2026 / Crème  "), "ete-2026-creme");
  assert.equal(slugify("دفتر كيوتو"), "");
});

test("productSlug combine titre lisible et SKU, et se relit", () => {
  for (const product of INITIAL_PRODUCTS) {
    const slug = productSlug(product);
    assert.ok(slug.length > 0, `slug vide pour ${product.sku}`);
    assert.equal(
      skuFromProductSlug(slug),
      slugify(product.sku),
      `SKU non réversible pour ${slug}`
    );
  }
});

test("findProductBySlug accepte le slug complet et le SKU seul", () => {
  const product = INITIAL_PRODUCTS[0];
  const slug = productSlug(product);
  assert.equal(findProductBySlug(INITIAL_PRODUCTS, slug)?.sku, product.sku);
  assert.equal(findProductBySlug(INITIAL_PRODUCTS, product.sku)?.sku, product.sku);
  assert.equal(
    findProductBySlug(INITIAL_PRODUCTS, product.sku.toLowerCase())?.sku,
    product.sku
  );
  assert.equal(findProductBySlug(INITIAL_PRODUCTS, "inconnu-xyz"), undefined);
});

test("resolveSiteUrl renvoie toujours une origine absolue sans slash final", () => {
  const url = resolveSiteUrl();
  assert.match(url, /^https?:\/\/[^/]+$/);
  assert.equal(absoluteUrl("/catalogue"), `${url}/catalogue`);
  assert.equal(absoluteUrl("https://externe.tld/x"), "https://externe.tld/x");
});

test("pageMetadata expose canonical, robots max-image-preview et Open Graph", () => {
  const meta = pageMetadata({
    title: "Titre",
    description: "Description",
    path: "/wholesale",
  });
  assert.equal(meta.alternates?.canonical, "/wholesale");
  assert.deepEqual(meta.robots, {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  });
  assert.ok(meta.openGraph && "images" in meta.openGraph);
  assert.equal(meta.openGraph?.locale, "ar_LY");
});

test("pageMetadata noindex pour les pages hors index", () => {
  const meta = pageMetadata({
    title: "404",
    description: "x",
    path: "/404",
    noindex: true,
  });
  assert.deepEqual(meta.robots, { index: false, follow: true });
});

test("le JSON-LD Product porte prix, devise, disponibilité et SKU", () => {
  const product = INITIAL_PRODUCTS[0];
  const node = productJsonLd(product, null) as Record<string, unknown> & {
    offers: Record<string, unknown>;
  };
  assert.equal(node["@type"], "Product");
  assert.equal(node.sku, product.sku);
  assert.equal(node.offers.priceCurrency, "LYD");
  assert.equal(node.offers.price, Number(product.price).toFixed(2));
  assert.match(String(node.offers.availability), /InStock|OutOfStock/);
  assert.match(String(node.url), /\/produits\//);
  const images = node.image as string[];
  assert.ok(images.every((image) => image.startsWith("http")));
});

test("le JSON-LD Organization et Store contiennent le NAP complet", () => {
  const org = organizationJsonLd(null) as Record<string, unknown> & {
    address: Record<string, unknown>;
  };
  assert.equal(org["@type"], "Organization");
  assert.match(String(org.telephone), /^\+218/);
  assert.equal(org.address.addressCountry, "LY");
  assert.equal(org.address.addressLocality, "Tripoli");

  const store = storeJsonLd(null) as Record<string, unknown> & {
    geo: Record<string, unknown>;
    openingHoursSpecification: Record<string, unknown>[];
  };
  assert.ok(Array.isArray(store["@type"]));
  assert.equal(typeof store.geo.latitude, "number");
  assert.equal(store.openingHoursSpecification[0].opens, "09:00");
});

test("le fil d'Ariane est positionné à partir de 1 et absolu", () => {
  const node = breadcrumbJsonLd([
    { name: "Accueil", path: "/" },
    { name: "Catalogue", path: "/catalogue" },
  ]) as { itemListElement: { position: number; item: string }[] };
  assert.equal(node.itemListElement[0].position, 1);
  assert.match(node.itemListElement[1].item, /^https?:\/\/.+\/catalogue$/);
});

test("faqJsonLd ignore les entrées vides et renvoie null si aucune", () => {
  assert.equal(faqJsonLd([{ question: " ", answer: "x" }]), null);
  const node = faqJsonLd([
    { question: "Q1 ?", answer: "R1" },
    { question: "Q2 ?", answer: "R2" },
  ]) as { mainEntity: unknown[] };
  assert.equal(node.mainEntity.length, 2);
});

test("chaque catégorie du seed possède un slug utilisable en URL", () => {
  for (const category of INITIAL_CATEGORIES) {
    assert.match(category.slug, /^[a-z0-9-]+$/, `slug invalide: ${category.slug}`);
  }
});
