// Run with tsx: `npm run test:layout`.
//
// Three regressions reported on the storefront, checked without a browser:
//   1. the « الأقسام » (Departments) trigger of the top bar must really drop
//      its mega menu — an `overflow-x-auto` ancestor clips every absolutely
//      positioned descendant, which used to swallow the panel completely and
//      make the button look dead;
//   2. the homepage content is capped at 1440px while the top bar, the footer
//      and the main hero banner keep their full-bleed width;
//   3. the English brand line of a product card is never cut with an ellipsis:
//      it shrinks until the whole name fits.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogVerticalMenu } from "../src/components/CatalogVerticalMenu";
import { ProductTile } from "../src/components/ProductTile";
import { THEMES } from "../src/lib/i18n-themes";
import type { Category, Product } from "../src/db/schema";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const pageSource = read("src/app/page.tsx");
const cssSource = read("src/app/globals.css");

const theme = THEMES[0];
const noop = () => {};

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    slug: "writing",
    parentSlug: null,
    nameEn: "Writing",
    nameAr: "أدوات الكتابة",
    descriptionEn: "",
    descriptionAr: "",
    imageUrl: "",
    badgeEn: "Collection",
    badgeAr: "مجموعة",
    sortOrder: 0,
    showOnHome: true,
    ...overrides,
  } as Category;
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: "PEN-GEL-01",
    categorySlug: "writing",
    subcategorySlug: "gel-pens",
    titleEn: "Office A4 80gsm Copy Paper Carton",
    titleAr: "كرتونة ورق تصوير A4",
    descriptionEn: "A ream box.",
    descriptionAr: "علبة رزم ورق.",
    price: 42,
    originalPrice: null,
    wholesalePrice: 36,
    wholesaleMinQty: 10,
    stock: 20,
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

/* ------------------------------------------------------------------ *
 * 1. Departments trigger of the top bar
 * ------------------------------------------------------------------ */

test("the departments trigger is not wrapped in a scrollable box", () => {
  const navBlock = pageSource.slice(
    pageSource.indexOf("<nav"),
    pageSource.indexOf("</nav>")
  );
  assert.ok(navBlock.length > 0, "the navigation strip is present");

  // Only real class attributes count: the explanatory JSX comments quote the
  // very class that must not wrap the trigger.
  const code = navBlock.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  const triggerAt = code.indexOf("<CatalogVerticalMenu");
  const scrollerAt = code.search(/className="[^"]*overflow-x-auto/);
  assert.ok(triggerAt > -1, "the mega menu is mounted in the strip");
  assert.ok(scrollerAt > -1, "the navigation links still scroll on small screens");
  assert.ok(
    triggerAt < scrollerAt,
    "the trigger sits before the scrollable link track, not inside it"
  );
  assert.doesNotMatch(
    code.slice(0, triggerAt),
    /className="[^"]*overflow/,
    "no overflow on any ancestor of the trigger: the panel would be clipped"
  );
});

test("an open departments menu renders its panel and the whole tree", () => {
  const html = renderToStaticMarkup(
    <CatalogVerticalMenu
      isOpen
      onOpenChange={noop}
      categories={[
        category(),
        category({
          id: 2,
          slug: "gel-pens",
          parentSlug: "writing",
          nameEn: "Gel pens",
          nameAr: "أقلام الجل",
          sortOrder: 1,
        }),
      ]}
      products={[product()]}
      lang="ar"
      theme={theme}
      onSelectCategory={noop}
      onQuickView={noop}
    />
  );

  // The trigger is expanded and wired to the panel it owns.
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /aria-controls="departments-mega-menu"/);
  assert.match(html, /id="departments-mega-menu"/);

  // Desktop panel: dropped under the strip, above the page.
  assert.match(html, /absolute start-0 top-full z-50/);
  assert.match(html, /أدوات الكتابة/, "the department is listed");
  assert.match(html, /أقلام الجل/, "its sub-categories are listed");

  // Closed menu renders only the trigger.
  const closed = renderToStaticMarkup(
    <CatalogVerticalMenu
      isOpen={false}
      onOpenChange={noop}
      categories={[category()]}
      products={[product()]}
      lang="ar"
      theme={theme}
      onSelectCategory={noop}
      onQuickView={noop}
    />
  );
  assert.match(closed, /aria-expanded="false"/);
  assert.doesNotMatch(closed, /id="departments-mega-menu"/);
});

