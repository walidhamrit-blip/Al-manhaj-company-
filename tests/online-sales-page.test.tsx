import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const homeSource = read("src/app/page.tsx");
const pageSource = read("src/app/vente-en-ligne/page.tsx");
const layoutSource = read("src/app/vente-en-ligne/layout.tsx");
const i18n = read("src/lib/i18n-themes.ts");

test("dedicated online-sales page hosts the order tracking section", () => {
  assert.match(pageSource, /data-online-sales-page/);
  assert.match(pageSource, /OrderTrackingSection/);
  assert.match(pageSource, /id="order-tracking"|getElementById\("order-tracking"\)/);
  assert.match(pageSource, /trackingRequest/);
  assert.match(pageSource, /params\.get\("order"\)/);
  assert.match(pageSource, /params\.get\("phone"\)/);
  assert.match(layoutSource, /Online Sales/);
  assert.match(layoutSource, /vente-en-ligne|Online sales/i);
});

test("homepage forwards tracking requests to the new page", () => {
  assert.doesNotMatch(homeSource, /OrderTrackingSection/);
  assert.doesNotMatch(homeSource, /setTrackingRequest/);
  assert.match(homeSource, /router\.push\(`\/vente-en-ligne/);
  assert.match(homeSource, /params\.set\("order"/);
  assert.match(homeSource, /params\.set\("phone"/);
  assert.match(homeSource, /href="\/vente-en-ligne"/);
  assert.match(homeSource, /navOnlineSales/);
  const onlineSalesLinks = homeSource.match(/href="\/vente-en-ligne"/g) || [];
  assert.ok(
    onlineSalesLinks.length >= 2,
    "homepage exposes the online-sales link in both the sticky top nav and the footer",
  );
});

test("online-sales title stays visible: sticky headers on both pages", () => {
  // Sticky top navigation on the homepage carries the online-sales link.
  assert.match(homeSource, /<header className="sticky top-0 z-40 bg-white shadow-sm">/);
  // The online-sales page wraps its top bar + header in a sticky container.
  assert.match(pageSource, /sticky top-0 z-40 shadow-sm/);
  assert.match(pageSource, /data-online-sales-page/);
});

test("online-sales page covers professional rubriques in both languages", () => {
  assert.match(pageSource, /data-online-sales-steps/);
  assert.match(pageSource, /data-online-sales-services/);
  assert.match(pageSource, /data-online-sales-payment/);
  assert.match(pageSource, /data-online-sales-delivery/);
  assert.match(pageSource, /data-online-sales-returns/);
  assert.match(pageSource, /data-online-sales-faq/);
  assert.match(pageSource, /onlineSalesFaqTitle/);
  assert.match(pageSource, /onlineSalesPaymentTitle/);
  assert.match(pageSource, /onlineSalesDeliveryTitle/);
  assert.match(pageSource, /onlineSalesReturnsTitle/);
  assert.match(pageSource, /wa\.me/);
  assert.match(pageSource, /href="\/returns"/);

  assert.match(i18n, /navOnlineSales: "Online sales"/);
  assert.match(i18n, /navOnlineSales: "الشراء أونلاين"/);
  assert.match(i18n, /onlineSalesTitle: "Shop online, we deliver across Libya"/);
  assert.match(i18n, /onlineSalesStepsTitle: "كيف تطلب أونلاين"/);
  assert.match(i18n, /onlineSalesFaq1Q: "How long does delivery take\?"/);
  assert.match(i18n, /onlineSalesFaq1Q: "كم تستغرق مدة التوصيل؟"/);
  assert.match(i18n, /onlineSalesCtaTitle/);
});
