// Run in an isolated validation checkout with tsx: `npm run test:promo`.
// Renders the real components with react-dom/server and reads the real
// stylesheet, so the badge contract is checked without a browser.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PromoBadge } from "../src/components/PromoBadge";
import { ProductCarousel } from "../src/components/ProductCarousel";
import { ProductTile } from "../src/components/ProductTile";
import { THEMES } from "../src/lib/i18n-themes";
import type { Product } from "../src/db/schema";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const cssSource = read("src/app/globals.css");
const pageSource = read("src/app/page.tsx");
const carouselSource = read("src/components/ProductCarousel.tsx");
const tileSource = read("src/components/ProductTile.tsx");

// Everything from the section banner onwards is the badge stylesheet.
const promoSection = cssSource.slice(cssSource.indexOf("Hot Deals promotional badge"));
const reducedMotion = promoSection.slice(promoSection.indexOf("prefers-reduced-motion"));

const theme = THEMES[0];
const noop = () => {};

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: "NB-ATELIER-01",
    categorySlug: "notebooks",
    subcategorySlug: "dotted-journals",
    titleEn: "Kyoto Linen Hardcover Dotted Journal A5",
    titleAr: "دفتر كيوتو بغلافتان من الكتان منقط حجم A5",
    descriptionEn: "",
    descriptionAr: "",
    price: 24.9,
    originalPrice: 32,
    wholesalePrice: 17.5,
    wholesaleMinQty: 15,
    stock: 140,
    images: ["/images/hero-stationery.jpg"],
    isFeatured: true,
    isPromotion: true,
    isHidden: false,
    specsEn: "",
    specsAr: "",
    createdAt: null,
    ...overrides,
  } as Product;
}

function carousel(lang: "ar" | "en", products: Product[], promoBadge = false) {
  return renderToStaticMarkup(
    <ProductCarousel
      title={lang === "ar" ? "العروض الساخنة" : "Hot deals"}
      promoBadge={promoBadge}
      products={products}
      categories={[]}
      lang={lang}
      theme={theme}
      currencySymbol={lang === "ar" ? "د.ل" : "LYD"}
      cart={[]}
      onAddToCart={noop}
      onQuickView={noop}
    />
  );
}

test("badge markup: PROMO in English, عرض in Arabic, one sheen and four sparkles", () => {
  const en = renderToStaticMarkup(<PromoBadge lang="en" />);
  assert.match(en, /data-promo-badge/);
  assert.match(en, /data-promo-lang="en"/);
  assert.match(en, />PROMO</);
  assert.match(en, /role="img"/);
  assert.match(en, /aria-label="Promotional offer"/);
  assert.match(en, /dir="ltr"/);
  assert.match(en, /class="promo-badge__sheen"/);
  assert.equal((en.match(/class="promo-badge__sheen"/g) || []).length, 1, "one light sweep only");
  assert.match(en, /class="promo-badge__sparkles"/);

  const ar = renderToStaticMarkup(<PromoBadge lang="ar" />);
  assert.match(ar, />عرض</);
  assert.match(ar, /dir="rtl"/);
  assert.match(ar, /lang="ar"/);
  assert.match(ar, /aria-label="عرض ترويجي"/);
  assert.doesNotMatch(ar, /PROMO/);

  for (const html of [en, ar]) {
    assert.equal((html.match(/class="promo-badge__sparkle"/g) || []).length, 4, "exactly four sparkles");
    // Decorative, never interactive: no extra tab stop, no button, no ray burst.
    assert.doesNotMatch(html, /<button/);
    assert.doesNotMatch(html, /tabindex/i);
    assert.doesNotMatch(html, /onclick/i);
    assert.doesNotMatch(html, /promo-badge__ray/);
    assert.equal((html.match(/aria-hidden="true"/g) || []).length, 3, "label, sheen and sparkle list");
  }
});

test("every Hot Deals card carries the badge, in the corner opposite the discount", () => {
  const products = [
    product({ id: 1 }),
    product({ id: 2, sku: "NB-SPIRAL-02", price: 81.95, originalPrice: 101.75 }),
    product({ id: 3, sku: "BAG-OSLO-03", price: 324.5, originalPrice: 412.5 }),
  ];

  const ar = carousel("ar", products, true);
  assert.equal((ar.match(/data-promo-badge/g) || []).length, products.length, "one badge per card");
  assert.equal((ar.match(/>عرض</g) || []).length, products.length);

  const en = carousel("en", products, true);
  assert.equal((en.match(/>PROMO</g) || []).length, products.length);

  // The badge lives in the picture box, before the product title: never next to it.
  const badgeIndex = ar.indexOf("data-promo-badge");
  const headingIndex = ar.indexOf("<h3");
  assert.ok(badgeIndex > -1 && headingIndex > -1 && badgeIndex < headingIndex);

  // The discount percentage stays in its own corner, untouched.
  assert.match(ar, /absolute start-2 top-2/);
  assert.match(ar, /-22%/);
  assert.match(ar, /-19%/);
  assert.match(ar, /-21%/);
});