/* ------------------------------------------------------------------ *
 * 2. Width of the display area
 * ------------------------------------------------------------------ */

test("homepage content is capped at 1440px", () => {
  const capped = pageSource.match(/max-w-\[1440px\]/g) ?? [];
  assert.ok(
    capped.length >= 4,
    `category tiles, landscape banner, wholesale gateway and service strip (found ${capped.length})`
  );

  for (const file of [
    "src/components/TopBannerRow.tsx",
    "src/components/SectionBannerCarousel.tsx",
    "src/components/ArticleBannerGrid.tsx",
    "src/components/ProductCarousel.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /max-w-\[1440px\]/, `${file} follows the content width`);
    assert.doesNotMatch(source, /max-w-\[1760px\]/, `${file} no longer uses 1760px`);
  }

  // Brand ribbons scroll inside the same window as the rest of the content.
  const ribbonRule = cssSource.slice(cssSource.indexOf(".brand-ribbon {"));
  assert.match(ribbonRule.slice(0, ribbonRule.indexOf("}")), /max-width: 1440px/);
});

test("top bar, footer and main banner keep their full width", () => {
  // Announcement bar, header, navigation strip, hero copy and footer.
  const wide = pageSource.match(/max-w-\[1760px\]/g) ?? [];
  assert.ok(wide.length >= 5, `header and footer stay at 1760px (found ${wide.length})`);

  // The main banner is full-bleed: the image itself carries no max-width.
  assert.match(
    pageSource,
    /<section className="relative w-full overflow-hidden bg-black">/
  );
  const heroSection = pageSource.slice(pageSource.indexOf('<main id="top"'));
  assert.match(heroSection, /h-\[260px\] w-full sm:h-\[360px\]/);
});

/* ------------------------------------------------------------------ *
 * 3. Brand line of the product cards
 * ------------------------------------------------------------------ */

function brandRow(html: string): string {
  const row = html.match(/<div class="@container flex min-h-9[^"]*" aria-hidden="true">[\s\S]*?<\/div>/);
  assert.ok(row, "the brand row of the card is rendered");
  return row![0];
}

function presentationHtml(overrides: Partial<Product>): string {
  return renderToStaticMarkup(
    <ProductTile
      product={product(overrides)}
      lang="ar"
      theme={theme}
      presentation
      onOpen={noop}
      onQuickAdd={noop}
    />
  );
}

test("long English brand names are sized by the card width, never truncated", () => {
  const html = presentationHtml({
    id: 7,
    sku: "CALC-EXEC-01",
    titleEn: "Tactile Mechanical-Switch 12-Digit Executive Financial Calculator",
    titleAr: "آلة حاسبة مالية تنفيذية 12 خانة",
  });
  const row = brandRow(html);

  assert.match(row, /Tactile Mechanical-Switch/, "the whole name is in the markup");
  assert.doesNotMatch(row, /truncate/, "no ellipsis on the brand line");
  assert.match(row, /@container/, "the row is the sizing container for cqw units");
  assert.match(row, /min-h-9/, "the row can grow to a second line");
  assert.match(row, /break-words whitespace-normal/, "a name that cannot fit wraps");

  // 25 characters x 0.62em -> the name is sized from the card's own width.
  assert.match(row, /font-size:min\(20px, calc\(100cqw \/ 15\.50\)\)/);
});

test("a short brand name keeps the reference size", () => {
  const row = brandRow(presentationHtml({ id: 8, sku: "PAPER-A4-01" }));
  assert.match(row, /Office A4/);
  // 9 characters: 100cqw / 5.58 is far above the 20px cap on any real card.
  assert.match(row, /font-size:min\(20px, calc\(100cqw \/ 5\.58\)\)/);
});

test("a known brand still shows its logo instead of the wordmark", () => {
  const row = brandRow(
    presentationHtml({
      id: 9,
      sku: "HP-TONER-85A",
      titleEn: "LaserJet Pro High-Yield Black Toner Cartridge",
      titleAr: "خرطوشة حبر ليزر سوداء",
    })
  );
  assert.match(row, /\/brands\/hp\.svg/);
  assert.match(row, /object-contain/, "the logo is scaled inside its box, not cropped");
});
