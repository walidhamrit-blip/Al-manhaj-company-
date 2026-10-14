import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  buildWholesaleWhatsAppMessage,
  computeWholesaleQuote,
  WHOLESALE_TIER2_QTY,
  WHOLESALE_TIER3_QTY,
} from "../src/lib/wholesale";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const pageSource = read("src/app/page.tsx");
const wholesalePage = read("src/app/wholesale/page.tsx");
const estimator = read("src/components/WholesaleEstimator.tsx");
const i18n = read("src/lib/i18n-themes.ts");
const packageJson = read("package.json");

test("homepage no longer embeds the interactive wholesale estimator", () => {
  assert.match(pageSource, /href="\/wholesale"/);
  assert.match(pageSource, /data-wholesale-gateway/);
  assert.match(pageSource, /t\.wholesaleOpenPage/);
  assert.match(pageSource, /t\.navWholesale/);
  assert.doesNotMatch(pageSource, /wholesaleProductId/);
  assert.doesNotMatch(pageSource, /wholesaleQty/);
  assert.doesNotMatch(pageSource, /selectedWholesaleProduct/);
  assert.doesNotMatch(pageSource, /data-wholesale-estimator/);
  assert.doesNotMatch(pageSource, /type="range"/);
});

test("B2B /wholesale page hosts the calculator, tiers, ranges, steps, delivery and FAQ", () => {
  assert.match(wholesalePage, /data-wholesale-page/);
  assert.match(estimator, /data-wholesale-estimator/);
  assert.match(wholesalePage, /data-wholesale-tiers/);
  assert.match(wholesalePage, /data-wholesale-ranges/);
  assert.match(wholesalePage, /data-wholesale-steps/);
  assert.match(wholesalePage, /data-wholesale-delivery/);
  assert.match(wholesalePage, /data-wholesale-faq/);
  assert.match(wholesalePage, /WholesaleEstimator/);
  assert.match(wholesalePage, /inquireWholesaleWhatsApp/);
  assert.match(wholesalePage, /resolveWholesaleCopy/);
  assert.match(wholesalePage, /wholesalePage/);
  assert.match(estimator, /type="range"/);
  assert.match(estimator, /inquireWholesaleWhatsApp/);
});

test("wholesale calculator ships a product search bar", () => {
  assert.match(estimator, /data-wholesale-search/);
  assert.match(estimator, /data-wholesale-search-empty/);
  assert.match(estimator, /type="search"/);
  assert.match(estimator, /wholesaleSearchPlaceholder/);
  assert.match(estimator, /wholesaleSearchEmpty/);
  assert.match(estimator, /filteredProducts/);
  assert.match(estimator, /product\.titleAr/);
  assert.match(estimator, /product\.sku/);
  assert.match(i18n, /wholesaleSearchLabel: "Find a Product"/);
  assert.match(i18n, /wholesaleSearchPlaceholder: "Search by name or SKU…"/);
  assert.match(i18n, /wholesaleSearchLabel: "ابحث عن منتج"/);
  assert.match(i18n, /wholesaleSearchPlaceholder: "ابحث بالاسم أو الرمز…"/);
});

test("navigation and i18n expose the wholesale page in Arabic and English", () => {
  assert.match(i18n, /navWholesale: "Wholesale B2B"/);
  assert.match(i18n, /navWholesale: "البيع بالجملة"/);
  assert.match(i18n, /wholesaleOpenPage: "Open the B2B wholesale page"/);
  assert.match(i18n, /wholesaleOpenPage: "افتح صفحة البيع بالجملة"/);
  assert.match(i18n, /wholesaleFaqTitle/);
  assert.match(i18n, /wholesaleRangesTitle/);
  assert.match(read("src/app/magasin/page.tsx"), /href="\/wholesale"/);
});

test("tiered wholesale quote matches the previous homepage estimator", () => {
  const labels = {
    retailLabel: "retail",
    tier1Label: "t1",
    tier2Label: "t2",
    tier3Label: "t3",
  };
  const retail = computeWholesaleQuote({
    retailUnit: 20,
    wholesaleUnit: 15,
    minQty: 10,
    qty: 5,
    ...labels,
  });
  assert.equal(retail.appliedUnit, 20);
  assert.equal(retail.tierName, "retail");
  assert.equal(retail.totalSavings, 0);

  const tier1 = computeWholesaleQuote({
    retailUnit: 20,
    wholesaleUnit: 15,
    minQty: 10,
    qty: 10,
    ...labels,
  });
  assert.equal(tier1.appliedUnit, 15);
  assert.equal(tier1.tierName, "t1");
  assert.equal(tier1.totalCost, 150);
  assert.equal(tier1.totalSavings, 50);

  const tier2 = computeWholesaleQuote({
    retailUnit: 20,
    wholesaleUnit: 15,
    minQty: 10,
    qty: WHOLESALE_TIER2_QTY,
    ...labels,
  });
  assert.equal(tier2.appliedUnit, 14.1);
  assert.equal(tier2.tierName, "t2");

  const tier3 = computeWholesaleQuote({
    retailUnit: 20,
    wholesaleUnit: 15,
    minQty: 10,
    qty: WHOLESALE_TIER3_QTY,
    ...labels,
  });
  assert.equal(tier3.appliedUnit, 13.2);
  assert.equal(tier3.tierName, "t3");
  assert.equal(tier3.totalCost, 2640);
});

test("WhatsApp quote message is bilingual", () => {
  const ar = buildWholesaleWhatsAppMessage({
    lang: "ar",
    productTitle: "دفتر",
    sku: "NB-1",
    qty: 50,
    totalLabel: "100.00 د.ل",
  });
  assert.match(ar, /عرض سعر جملة/);
  assert.match(ar, /NB-1/);
  const en = buildWholesaleWhatsAppMessage({
    lang: "en",
    productTitle: "Notebook",
    sku: "NB-1",
    qty: 50,
    totalLabel: "100.00 LYD",
  });
  assert.match(en, /B2B Wholesale Quote/);
  assert.match(en, /Notebook/);
});

test("preview machinery stays removed", () => {
  assert.doesNotMatch(packageJson, /preview:promo/);
  assert.equal(existsSync(path.join(root, "docs/index.html")), false);
  assert.equal(existsSync(path.join(root, "docs/.nojekyll")), false);
  assert.equal(existsSync(path.join(root, "scripts/build-promo-preview.tsx")), false);
});
