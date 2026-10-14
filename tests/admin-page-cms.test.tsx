import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_ONLINE_SALES_PAGE,
  DEFAULT_WHOLESALE_PAGE,
  normalizeOnlineSalesPage,
  normalizeWholesalePage,
  resolveOnlineSalesCopy,
  resolveWholesaleCopy,
} from "../src/lib/page-content";
import { UI_TEXT } from "../src/lib/i18n-themes";
import { INITIAL_STORE_SETTINGS } from "../src/lib/fallbackData";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

const adminSource = read("src/components/AdminDashboardModal.tsx");
const editorSource = read("src/components/PageContentEditor.tsx");
const schemaSource = read("src/db/schema.ts");
const settingsApi = read("src/app/api/settings/route.ts");
const seedSource = read("src/db/seed.ts");
const i18n = read("src/lib/i18n-themes.ts");

test("admin panel exposes modification tabs for online sales and wholesale pages", () => {
  assert.match(adminSource, /setActiveTab\("onlineSales"\)/);
  assert.match(adminSource, /setActiveTab\("wholesale"\)/);
  assert.match(adminSource, /data-admin-tab="onlineSales"/);
  assert.match(adminSource, /data-admin-tab="wholesale"/);
  assert.match(adminSource, /adminTabsOnlineSales/);
  assert.match(adminSource, /adminTabsWholesale/);
  assert.match(adminSource, /PageContentEditor/);
  assert.match(editorSource, /data-admin-page-cms/);
  assert.match(editorSource, /adminPageHero/);
  assert.match(editorSource, /adminPageSteps/);
  assert.match(editorSource, /adminPageFaq/);
  assert.match(editorSource, /adminPageTrust/);
  assert.match(editorSource, /adminPageTiers/);
  assert.match(editorSource, /adminPageDelivery/);
  assert.match(editorSource, /adminPageReturns/);
  assert.match(editorSource, /adminPageCta/);
  assert.match(editorSource, /adminPageRanges/);
});

test("i18n labels the new admin tabs in English and Arabic", () => {
  assert.match(i18n, /adminTabsOnlineSales: "Online sales page"/);
  assert.match(i18n, /adminTabsOnlineSales: "صفحة الشراء أونلاين"/);
  assert.match(i18n, /adminTabsWholesale: "Wholesale page"/);
  assert.match(i18n, /adminTabsWholesale: "صفحة البيع بالجملة"/);
});

test("store settings persist online sales and wholesale page CMS payloads", () => {
  assert.match(schemaSource, /onlineSalesPage: jsonb\("online_sales_page"\)/);
  assert.match(schemaSource, /wholesalePage: jsonb\("wholesale_page"\)/);
  assert.match(schemaSource, /export interface OnlineSalesPageConfig/);
  assert.match(schemaSource, /export interface WholesalePageConfig/);
  assert.match(settingsApi, /normalizeOnlineSalesPage/);
  assert.match(settingsApi, /normalizeWholesalePage/);
  assert.match(settingsApi, /body\.onlineSalesPage/);
  assert.match(settingsApi, /body\.wholesalePage/);
  assert.match(seedSource, /online_sales_page/);
  assert.match(seedSource, /wholesale_page/);
  assert.ok(INITIAL_STORE_SETTINGS.onlineSalesPage);
  assert.ok(INITIAL_STORE_SETTINGS.wholesalePage);
  assert.equal(
    INITIAL_STORE_SETTINGS.onlineSalesPage?.titleEn,
    DEFAULT_ONLINE_SALES_PAGE.titleEn,
  );
  assert.equal(
    INITIAL_STORE_SETTINGS.wholesalePage?.titleAr,
    DEFAULT_WHOLESALE_PAGE.titleAr,
  );
});

test("CMS defaults match the public copy and survive a round-trip normalize", () => {
  const online = normalizeOnlineSalesPage(undefined);
  assert.equal(online.titleEn, UI_TEXT.en.onlineSalesTitle);
  assert.equal(online.titleAr, UI_TEXT.ar.onlineSalesTitle);
  assert.equal(online.faqs.length, 5);
  assert.equal(online.steps.length, 4);

  const custom = normalizeOnlineSalesPage({
    titleEn: "Shop from Tripoli",
    titleAr: "تسوّق من طرابلس",
    faqs: [{ id: "x", qEn: "Q?", qAr: "س؟", aEn: "A", aAr: "ج" }],
  });
  assert.equal(custom.titleEn, "Shop from Tripoli");
  assert.equal(custom.faqs.length, 1);
  assert.equal(custom.heroImage, DEFAULT_ONLINE_SALES_PAGE.heroImage);

  const enCopy = resolveOnlineSalesCopy(custom, UI_TEXT.en, "en");
  assert.equal(enCopy.title, "Shop from Tripoli");
  assert.equal(enCopy.faqs[0]?.q, "Q?");

  const wholesale = normalizeWholesalePage({
    titleEn: "Bulk for schools",
    titleAr: "جملة المدارس",
    descAr: "وصف عربي",
  });
  const arCopy = resolveWholesaleCopy(wholesale, UI_TEXT.ar, "ar");
  assert.equal(arCopy.title, "جملة المدارس");
  assert.equal(arCopy.desc, "وصف عربي");
  assert.equal(arCopy.faqTitle, UI_TEXT.ar.wholesaleFaqTitle);
});
