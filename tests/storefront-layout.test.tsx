// Run with tsx: `npm run test:layout`.
//
// Three regressions reported on the storefront, checked without a browser:
//   1. the « الأقسام » (Departments) trigger of the top bar must really drop
//      its mega menu — an `overflow-x-auto` ancestor clips every absolutely
//      positioned descendant, which used to swallow the panel completely and
//      make the button look dead;
//   2. every section under the brand ribbons shares ONE display shell — the
//      same 1760px max-width and the same gutter as the top bar and the
//      footer — the product carousels show at most four cards per view and the
//      department tiles are never cut off at the edge;
//   3. the English brand line of a product card is never cut with an ellipsis:
//      it shrinks until the whole name fits.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogVerticalMenu } from "../src/components/CatalogVerticalMenu";
import { ProductCarousel } from "../src/components/ProductCarousel";
import { TopBannerRow } from "../src/components/TopBannerRow";
import { ArticleBannerGrid } from "../src/components/ArticleBannerGrid";
import { INITIAL_CATEGORIES } from "../src/lib/fallbackData";
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
 * 2. Display area: one shell, whole cards, whole tiles
 * ------------------------------------------------------------------ */

/** Widths visitors actually browse on: small phone up to a large desktop. */
const VIEWPORTS = [360, 390, 640, 768, 1024, 1280, 1366, 1440, 1536, 1680, 1920, 2560];
const REM = 16;
const OLD_CONTENT_WIDTH = 1584;

/** Splits globals.css into its top level and its `@media (min-width: Npx)` blocks. */
function splitMediaBlocks(css: string): { base: string; blocks: { minWidth: number; body: string }[] } {
  const blocks: { minWidth: number; body: string }[] = [];
  const re = /@media \(min-width: (\d+)px\) \{/g;
  let base = "";
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    base += css.slice(last, match.index);
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
      i += 1;
    }
    blocks.push({ minWidth: Number(match[1]), body: css.slice(match.index + match[0].length, i - 1) });
    last = i;
    re.lastIndex = i;
  }
  return { base: base + css.slice(last), blocks };
}

function declaration(css: string, selector: string, property: string): string | null {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) return null;
  const found = css.slice(at, css.indexOf("}", at)).match(new RegExp(`${property}:\\s*([^;]+);`));
  return found ? found[1].trim() : null;
}

/** Value of `property` on `selector` exactly as `viewport` sees it. */
function valueAt(selector: string, property: string, viewport: number): string | null {
  const { base, blocks } = splitMediaBlocks(cssSource);
  let value = declaration(base, selector, property);
  for (const block of blocks.filter((b) => b.minWidth <= viewport)) {
    const override = declaration(block.body, selector, property);
    if (override !== null) value = override;
  }
  return value;
}

const px = (value: string | null): number => {
  assert.ok(value !== null, "the declaration exists");
  const parsed = parseFloat(value!);
  assert.ok(Number.isFinite(parsed), `a length was expected, got ${value}`);
  return value!.endsWith("rem") ? parsed * REM : parsed;
};

/** Width really available to the content of the shell at a given viewport. */
function shellContentWidth(viewport: number): number {
  const max = px(valueAt(".storefront-shell", "max-width", viewport));
  const gutter = px(valueAt(".storefront-shell", "padding-inline", viewport));
  return Math.min(viewport, max) - 2 * gutter;
}

const SHELL_FILES = [
  "src/components/TopBannerRow.tsx",
  "src/components/SectionBannerCarousel.tsx",
  "src/components/ArticleBannerGrid.tsx",
  "src/components/ProductCarousel.tsx",
];

test("the shell is defined once and every section under the ribbons uses it", () => {
  assert.equal(valueAt(".storefront-shell", "max-width", 1920), "1760px");
  // Gutters follow the top bar: 8px, then 12px, then 16px.
  assert.equal(px(valueAt(".storefront-shell", "padding-inline", 360)), 8);
  assert.equal(px(valueAt(".storefront-shell", "padding-inline", 700)), 12);
  assert.equal(px(valueAt(".storefront-shell", "padding-inline", 1200)), 16);

  for (const file of SHELL_FILES) {
    const source = read(file);
    assert.match(source, /storefront-shell/, `${file} follows the shared shell`);
    assert.doesNotMatch(source, /max-w-\[\d+px\]/, `${file} carries no width of its own`);
  }

  // Announcement bar, header, navigation strip, the six sections under the
  // ribbons, the service strip, the footer and its legal strip.
  const shells = pageSource.match(/storefront-shell/g) ?? [];
  assert.ok(
    shells.length >= 9,
    `announcement bar, header, nav strip, tiles, landscape banner, wholesale, ` +
      `services, footer, legal strip (found ${shells.length})`
  );
  assert.doesNotMatch(pageSource, /max-w-\[1584px\]|max-w-\[1440px\]/, "no section keeps the old width");

  // Under the ribbons, nothing caps its own width any more: one shell only.
  const underRibbons = pageSource.slice(pageSource.indexOf("ribbonSections("));
  assert.doesNotMatch(underRibbons, /max-w-\[\d+px\]/, "no section under the ribbons sets its own width");

  // Brand ribbons stay full-bleed, like the main banner.
  const ribbonRule = cssSource.slice(cssSource.indexOf(".brand-ribbon {"));
  const ribbonBlock = ribbonRule.slice(0, ribbonRule.indexOf("}"));
  assert.doesNotMatch(ribbonBlock, /max-width/);
  assert.match(ribbonBlock, /width: 100%/);
});