test("category carousels and plain tiles keep the badge off", () => {
  const products = [product({ id: 1 }), product({ id: 2, sku: "NB-2" })];

  for (const lang of ["ar", "en"] as const) {
    const plain = carousel(lang, products);
    assert.doesNotMatch(plain, /data-promo-badge/);
    assert.doesNotMatch(plain, /class="promo-badge"/);
    assert.match(plain, /-22%/, "the discount badge is still rendered");
  }

  const tileWithout = renderToStaticMarkup(
    <ProductTile product={products[0]} lang="en" theme={theme} onOpen={noop} onQuickAdd={noop} />,
  );
  assert.doesNotMatch(tileWithout, /data-promo-badge/);

  const tileWith = renderToStaticMarkup(
    <ProductTile product={products[0]} lang="en" theme={theme} showPromoBadge onOpen={noop} onQuickAdd={noop} />,
  );
  assert.match(tileWith, /data-promo-badge/);
  assert.match(tileWith, /-22%/);
});

test("stylesheet: 3.6s sheen + bounce + twinkle, no rays, reduced motion honoured", () => {
  assert.ok(promoSection.length > 0, "the badge section is present in globals.css");
  assert.match(promoSection, /promotional/);
  assert.match(promoSection, /@keyframes promo-shimmer/);
  assert.match(promoSection, /@keyframes promo-lift/);
  assert.match(promoSection, /@keyframes promo-twinkle/);
  assert.match(promoSection, /animation: promo-lift 3\.6s/);
  assert.match(promoSection, /animation: promo-shimmer 3\.6s/);
  assert.match(promoSection, /animation: promo-twinkle 3\.6s/);
  assert.match(promoSection, /ease-in-out/);
  // Golden oval, red outline, small black shadow, clicks pass through.
  assert.match(promoSection, /border: 2px solid #e30613/);
  assert.match(promoSection, /linear-gradient/);
  assert.match(promoSection, /rgba\(0, 0, 0, 0\.38\)/);
  assert.match(promoSection, /border-radius: 52% 48% 46% 54% \/ 60% 56% 44% 40%/);
  assert.match(promoSection, /pointer-events: none/);
  // No long rays from the centre, and the sparkles never go fully dark.
  assert.doesNotMatch(promoSection, /promo-ray/i);
  assert.doesNotMatch(reducedMotion, /promo-ray/i);
  const twinkle = promoSection.slice(
    promoSection.indexOf("@keyframes promo-twinkle"),
    promoSection.indexOf("@media (prefers-reduced-motion"),
  );
  assert.match(twinkle, /opacity: 0\.28/);
  assert.doesNotMatch(twinkle, /opacity:\s*0\s*[;}]/, "sparkles never go fully dark");
  // Reduced motion: the three animations stop, the badge stays legible.
  assert.match(reducedMotion, /prefers-reduced-motion: reduce/);
  assert.match(reducedMotion, /\.promo-badge,[\s\S]*?\.promo-badge__sheen,[\s\S]*?\.promo-badge__sparkle \{\s*animation: none;/);
  assert.match(reducedMotion, /\.promo-badge__sheen \{\s*opacity: 0;/);
});

test("wiring: Hot Deals only, brand ribbons and other sections untouched", () => {
  assert.equal((pageSource.match(/promoBadge\b/g) || []).length, 1, "a single carousel opts in");
  const dealsTitle = pageSource.indexOf("title={t.dealsTitle}");
  const flag = pageSource.indexOf("promoBadge");
  assert.ok(dealsTitle > -1 && flag > dealsTitle && flag - dealsTitle < 120, "the flag is on the Hot Deals carousel");
  // The badge is never rendered next to a section heading.
  assert.doesNotMatch(pageSource, /PromoBadge/);
  assert.match(pageSource, /<BrandRibbon /);
  assert.match(carouselSource, /showPromoBadge=\{promoBadge\}/);
  assert.match(carouselSource, /promoBadge\?: boolean/);
  assert.match(tileSource, /showPromoBadge/);
  assert.match(tileSource, /showPromoBadge && <PromoBadge lang=\{lang\} \/>/);
  // Brand ribbons keep their own stylesheet untouched.
  assert.match(cssSource, /\.brand-ribbon-track/);
  assert.match(cssSource, /@keyframes brand-ribbon-scroll/);
  assert.match(cssSource, /\.brand-ribbon:hover \.brand-ribbon-track/);
});
