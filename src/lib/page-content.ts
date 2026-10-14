import type {
  OnlineSalesPageConfig,
  PageCopyItem,
  PageFaqItem,
  PageTrustItem,
  PageTrustLink,
  WholesalePageConfig,
} from "@/db/schema";
import { UI_TEXT, type Language } from "@/lib/i18n-themes";

export const MAX_PAGE_STEPS = 8;
export const MAX_PAGE_TRUST = 8;
export const MAX_PAGE_FAQS = 12;

type UiCopy = (typeof UI_TEXT)[Language];

const en = UI_TEXT.en;
const ar = UI_TEXT.ar;

function copyItem(
  titleEn: string,
  titleAr: string,
  descEn: string,
  descAr: string,
): PageCopyItem {
  return { titleEn, titleAr, descEn, descAr };
}

function faqItem(
  id: string,
  qEn: string,
  qAr: string,
  aEn: string,
  aAr: string,
): PageFaqItem {
  return { id, qEn, qAr, aEn, aAr };
}

export const DEFAULT_ONLINE_SALES_PAGE: OnlineSalesPageConfig = {
  heroImage: "/images/new/hero-stationery-01.jpg",
  badgeEn: en.onlineSalesBadge,
  badgeAr: ar.onlineSalesBadge,
  titleEn: en.onlineSalesTitle,
  titleAr: ar.onlineSalesTitle,
  leadEn: en.onlineSalesLead,
  leadAr: ar.onlineSalesLead,
  ctaEn: en.onlineSalesStart,
  ctaAr: ar.onlineSalesStart,
  stepsTitleEn: en.onlineSalesStepsTitle,
  stepsTitleAr: ar.onlineSalesStepsTitle,
  stepsDescEn: en.onlineSalesStepsDesc,
  stepsDescAr: ar.onlineSalesStepsDesc,
  steps: [
    copyItem(
      en.onlineSalesStep1Title,
      ar.onlineSalesStep1Title,
      en.onlineSalesStep1Desc,
      ar.onlineSalesStep1Desc,
    ),
    copyItem(
      en.onlineSalesStep2Title,
      ar.onlineSalesStep2Title,
      en.onlineSalesStep2Desc,
      ar.onlineSalesStep2Desc,
    ),
    copyItem(
      en.onlineSalesStep3Title,
      ar.onlineSalesStep3Title,
      en.onlineSalesStep3Desc,
      ar.onlineSalesStep3Desc,
    ),
    copyItem(
      en.onlineSalesStep4Title,
      ar.onlineSalesStep4Title,
      en.onlineSalesStep4Desc,
      ar.onlineSalesStep4Desc,
    ),
  ],
  trust: [
    {
      ...copyItem(
        en.servicesDelivery,
        ar.servicesDelivery,
        en.servicesDeliverySub,
        ar.servicesDeliverySub,
      ),
      link: "none",
    },
    {
      ...copyItem(
        en.onlineSalesPaymentCodTitle,
        ar.onlineSalesPaymentCodTitle,
        en.onlineSalesPaymentCodDesc,
        ar.onlineSalesPaymentCodDesc,
      ),
      link: "none",
    },
    {
      ...copyItem(
        en.onlineSalesTrustReturns,
        ar.onlineSalesTrustReturns,
        en.onlineSalesTrustReturnsSub,
        ar.onlineSalesTrustReturnsSub,
      ),
      link: "returns",
    },
    {
      ...copyItem(
        en.servicesSupport,
        ar.servicesSupport,
        en.servicesSupportSub,
        ar.servicesSupportSub,
      ),
      link: "whatsapp",
    },
  ],
  paymentTitleEn: en.onlineSalesPaymentTitle,
  paymentTitleAr: ar.onlineSalesPaymentTitle,
  paymentCodTitleEn: en.onlineSalesPaymentCodTitle,
  paymentCodTitleAr: ar.onlineSalesPaymentCodTitle,
  paymentCodDescEn: en.onlineSalesPaymentCodDesc,
  paymentCodDescAr: ar.onlineSalesPaymentCodDesc,
  paymentConfirmDescEn: en.onlineSalesPaymentConfirmDesc,
  paymentConfirmDescAr: ar.onlineSalesPaymentConfirmDesc,
  deliveryTitleEn: en.onlineSalesDeliveryTitle,
  deliveryTitleAr: ar.onlineSalesDeliveryTitle,
  deliveryTripoliEn: en.onlineSalesDeliveryTripoli,
  deliveryTripoliAr: ar.onlineSalesDeliveryTripoli,
  deliveryLibyaEn: en.onlineSalesDeliveryLibya,
  deliveryLibyaAr: ar.onlineSalesDeliveryLibya,
  returnsTitleEn: en.onlineSalesReturnsTitle,
  returnsTitleAr: ar.onlineSalesReturnsTitle,
  returnsDescEn: en.onlineSalesReturnsDesc,
  returnsDescAr: ar.onlineSalesReturnsDesc,
  faqTitleEn: en.onlineSalesFaqTitle,
  faqTitleAr: ar.onlineSalesFaqTitle,
  faqs: [
    faqItem("os-faq-1", en.onlineSalesFaq1Q, ar.onlineSalesFaq1Q, en.onlineSalesFaq1A, ar.onlineSalesFaq1A),
    faqItem("os-faq-2", en.onlineSalesFaq2Q, ar.onlineSalesFaq2Q, en.onlineSalesFaq2A, ar.onlineSalesFaq2A),
    faqItem("os-faq-3", en.onlineSalesFaq3Q, ar.onlineSalesFaq3Q, en.onlineSalesFaq3A, ar.onlineSalesFaq3A),
    faqItem("os-faq-4", en.onlineSalesFaq4Q, ar.onlineSalesFaq4Q, en.onlineSalesFaq4A, ar.onlineSalesFaq4A),
    faqItem("os-faq-5", en.onlineSalesFaq5Q, ar.onlineSalesFaq5Q, en.onlineSalesFaq5A, ar.onlineSalesFaq5A),
  ],
  ctaTitleEn: en.onlineSalesCtaTitle,
  ctaTitleAr: ar.onlineSalesCtaTitle,
  ctaDescEn: en.onlineSalesCtaDesc,
  ctaDescAr: ar.onlineSalesCtaDesc,
};