test("the wider shell gives half of the lateral void back to the content", () => {
  const voidBefore = 1920 - OLD_CONTENT_WIDTH; // 336px of white at 1584px
  const voidAfter = 1920 - px(valueAt(".storefront-shell", "max-width", 1920)!); // 160px
  assert.ok(voidAfter < voidBefore, `the void shrank from ${voidBefore}px to ${voidAfter}px`);
  // "Use half of the void": at most half of it may remain.
  assert.ok(voidAfter <= voidBefore / 2, `${voidAfter}px left is within half of ${voidBefore}px`);
});

test("the main banner and the brand ribbons stay full-bleed", () => {
  // Wider content must not swallow the two bands that are meant to run edge to
  // edge: the hero carousel and the scrolling brand ribbons.
  assert.match(pageSource, /<section className="relative w-full overflow-hidden bg-black">/);
  const heroSection = pageSource.slice(pageSource.indexOf('<main id="top"'));
  assert.match(heroSection, /h-\[260px\] w-full sm:h-\[360px\]/);
});

/** Width of a card at a viewport: `flex-basis`, or the `flex` shorthand below `sm`. */
function cardBasisAt(viewport: number): string | null {
  const basis = valueAt(".product-carousel-card", "flex-basis", viewport);
  if (basis !== null) return basis;
  const shorthand = valueAt(".product-carousel-card", "flex", viewport);
  return shorthand ? shorthand.split(/\s+/)[2] ?? null : null;
}

/** Reads `calc((100% - k * gap) / n)` — or the plain `100%` of the base rule. */
function cardsPerView(flexBasis: string | null): { cards: number; gutters: number } {
  assert.ok(flexBasis !== null, "the card has a flex-basis");
  if (flexBasis === "100%") return { cards: 1, gutters: 0 };
  const parsed = flexBasis!.match(
    /^calc\(\(100% - (?:(\d+) \* )?var\(--carousel-gap\)\) \/ (\d+)\)$/
  );
  assert.ok(parsed, `a share of the track was expected, got ${flexBasis}`);
  return { cards: Number(parsed[2]), gutters: Number(parsed[1] ?? 1) };
}

