"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Product, StoreSettings } from "@/db/schema";
import { WholesaleEstimator } from "@/components/WholesaleEstimator";
import { WhatsAppOrderPanel } from "@/components/WhatsAppOrderPanel";
import { StoreImage } from "@/components/StoreImage";
import {
  THEMES,
  UI_TEXT,
  type Language,
} from "@/lib/i18n-themes";
import { hydrateFallbackStore } from "@/lib/fallbackData";
import { CATALOG_DEPARTMENTS } from "@/lib/catalog-tree";
import { getCategoryIllustration } from "@/lib/category-image-fallbacks";
import type { CartItem } from "@/components/CartDrawer";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Globe,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Store,
  Truck,
} from "lucide-react";

const theme = THEMES[0];

function persistCartAdd(product: Product, qtyToAdd: number) {
  try {
    const raw = localStorage.getItem("atelier_cart_v1");
    const prev: CartItem[] = raw ? JSON.parse(raw) : [];
    const existing = prev.find((item) => item.product.id === product.id);
    const next = existing
      ? prev.map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: item.quantity + qtyToAdd }
            : item,
        )
      : [...prev, { product, quantity: qtyToAdd }];
    localStorage.setItem("atelier_cart_v1", JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export default function WholesalePage() {
  const [lang, setLang] = useState<Language>("ar");
  const isRtl = lang === "ar";
  const t = UI_TEXT[lang];
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [waOpen, setWaOpen] = useState(false);
  const [waMessage, setWaMessage] = useState("");

  const fetchStoreData = useCallback(async () => {
    const fallback = hydrateFallbackStore();
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (!res.ok) throw new Error("API not available");
      const data = await res.json();
      setCategories(
        (data.categories?.length ? data.categories : fallback.categories).map(
          (category: Category, index: number) => ({
            ...category,
            id: Number(category.id) || index + 1,
          }),
        ),
      );
      setProducts(
        (data.products?.length ? data.products : fallback.products).map(
          (product: Product, index: number) => ({
            ...product,
            id: Number(product.id) || index + 1,
          }),
        ),
      );
      setSettings(
        data.settings
          ? { ...data.settings, id: Number(data.settings.id) || 1 }
          : (fallback.settings as StoreSettings),
      );
    } catch {
      setCategories(fallback.categories as Category[]);
      setProducts(fallback.products as Product[]);
      setSettings(fallback.settings as StoreSettings);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStoreData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStoreData]);

  const ranges = useMemo(() => {
    return CATALOG_DEPARTMENTS.map((dept) => {
      const child = categories.find((category) => dept.children.includes(category.slug));
      return {
        slug: dept.slug,
        name: lang === "ar" ? dept.nameAr : dept.nameEn,
        image: getCategoryIllustration(child?.slug || dept.children[0]),
        count: products.filter(
          (product) =>
            dept.children.includes(product.categorySlug) ||
            (product.subcategorySlug && dept.children.includes(product.subcategorySlug)),
        ).length,
      };
    });
  }, [categories, products, lang]);

  const openQuote = (message: string) => {
    setWaMessage(message);
    setWaOpen(true);
  };

  const inquireRange = (rangeName: string) => {
    openQuote(
      lang === "ar"
        ? `مرحباً، أود عرض سعر جملة لتشكيلة: ${rangeName}.`
        : `Hello, I would like a wholesale quote for the ${rangeName} range.`,
    );
  };

  const steps = [
    { icon: Layers, title: t.wholesaleStep1Title, desc: t.wholesaleStep1Desc },
    { icon: MessageCircle, title: t.wholesaleStep2Title, desc: t.wholesaleStep2Desc },
    { icon: ClipboardList, title: t.wholesaleStep3Title, desc: t.wholesaleStep3Desc },
    { icon: Truck, title: t.wholesaleStep4Title, desc: t.wholesaleStep4Desc },
  ];

  const faqs = [
    { q: t.wholesaleFaq1Q, a: t.wholesaleFaq1A },
    { q: t.wholesaleFaq2Q, a: t.wholesaleFaq2A },
    { q: t.wholesaleFaq3Q, a: t.wholesaleFaq3A },
    { q: t.wholesaleFaq4Q, a: t.wholesaleFaq4A },
    { q: t.wholesaleFaq5Q, a: t.wholesaleFaq5A },
  ];

  const tiers = [
    {
      pct: settings?.wholesaleDiscountTier1Pct ?? 15,
      label: t.tier1Label,
      featured: false,
    },
    {
      pct: settings?.wholesaleDiscountTier2Pct ?? 22,
      label: t.tier2Label,
      featured: false,
    },
    {
      pct: settings?.wholesaleDiscountTier3Pct ?? 30,
      label: t.tier3Label,
      featured: true,
    },
  ];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-wholesale-page
      className="min-h-screen bg-[#EEEEEE] text-[#1A1A1A]"
    >
      <div className="bg-[#222] text-white">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3 px-3 py-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Phone className="h-3.5 w-3.5" />
            <span dir="ltr">{settings?.contactPhone || "+218 91-214-5050"}</span>
          </span>
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === "en" ? "ar" : "en"))}
            className="inline-flex items-center gap-1 font-bold"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </div>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-3 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#E30613] text-lg font-black text-white">
              {lang === "ar" ? "م" : "A"}
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold">
                {lang === "ar" ? "شركة المنهج للقرطاسية" : "AL-MANHAJ"}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {t.navWholesale}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/magasin"
              className="hidden sm:inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-bold"
            >
              <Store className="h-3.5 w-3.5" />
              {t.ourStore}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2 text-xs font-extrabold text-white"
            >
              {t.backToStore}
              <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
        <nav className="bg-[#E30613] text-white">
          <div className="mx-auto flex max-w-[1760px] items-center gap-1 px-2 text-xs font-bold sm:text-sm">
            <Link href="/" className="px-3 py-2.5 hover:bg-black/15">
              {lang === "ar" ? "المتجر" : "Store"}
            </Link>
            <span className="px-3 py-2.5 bg-black/20" aria-current="page">
              {t.navWholesale}
            </span>
            <Link href="/services" className="px-3 py-2.5 hover:bg-black/15 inline-flex items-center gap-1">
              <Printer className="h-3.5 w-3.5" />
              {lang === "ar" ? "الخدمات" : "Services"}
            </Link>
            <Link href="/magasin" className="px-3 py-2.5 hover:bg-black/15">
              {t.ourStore}
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1760px] px-3 py-6 sm:py-10 space-y-8">
        <section className="relative h-[240px] overflow-hidden bg-black sm:h-[360px]">
          <StoreImage
            src="/images/new/hero-stationery-01.jpg"
            alt={lang === "ar" ? t.wholesaleSectionTitle : t.wholesaleSectionTitle}
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-200">
              <Building2 className="h-3.5 w-3.5" />
              {t.wholesaleSectionBadge}
            </p>
            <h1 className="mt-1 max-w-3xl text-2xl font-black sm:text-4xl">
              {t.wholesaleSectionTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
              {t.wholesaleSectionDesc}
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" data-wholesale-tiers>
          {tiers.map((tier) => (
            <article
              key={tier.label}
              className={`border p-4 ${
                tier.featured ? "bg-[#E30613] text-white border-[#E30613]" : "bg-white"
              }`}
            >
              <div className="text-2xl font-black tabular-nums">
                -{tier.pct}%{" "}
                <span className="text-xs font-bold">{t.discountOff}</span>
              </div>
              <div className="mt-1 text-xs font-extrabold">{tier.label}</div>
            </article>
          ))}
        </section>

        {settings && (
          <p className="border bg-white p-4 text-sm leading-relaxed">
            {lang === "ar" ? settings.wholesaleConditionsAr : settings.wholesaleConditionsEn}
          </p>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-black">{t.wholesaleStepsTitle}</h2>
            <ol className="grid gap-3 sm:grid-cols-2" data-wholesale-steps>
              {steps.map((step) => (
                <li key={step.title} className="border bg-white p-4">
                  <step.icon className="mb-2 h-5 w-5 text-[#E30613]" />
                  <h3 className="text-sm font-extrabold">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5">
            <WholesaleEstimator
              products={products}
              lang={lang}
              theme={theme}
              onAddToCart={persistCartAdd}
              onInquire={openQuote}
            />
            <p className="mt-2 text-[11px] text-neutral-500">
              {t.wholesaleAddedHint}{" "}
              <Link href="/" className="font-bold text-[#E30613] underline underline-offset-2">
                {t.wholesaleGoToStore}
              </Link>
            </p>
          </div>
        </section>

        <section data-wholesale-ranges>
          <h2 className="mb-3 border-b border-neutral-300 pb-2 text-xl font-bold">
            {t.wholesaleRangesTitle}
          </h2>
          <p className="mb-4 text-sm text-neutral-600">{t.wholesaleRangesDesc}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {ranges.map((range) => (
              <button
                type="button"
                key={range.slug}
                onClick={() => inquireRange(range.name)}
                className="group overflow-hidden border bg-white text-start"
              >
                <div className="relative h-24 bg-neutral-100">
                  <StoreImage
                    src={range.image}
                    alt={range.name}
                    className="object-cover"
                    sizes="160px"
                  />
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-extrabold leading-snug">{range.name}</div>
                  <div className="mt-0.5 text-[10px] text-neutral-500">
                    {range.count} {t.itemsLabel}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3" data-wholesale-delivery>
          <article className="border bg-white p-4">
            <Truck className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">{t.wholesaleDeliveryTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t.wholesaleDeliveryFree}</p>
          </article>
          <article className="border bg-white p-4">
            <Store className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">{t.wholesaleDeliveryPickupTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t.wholesaleDeliveryPickup}</p>
          </article>
          <article className="border bg-white p-4">
            <MapPin className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">{t.wholesaleDeliveryCitiesTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t.wholesaleDeliveryCities}</p>
          </article>
        </section>

        <section data-wholesale-faq className="border bg-white p-4 sm:p-6">
          <h2 className="mb-3 text-xl font-black">{t.wholesaleFaqTitle}</h2>
          <div className="divide-y">
            {faqs.map((item) => (
              <details key={item.q} className="py-3">
                <summary className="cursor-pointer text-sm font-extrabold">{item.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-3 border bg-white p-5">
          <Check className="h-5 w-5 text-[#E30613]" />
          <p className="flex-1 text-sm font-semibold">{t.inquireWholesaleWhatsApp}</p>
          <button
            type="button"
            onClick={() =>
              openQuote(
                lang === "ar"
                  ? "مرحباً، أود طلب عرض سعر جملة مخصص للمؤسسات."
                  : "Hello, I would like a custom institutional wholesale quote.",
              )
            }
            className="inline-flex items-center gap-2 bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            WhatsApp
          </button>
          <a
            href={`tel:${(settings?.contactPhone || "+218912145050").replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <Phone className="h-4 w-4" />
            {lang === "ar" ? "اتصل الآن" : "Call now"}
          </a>
        </section>
      </main>

      <WhatsAppOrderPanel
        isOpen={waOpen}
        onClose={() => setWaOpen(false)}
        phoneNumber={settings?.whatsappNumber || "218912145050"}
        message={waMessage}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}