export const DEFAULT_WHOLESALE_PAGE: WholesalePageConfig = {
  heroImage: "/images/new/hero-stationery-01.jpg",
  badgeEn: en.wholesaleSectionBadge,
  badgeAr: ar.wholesaleSectionBadge,
  titleEn: en.wholesaleSectionTitle,
  titleAr: ar.wholesaleSectionTitle,
  descEn: en.wholesaleSectionDesc,
  descAr: ar.wholesaleSectionDesc,
  tier1LabelEn: en.tier1Label,
  tier1LabelAr: ar.tier1Label,
  tier2LabelEn: en.tier2Label,
  tier2LabelAr: ar.tier2Label,
  tier3LabelEn: en.tier3Label,
  tier3LabelAr: ar.tier3Label,
  stepsTitleEn: en.wholesaleStepsTitle,
  stepsTitleAr: ar.wholesaleStepsTitle,
  steps: [
    copyItem(
      en.wholesaleStep1Title,
      ar.wholesaleStep1Title,
      en.wholesaleStep1Desc,
      ar.wholesaleStep1Desc,
    ),
    copyItem(
      en.wholesaleStep2Title,
      ar.wholesaleStep2Title,
      en.wholesaleStep2Desc,
      ar.wholesaleStep2Desc,
    ),
    copyItem(
      en.wholesaleStep3Title,
      ar.wholesaleStep3Title,
      en.wholesaleStep3Desc,
      ar.wholesaleStep3Desc,
    ),
    copyItem(
      en.wholesaleStep4Title,
      ar.wholesaleStep4Title,
      en.wholesaleStep4Desc,
      ar.wholesaleStep4Desc,
    ),
  ],
  rangesTitleEn: en.wholesaleRangesTitle,
  rangesTitleAr: ar.wholesaleRangesTitle,
  rangesDescEn: en.wholesaleRangesDesc,
  rangesDescAr: ar.wholesaleRangesDesc,
  deliveryTitleEn: en.wholesaleDeliveryTitle,
  deliveryTitleAr: ar.wholesaleDeliveryTitle,
  deliveryFreeEn: en.wholesaleDeliveryFree,
  deliveryFreeAr: ar.wholesaleDeliveryFree,
  pickupTitleEn: en.wholesaleDeliveryPickupTitle,
  pickupTitleAr: ar.wholesaleDeliveryPickupTitle,
  pickupDescEn: en.wholesaleDeliveryPickup,
  pickupDescAr: ar.wholesaleDeliveryPickup,
  citiesTitleEn: en.wholesaleDeliveryCitiesTitle,
  citiesTitleAr: ar.wholesaleDeliveryCitiesTitle,
  citiesDescEn: en.wholesaleDeliveryCities,
  citiesDescAr: ar.wholesaleDeliveryCities,
  faqTitleEn: en.wholesaleFaqTitle,
  faqTitleAr: ar.wholesaleFaqTitle,
  faqs: [
    faqItem("ws-faq-1", en.wholesaleFaq1Q, ar.wholesaleFaq1Q, en.wholesaleFaq1A, ar.wholesaleFaq1A),
    faqItem("ws-faq-2", en.wholesaleFaq2Q, ar.wholesaleFaq2Q, en.wholesaleFaq2A, ar.wholesaleFaq2A),
    faqItem("ws-faq-3", en.wholesaleFaq3Q, ar.wholesaleFaq3Q, en.wholesaleFaq3A, ar.wholesaleFaq3A),
    faqItem("ws-faq-4", en.wholesaleFaq4Q, ar.wholesaleFaq4Q, en.wholesaleFaq4A, ar.wholesaleFaq4A),
    faqItem("ws-faq-5", en.wholesaleFaq5Q, ar.wholesaleFaq5Q, en.wholesaleFaq5A, ar.wholesaleFaq5A),
  ],
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asTrustLink(value: unknown): PageTrustLink {
  return value === "returns" || value === "whatsapp" ? value : "none";
}

function normalizeCopyItem(
  value: unknown,
  fallback: PageCopyItem = { titleEn: "", titleAr: "", descEn: "", descAr: "" },
): PageCopyItem {
  const src =
    value && typeof value === "object" ? (value as Partial<PageCopyItem>) : {};
  return {
    titleEn: asString(src.titleEn, fallback.titleEn),
    titleAr: asString(src.titleAr, fallback.titleAr),
    descEn: asString(src.descEn, fallback.descEn),
    descAr: asString(src.descAr, fallback.descAr),
  };
}

function normalizeTrustItem(
  value: unknown,
  fallback: PageTrustItem,
): PageTrustItem {
  const src =
    value && typeof value === "object" ? (value as Partial<PageTrustItem>) : {};
  return {
    ...normalizeCopyItem(src, fallback),
    link: asTrustLink(src.link ?? fallback.link),
  };
}

function normalizeFaqItem(value: unknown, fallbackId: string): PageFaqItem {
  const src =
    value && typeof value === "object" ? (value as Partial<PageFaqItem>) : {};
  return {
    id: asString(src.id, fallbackId) || fallbackId,
    qEn: asString(src.qEn),
    qAr: asString(src.qAr),
    aEn: asString(src.aEn),
    aAr: asString(src.aAr),
  };
}

function normalizeCopyList(
  value: unknown,
  fallback: PageCopyItem[],
  max: number,
): PageCopyItem[] {
  if (!Array.isArray(value)) return fallback;
  return value.slice(0, max).map((item, index) =>
    normalizeCopyItem(item, fallback[index] ?? fallback[0]),
  );
}

function normalizeFaqList(
  value: unknown,
  fallback: PageFaqItem[],
  max: number,
): PageFaqItem[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .slice(0, max)
    .map((item, index) =>
      normalizeFaqItem(item, fallback[index]?.id ?? `faq-${index + 1}`),
    );
}

export function normalizeOnlineSalesPage(
  input: unknown,
): OnlineSalesPageConfig {
  const src =
    input && typeof input === "object"
      ? (input as Partial<OnlineSalesPageConfig>)
      : {};
  const d = DEFAULT_ONLINE_SALES_PAGE;
  const trust = Array.isArray(src.trust)
    ? src.trust.slice(0, MAX_PAGE_TRUST).map((item, index) =>
        normalizeTrustItem(item, d.trust[index] ?? d.trust[0]),
      )
    : d.trust;
  return {
    heroImage: asString(src.heroImage, d.heroImage) || d.heroImage,
    badgeEn: asString(src.badgeEn, d.badgeEn),
    badgeAr: asString(src.badgeAr, d.badgeAr),
    titleEn: asString(src.titleEn, d.titleEn),
    titleAr: asString(src.titleAr, d.titleAr),
    leadEn: asString(src.leadEn, d.leadEn),
    leadAr: asString(src.leadAr, d.leadAr),
    ctaEn: asString(src.ctaEn, d.ctaEn),
    ctaAr: asString(src.ctaAr, d.ctaAr),
    stepsTitleEn: asString(src.stepsTitleEn, d.stepsTitleEn),
    stepsTitleAr: asString(src.stepsTitleAr, d.stepsTitleAr),
    stepsDescEn: asString(src.stepsDescEn, d.stepsDescEn),
    stepsDescAr: asString(src.stepsDescAr, d.stepsDescAr),
    steps: normalizeCopyList(src.steps, d.steps, MAX_PAGE_STEPS),
    trust,
    paymentTitleEn: asString(src.paymentTitleEn, d.paymentTitleEn),
    paymentTitleAr: asString(src.paymentTitleAr, d.paymentTitleAr),
    paymentCodTitleEn: asString(src.paymentCodTitleEn, d.paymentCodTitleEn),
    paymentCodTitleAr: asString(src.paymentCodTitleAr, d.paymentCodTitleAr),
    paymentCodDescEn: asString(src.paymentCodDescEn, d.paymentCodDescEn),
    paymentCodDescAr: asString(src.paymentCodDescAr, d.paymentCodDescAr),
    paymentConfirmDescEn: asString(
      src.paymentConfirmDescEn,
      d.paymentConfirmDescEn,
    ),
    paymentConfirmDescAr: asString(
      src.paymentConfirmDescAr,
      d.paymentConfirmDescAr,
    ),
    deliveryTitleEn: asString(src.deliveryTitleEn, d.deliveryTitleEn),
    deliveryTitleAr: asString(src.deliveryTitleAr, d.deliveryTitleAr),
    deliveryTripoliEn: asString(src.deliveryTripoliEn, d.deliveryTripoliEn),
    deliveryTripoliAr: asString(src.deliveryTripoliAr, d.deliveryTripoliAr),
    deliveryLibyaEn: asString(src.deliveryLibyaEn, d.deliveryLibyaEn),
    deliveryLibyaAr: asString(src.deliveryLibyaAr, d.deliveryLibyaAr),
    returnsTitleEn: asString(src.returnsTitleEn, d.returnsTitleEn),
    returnsTitleAr: asString(src.returnsTitleAr, d.returnsTitleAr),
    returnsDescEn: asString(src.returnsDescEn, d.returnsDescEn),
    returnsDescAr: asString(src.returnsDescAr, d.returnsDescAr),
    faqTitleEn: asString(src.faqTitleEn, d.faqTitleEn),
    faqTitleAr: asString(src.faqTitleAr, d.faqTitleAr),
    faqs: normalizeFaqList(src.faqs, d.faqs, MAX_PAGE_FAQS),
    ctaTitleEn: asString(src.ctaTitleEn, d.ctaTitleEn),
    ctaTitleAr: asString(src.ctaTitleAr, d.ctaTitleAr),
    ctaDescEn: asString(src.ctaDescEn, d.ctaDescEn),
    ctaDescAr: asString(src.ctaDescAr, d.ctaDescAr),
  };
}

export function normalizeWholesalePage(input: unknown): WholesalePageConfig {
  const src =
    input && typeof input === "object"
      ? (input as Partial<WholesalePageConfig>)
      : {};
  const d = DEFAULT_WHOLESALE_PAGE;
  return {
    heroImage: asString(src.heroImage, d.heroImage) || d.heroImage,
    badgeEn: asString(src.badgeEn, d.badgeEn),
    badgeAr: asString(src.badgeAr, d.badgeAr),
    titleEn: asString(src.titleEn, d.titleEn),
    titleAr: asString(src.titleAr, d.titleAr),
    descEn: asString(src.descEn, d.descEn),
    descAr: asString(src.descAr, d.descAr),
    tier1LabelEn: asString(src.tier1LabelEn, d.tier1LabelEn),
    tier1LabelAr: asString(src.tier1LabelAr, d.tier1LabelAr),
    tier2LabelEn: asString(src.tier2LabelEn, d.tier2LabelEn),
    tier2LabelAr: asString(src.tier2LabelAr, d.tier2LabelAr),
    tier3LabelEn: asString(src.tier3LabelEn, d.tier3LabelEn),
    tier3LabelAr: asString(src.tier3LabelAr, d.tier3LabelAr),
    stepsTitleEn: asString(src.stepsTitleEn, d.stepsTitleEn),
    stepsTitleAr: asString(src.stepsTitleAr, d.stepsTitleAr),
    steps: normalizeCopyList(src.steps, d.steps, MAX_PAGE_STEPS),
    rangesTitleEn: asString(src.rangesTitleEn, d.rangesTitleEn),
    rangesTitleAr: asString(src.rangesTitleAr, d.rangesTitleAr),
    rangesDescEn: asString(src.rangesDescEn, d.rangesDescEn),
    rangesDescAr: asString(src.rangesDescAr, d.rangesDescAr),
    deliveryTitleEn: asString(src.deliveryTitleEn, d.deliveryTitleEn),
    deliveryTitleAr: asString(src.deliveryTitleAr, d.deliveryTitleAr),
    deliveryFreeEn: asString(src.deliveryFreeEn, d.deliveryFreeEn),
    deliveryFreeAr: asString(src.deliveryFreeAr, d.deliveryFreeAr),
    pickupTitleEn: asString(src.pickupTitleEn, d.pickupTitleEn),
    pickupTitleAr: asString(src.pickupTitleAr, d.pickupTitleAr),
    pickupDescEn: asString(src.pickupDescEn, d.pickupDescEn),
    pickupDescAr: asString(src.pickupDescAr, d.pickupDescAr),
    citiesTitleEn: asString(src.citiesTitleEn, d.citiesTitleEn),
    citiesTitleAr: asString(src.citiesTitleAr, d.citiesTitleAr),
    citiesDescEn: asString(src.citiesDescEn, d.citiesDescEn),
    citiesDescAr: asString(src.citiesDescAr, d.citiesDescAr),
    faqTitleEn: asString(src.faqTitleEn, d.faqTitleEn),
    faqTitleAr: asString(src.faqTitleAr, d.faqTitleAr),
    faqs: normalizeFaqList(src.faqs, d.faqs, MAX_PAGE_FAQS),
  };
}

export function pickLocalized(
  valueEn: string | undefined,
  valueAr: string | undefined,
  lang: Language,
  fallback: string,
): string {
  const primary = (lang === "ar" ? valueAr : valueEn)?.trim() ?? "";
  if (primary) return primary;
  const secondary = (lang === "ar" ? valueEn : valueAr)?.trim() ?? "";
  if (secondary) return secondary;
  return fallback;
}

function localizedCopy(
  item: PageCopyItem | undefined,
  lang: Language,
  fallbackTitle: string,
  fallbackDesc: string,
) {
  return {
    title: pickLocalized(item?.titleEn, item?.titleAr, lang, fallbackTitle),
    desc: pickLocalized(item?.descEn, item?.descAr, lang, fallbackDesc),
  };
}

const ONLINE_STEP_FALLBACKS: Array<{ title: keyof UiCopy; desc: keyof UiCopy }> = [
  { title: "onlineSalesStep1Title", desc: "onlineSalesStep1Desc" },
  { title: "onlineSalesStep2Title", desc: "onlineSalesStep2Desc" },
  { title: "onlineSalesStep3Title", desc: "onlineSalesStep3Desc" },
  { title: "onlineSalesStep4Title", desc: "onlineSalesStep4Desc" },
];

const ONLINE_FAQ_FALLBACKS: Array<{ q: keyof UiCopy; a: keyof UiCopy }> = [
  { q: "onlineSalesFaq1Q", a: "onlineSalesFaq1A" },
  { q: "onlineSalesFaq2Q", a: "onlineSalesFaq2A" },
  { q: "onlineSalesFaq3Q", a: "onlineSalesFaq3A" },
  { q: "onlineSalesFaq4Q", a: "onlineSalesFaq4A" },
  { q: "onlineSalesFaq5Q", a: "onlineSalesFaq5A" },
];

const WHOLESALE_STEP_FALLBACKS: Array<{ title: keyof UiCopy; desc: keyof UiCopy }> = [
  { title: "wholesaleStep1Title", desc: "wholesaleStep1Desc" },
  { title: "wholesaleStep2Title", desc: "wholesaleStep2Desc" },
  { title: "wholesaleStep3Title", desc: "wholesaleStep3Desc" },
  { title: "wholesaleStep4Title", desc: "wholesaleStep4Desc" },
];

const WHOLESALE_FAQ_FALLBACKS: Array<{ q: keyof UiCopy; a: keyof UiCopy }> = [
  { q: "wholesaleFaq1Q", a: "wholesaleFaq1A" },
  { q: "wholesaleFaq2Q", a: "wholesaleFaq2A" },
  { q: "wholesaleFaq3Q", a: "wholesaleFaq3A" },
  { q: "wholesaleFaq4Q", a: "wholesaleFaq4A" },
  { q: "wholesaleFaq5Q", a: "wholesaleFaq5A" },
];

export function resolveOnlineSalesCopy(
  config: OnlineSalesPageConfig | null | undefined,
  t: UiCopy,
  lang: Language,
) {
  const page = normalizeOnlineSalesPage(config);
  const trustFallbacks: Array<{ title: keyof UiCopy; desc: keyof UiCopy }> = [
    { title: "servicesDelivery", desc: "servicesDeliverySub" },
    { title: "onlineSalesPaymentCodTitle", desc: "onlineSalesPaymentCodDesc" },
    { title: "onlineSalesTrustReturns", desc: "onlineSalesTrustReturnsSub" },
    { title: "servicesSupport", desc: "servicesSupportSub" },
  ];
  return {
    heroImage: page.heroImage,
    badge: pickLocalized(page.badgeEn, page.badgeAr, lang, t.onlineSalesBadge),
    title: pickLocalized(page.titleEn, page.titleAr, lang, t.onlineSalesTitle),
    lead: pickLocalized(page.leadEn, page.leadAr, lang, t.onlineSalesLead),
    cta: pickLocalized(page.ctaEn, page.ctaAr, lang, t.onlineSalesStart),
    stepsTitle: pickLocalized(
      page.stepsTitleEn,
      page.stepsTitleAr,
      lang,
      t.onlineSalesStepsTitle,
    ),
    stepsDesc: pickLocalized(
      page.stepsDescEn,
      page.stepsDescAr,
      lang,
      t.onlineSalesStepsDesc,
    ),
    steps: page.steps.map((step, index) => {
      const fb = ONLINE_STEP_FALLBACKS[index];
      return localizedCopy(
        step,
        lang,
        fb ? String(t[fb.title]) : "",
        fb ? String(t[fb.desc]) : "",
      );
    }),
    trust: page.trust.map((item, index) => {
      const fb = trustFallbacks[index];
      return {
        ...localizedCopy(
          item,
          lang,
          fb ? String(t[fb.title]) : "",
          fb ? String(t[fb.desc]) : "",
        ),
        link: item.link ?? "none",
      };
    }),
    paymentTitle: pickLocalized(
      page.paymentTitleEn,
      page.paymentTitleAr,
      lang,
      t.onlineSalesPaymentTitle,
    ),
    paymentCodTitle: pickLocalized(
      page.paymentCodTitleEn,
      page.paymentCodTitleAr,
      lang,
      t.onlineSalesPaymentCodTitle,
    ),
    paymentCodDesc: pickLocalized(
      page.paymentCodDescEn,
      page.paymentCodDescAr,
      lang,
      t.onlineSalesPaymentCodDesc,
    ),
    paymentConfirmDesc: pickLocalized(
      page.paymentConfirmDescEn,
      page.paymentConfirmDescAr,
      lang,
      t.onlineSalesPaymentConfirmDesc,
    ),
    deliveryTitle: pickLocalized(
      page.deliveryTitleEn,
      page.deliveryTitleAr,
      lang,
      t.onlineSalesDeliveryTitle,
    ),
    deliveryTripoli: pickLocalized(
      page.deliveryTripoliEn,
      page.deliveryTripoliAr,
      lang,
      t.onlineSalesDeliveryTripoli,
    ),
    deliveryLibya: pickLocalized(
      page.deliveryLibyaEn,
      page.deliveryLibyaAr,
      lang,
      t.onlineSalesDeliveryLibya,
    ),
    returnsTitle: pickLocalized(
      page.returnsTitleEn,
      page.returnsTitleAr,
      lang,
      t.onlineSalesReturnsTitle,
    ),
    returnsDesc: pickLocalized(
      page.returnsDescEn,
      page.returnsDescAr,
      lang,
      t.onlineSalesReturnsDesc,
    ),
    faqTitle: pickLocalized(
      page.faqTitleEn,
      page.faqTitleAr,
      lang,
      t.onlineSalesFaqTitle,
    ),
    faqs: page.faqs.map((item, index) => {
      const fb = ONLINE_FAQ_FALLBACKS[index];
      return {
        q: pickLocalized(item.qEn, item.qAr, lang, fb ? String(t[fb.q]) : ""),
        a: pickLocalized(item.aEn, item.aAr, lang, fb ? String(t[fb.a]) : ""),
      };
    }),
    ctaTitle: pickLocalized(
      page.ctaTitleEn,
      page.ctaTitleAr,
      lang,
      t.onlineSalesCtaTitle,
    ),
    ctaDesc: pickLocalized(
      page.ctaDescEn,
      page.ctaDescAr,
      lang,
      t.onlineSalesCtaDesc,
    ),
  };
}

export function resolveWholesaleCopy(
  config: WholesalePageConfig | null | undefined,
  t: UiCopy,
  lang: Language,
) {
  const page = normalizeWholesalePage(config);
  return {
    heroImage: page.heroImage,
    badge: pickLocalized(
      page.badgeEn,
      page.badgeAr,
      lang,
      t.wholesaleSectionBadge,
    ),
    title: pickLocalized(
      page.titleEn,
      page.titleAr,
      lang,
      t.wholesaleSectionTitle,
    ),
    desc: pickLocalized(page.descEn, page.descAr, lang, t.wholesaleSectionDesc),
    tier1Label: pickLocalized(
      page.tier1LabelEn,
      page.tier1LabelAr,
      lang,
      t.tier1Label,
    ),
    tier2Label: pickLocalized(
      page.tier2LabelEn,
      page.tier2LabelAr,
      lang,
      t.tier2Label,
    ),
    tier3Label: pickLocalized(
      page.tier3LabelEn,
      page.tier3LabelAr,
      lang,
      t.tier3Label,
    ),
    stepsTitle: pickLocalized(
      page.stepsTitleEn,
      page.stepsTitleAr,
      lang,
      t.wholesaleStepsTitle,
    ),
    steps: page.steps.map((step, index) => {
      const fb = WHOLESALE_STEP_FALLBACKS[index];
      return localizedCopy(
        step,
        lang,
        fb ? String(t[fb.title]) : "",
        fb ? String(t[fb.desc]) : "",
      );
    }),
    rangesTitle: pickLocalized(
      page.rangesTitleEn,
      page.rangesTitleAr,
      lang,
      t.wholesaleRangesTitle,
    ),
    rangesDesc: pickLocalized(
      page.rangesDescEn,
      page.rangesDescAr,
      lang,
      t.wholesaleRangesDesc,
    ),
    deliveryTitle: pickLocalized(
      page.deliveryTitleEn,
      page.deliveryTitleAr,
      lang,
      t.wholesaleDeliveryTitle,
    ),
    deliveryFree: pickLocalized(
      page.deliveryFreeEn,
      page.deliveryFreeAr,
      lang,
      t.wholesaleDeliveryFree,
    ),
    pickupTitle: pickLocalized(
      page.pickupTitleEn,
      page.pickupTitleAr,
      lang,
      t.wholesaleDeliveryPickupTitle,
    ),
    pickupDesc: pickLocalized(
      page.pickupDescEn,
      page.pickupDescAr,
      lang,
      t.wholesaleDeliveryPickup,
    ),
    citiesTitle: pickLocalized(
      page.citiesTitleEn,
      page.citiesTitleAr,
      lang,
      t.wholesaleDeliveryCitiesTitle,
    ),
    citiesDesc: pickLocalized(
      page.citiesDescEn,
      page.citiesDescAr,
      lang,
      t.wholesaleDeliveryCities,
    ),
    faqTitle: pickLocalized(
      page.faqTitleEn,
      page.faqTitleAr,
      lang,
      t.wholesaleFaqTitle,
    ),
    faqs: page.faqs.map((item, index) => {
      const fb = WHOLESALE_FAQ_FALLBACKS[index];
      return {
        q: pickLocalized(item.qEn, item.qAr, lang, fb ? String(t[fb.q]) : ""),
        a: pickLocalized(item.aEn, item.aAr, lang, fb ? String(t[fb.a]) : ""),
      };
    }),
  };
}

export function emptyCopyItem(): PageCopyItem {
  return { titleEn: "", titleAr: "", descEn: "", descAr: "" };
}

export function emptyTrustItem(): PageTrustItem {
  return { ...emptyCopyItem(), link: "none" };
}

export function emptyFaqItem(prefix: string): PageFaqItem {
  return {
    id: `${prefix}-${Date.now()}`,
    qEn: "",
    qAr: "",
    aEn: "",
    aAr: "",
  };
}