test("the product carousels never show more than four cards, always whole", () => {
  const gap = px(valueAt(".product-carousel-track", "--carousel-gap", 1920));
  assert.equal(gap, 12);
  assert.match(valueAt(".product-carousel-track", "scroll-snap-type", 1920)!, /x mandatory/);

  for (const viewport of VIEWPORTS) {
    const { cards, gutters } = cardsPerView(cardBasisAt(viewport));
    assert.ok(cards >= 1 && cards <= 4, `${viewport}px shows ${cards} cards per view`);
    // n cards remove exactly n - 1 gutters: the row is filled edge to edge, so
    // the next card starts exactly on the border of the track — never cut.
    assert.equal(gutters, cards - 1, `${viewport}px: ${cards} cards need ${cards - 1} gutters`);

    const track = shellContentWidth(viewport);
    const card = (track - gutters * gap) / cards;
    assert.ok(
      Math.abs(cards * card + gutters * gap - track) < 1e-9,
      `${viewport}px: ${cards} × ${card.toFixed(2)}px fill the ${track}px track`
    );
    // The row being filled exactly also means the furthest scroll offset is a
    // whole number of cards: the END of the track lands on a card border too,
    // so the last page never shows a card cut in half.
    const PRODUCTS = 10; // Hot Deals and the category carousels send 10 products
    const step = card + gap;
    const maxScroll = PRODUCTS * card + (PRODUCTS - 1) * gap - track;
    assert.ok(
      Math.abs(maxScroll / step - Math.round(maxScroll / step)) < 1e-9,
      `${viewport}px: the end of the track is ${maxScroll / step} cards away`
    );
  }

  // Widened with the shell: four cards of ~423px on a 1920px screen.
  const wide = shellContentWidth(1920);
  const card = (wide - 3 * gap) / 4;
  assert.ok(card >= 400, `a desktop card is ${card.toFixed(0)}px wide`);

  const source = read("src/components/ProductCarousel.tsx");
  assert.doesNotMatch(source, /w-\[min\(/, "no viewport-relative card width any more");
  assert.match(source, /product-carousel-card/);
  // The arrows page by whole cards, measured on the track itself.
  assert.match(source, /perView \* step/);
});

test("the carousels render one card slot per product", () => {
  const products = Array.from({ length: 10 }, (_, i) => product({ id: i + 1, sku: `SKU-${i + 1}` }));
  const html = renderToStaticMarkup(
    <ProductCarousel
      title="Hot Deals"
      products={products}
      categories={[category()]}
      lang="en"
      theme={theme}
      currencySymbol="LYD"
      cart={[]}
      onAddToCart={noop}
      onQuickView={noop}
    />
  );
  assert.equal((html.match(/product-carousel-card/g) ?? []).length, 10);
  assert.match(html, /class="storefront-shell py-5 sm:py-6"/);
  assert.match(html, /product-carousel-track no-scrollbar/);
});

/** Departments shown on the homepage in the reference catalogue. */
const DEPARTMENTS = INITIAL_CATEGORIES.filter((item) => !item.parentSlug).length;

function tileGrid(viewport: number) {
  const template = valueAt(".category-tile-grid", "grid-template-columns", viewport);
  assert.ok(template !== null, "the tile grid declares its columns");
  const parsed = template!.match(/^repeat\(auto-fit, minmax\(min\(100%, (\d+)px\), 1fr\)\)$/);
  assert.ok(parsed, `auto-fit columns were expected, got ${template}`);
  const min = Number(parsed[1]);
  const gap = px(valueAt(".category-tile-grid", "gap", viewport));
  const track = shellContentWidth(viewport);
  const columns = Math.floor((track + gap) / (min + gap));
  // The departments share the row they end up in; the rest wrap to the next one.
  const perRow = Math.min(DEPARTMENTS, columns);
  return {
    min,
    gap,
    track,
    columns,
    perRow,
    rows: Math.ceil(DEPARTMENTS / columns),
    tile: (track - (perRow - 1) * gap) / perRow,
  };
}

test("every department tile is whole: the grid wraps instead of clipping", () => {
  const columns = valueAt(".category-tile-grid", "grid-template-columns", 1920)!;
  assert.match(columns, /auto-fit/, "empty tracks collapse, so the tiles stretch");
  assert.doesNotMatch(columns, /auto-fill/, "auto-fill would leave empty tracks");

  for (const viewport of VIEWPORTS) {
    const { columns: cols, tile, min } = tileGrid(viewport);
    assert.ok(cols >= 2, `${viewport}px opens ${cols} columns`);
    assert.ok(tile >= min - 1, `${viewport}px: a tile is ${tile.toFixed(0)}px, floor is ${min}px`);
  }

  // The 11 departments of the reference catalogue fit on ONE line inside the
  // 1760px shell: nothing is left half-visible at the edge of the zone.
  assert.equal(DEPARTMENTS, 11);
  const wide = tileGrid(1920);
  assert.ok(
    wide.columns >= DEPARTMENTS,
    `1920px opens ${wide.columns} columns for ${DEPARTMENTS} departments`
  );
  assert.ok(wide.tile >= 140, `each department tile is ${wide.tile.toFixed(0)}px wide`);

  assert.match(pageSource, /category-tile-grid/, "the homepage renders the tiles as a grid");
  assert.doesNotMatch(pageSource, /HScrollStrip/, "no clipping scroll track any more");
});

test("the banners follow the same shell", () => {
  const banners = renderToStaticMarkup(
    <TopBannerRow
      banners={[
        { id: 1, imageUrl: "/a.jpg", targetCategory: "all" },
        { id: 2, imageUrl: "/b.jpg", targetCategory: "all" },
        { id: 3, imageUrl: "/c.jpg", targetCategory: "all" },
      ] as never}
      lang="en"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.match(banners, /class="storefront-shell pt-3"/);
  assert.match(banners, /grid grid-cols-3/, "the three banners still sit side by side");

  const articles = renderToStaticMarkup(
    <ArticleBannerGrid
      banners={[{ id: 1, imageUrl: "/a.jpg" }, { id: 2, imageUrl: "/b.jpg" }] as never}
      lang="en"
      theme={theme}
      onOpenCatalog={noop}
    />
  );
  assert.match(articles, /class="storefront-shell pt-3"/);
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
