import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductQuickViewModal } from "../src/components/ProductQuickViewModal";
import { ProductTile } from "../src/components/ProductTile";
import type { Product } from "../src/db/schema";
import { THEMES } from "../src/lib/i18n-themes";

const noop = () => {};

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: "NOTEBOOK-01",
    categorySlug: "notebooks",
    subcategorySlug: "",
    titleEn: "A5 Notebook",
    titleAr: "دفتر A5",
    descriptionEn: "A simple notebook.",
    descriptionAr: "دفتر بسيط.",
    price: 12,
    originalPrice: null,
    wholesalePrice: 8,
    wholesaleMinQty: 10,
    stock: 25,
    images: ["/images/hero-stationery.jpg"],
    isFeatured: false,
    isPromotion: false,
    isHidden: false,
    specsEn: "",
    specsAr: "",
    createdAt: null,
    ...overrides,
  } as Product;
}

function render(productData: Product) {
  return renderToStaticMarkup(
    <ProductQuickViewModal
      product={productData}
      onClose={noop}
      lang="en"
      theme={THEMES[0]}
      currencySymbol="LYD"
      onAddToCart={noop}
    />,
  );
}

test("product details use a narrower layout and a plain grass-green purchase button", () => {
  const html = render(product());
  assert.match(html, /max-w-2xl/);
  assert.match(html, /md:grid-cols-\[0\.9fr_1\.1fr\]/);

  const button = html.match(
    /<button(?=[^>]*style="background-color:#4CAF50;color:#FFFFFF")[^>]*>[\s\S]*?<\/button>/,
  );
  assert.ok(button, "the purchase button has the fixed grass-green color");
  assert.match(button[0], /rounded-md/);
  assert.match(button[0], /Add to Cart \(1 units\)/);
  assert.doesNotMatch(button[0], /<svg/, "the button is text-only, without a cart icon");
});

test("purchase button is disabled and labelled when the product is out of stock", () => {
  const html = render(product({ stock: 0 }));
  const button = html.match(
    /<button(?=[^>]*style="background-color:#4CAF50;color:#FFFFFF")[^>]*>[\s\S]*?<\/button>/,
  );
  assert.ok(button);
  assert.match(button[0], /disabled=""/);
  assert.match(button[0], /Out of Stock/);
});

test("homepage product presentation follows the reference hierarchy and opens details", () => {
  const html = renderToStaticMarkup(
    <ProductTile
      product={product({ titleEn: "HP LaserJet Pro Printer", titleAr: "طابعة HP LaserJet Pro" })}
      lang="en"
      theme={THEMES[0]}
      presentation
      showPromoBadge
      onOpen={noop}
      onQuickAdd={noop}
    />,
  );

  assert.match(html, /data-product-presentation-card/);
  assert.match(html, /data-product-title/);
  assert.match(html, /data-product-summary/);
  assert.match(html, /data-product-image/);
  assert.match(html, /src="\/brands\/hp\.svg"/, "known brands use their logo");
  assert.match(html, /text-\[2\.35rem\]/, "the retail price is the visual anchor");
  assert.match(html, /data-promo-badge/);
  assert.equal((html.match(/<button/g) || []).length, 1, "the tile itself opens the detail sheet");
  assert.doesNotMatch(html, /ShoppingCart|Add to Cart/);
});
