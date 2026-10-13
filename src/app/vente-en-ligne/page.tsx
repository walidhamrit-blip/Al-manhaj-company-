"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { StoreSettings } from "@/db/schema";
import {
  OrderTrackingSection,
  type OrderTrackingRequest,
} from "@/components/OrderTrackingSection";
import { StoreImage } from "@/components/StoreImage";
import { THEMES, UI_TEXT, type Language } from "@/lib/i18n-themes";
import { hydrateFallbackStore } from "@/lib/fallbackData";
import {
  ArrowRight,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  MessageCircle,
  PackageSearch,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Printer,
} from "lucide-react";

const theme = THEMES[0];

export default function OnlineSalesPage() {
  const [lang, setLang] = useState<Language>("ar");
  const isRtl = lang === "ar";
  const t = UI_TEXT[lang];
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [trackingRequest, setTrackingRequest] =
    useState<OrderTrackingRequest | null>(null);

  const fetchSettings = useCallback(async () => {
    const fallback = hydrateFallbackStore();
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (!res.ok) throw new Error("API not available");
      const data = await res.json();
      if (!data.settings) throw new Error("No settings");
      setSettings({ ...data.settings, id: Number(data.settings.id) || 1 });
    } catch {
      setSettings(fallback.settings as StoreSettings);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSettings]);

  // Deep links from the store: /vente-en-ligne?order=…&phone=…#order-tracking
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const orderNumber = params.get("order");
      const phone = params.get("phone");
      if (orderNumber && phone) {
        setTrackingRequest({ orderNumber, phone, requestId: Date.now() });
      }
      if (window.location.hash === "#order-tracking" || (orderNumber && phone)) {
        document
          .getElementById("order-tracking")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  const whatsappNumber = (settings?.whatsappNumber || "218912145050").replace(
    /\D/g,
    "",
  );
  const contactPhone = settings?.contactPhone || "+218 91-214-5050";

  const steps = [
    { icon: Search, title: t.onlineSalesStep1Title, desc: t.onlineSalesStep1Desc },
    {
      icon: ShoppingBag,
      title: t.onlineSalesStep2Title,
      desc: t.onlineSalesStep2Desc,
    },
    {
      icon: MessageCircle,
      title: t.onlineSalesStep3Title,
      desc: t.onlineSalesStep3Desc,
    },
    { icon: Truck, title: t.onlineSalesStep4Title, desc: t.onlineSalesStep4Desc },
  ];

  const trust = [
    {
      icon: Truck,
      title: t.servicesDelivery,
      sub: t.servicesDeliverySub,
    },
    {
      icon: CreditCard,
      title: t.onlineSalesPaymentCodTitle,
      sub: t.onlineSalesPaymentCodDesc,
    },
    {
      icon: RotateCcw,
      title: t.onlineSalesTrustReturns,
      sub: t.onlineSalesTrustReturnsSub,
      href: "/returns",
      hrefLabel: t.onlineSalesReturnsLink,
    },
    {
      icon: Headphones,
      title: t.servicesSupport,
      sub: t.servicesSupportSub,
      href: `https://wa.me/${whatsappNumber}`,
      hrefLabel: "WhatsApp",
    },
  ];

  const faqs = [
    { q: t.onlineSalesFaq1Q, a: t.onlineSalesFaq1A },
    { q: t.onlineSalesFaq2Q, a: t.onlineSalesFaq2A },
    { q: t.onlineSalesFaq3Q, a: t.onlineSalesFaq3A },
    { q: t.onlineSalesFaq4Q, a: t.onlineSalesFaq4A },
    { q: t.onlineSalesFaq5Q, a: t.onlineSalesFaq5A },
  ];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-online-sales-page
      className="min-h-screen bg-[#EEEEEE] text-[#1A1A1A]"
    >
      <div className="sticky top-0 z-40 shadow-sm">
      <div className="bg-[#222] text-white">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3 px-3 py-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Phone className="h-3.5 w-3.5" />
            <span dir="ltr">{contactPhone}</span>
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
                {t.navOnlineSales}
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
              {t.navOnlineSales}
            </span>
            <Link href="/services" className="px-3 py-2.5 hover:bg-black/15 inline-flex items-center gap-1">
              <Printer className="h-3.5 w-3.5" />
              {lang === "ar" ? "الخدمات" : "Services"}
            </Link>
            <Link href="/wholesale" className="px-3 py-2.5 hover:bg-black/15">
              {t.navWholesale}
            </Link>
            <Link href="/magasin" className="px-3 py-2.5 hover:bg-black/15">
              {t.ourStore}
            </Link>
          </div>
        </nav>
      </header>
      </div>

      <main className="mx-auto max-w-[1760px] px-3 py-6 sm:py-10 space-y-8">
        <section className="relative h-[240px] overflow-hidden bg-black sm:h-[360px]">
          <StoreImage
            src="/images/new/hero-stationery-01.jpg"
            alt={t.onlineSalesTitle}
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-200">
              <PackageSearch className="h-3.5 w-3.5" />
              {t.onlineSalesBadge}
            </p>
            <h1 className="mt-1 max-w-3xl text-2xl font-black sm:text-4xl">
              {t.onlineSalesTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
              {t.onlineSalesLead}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#E30613] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:opacity-95"
              >
                <ShoppingBag className="h-4 w-4" />
                {t.onlineSalesStart}
              </Link>
              <a
                href="#order-tracking"
                className="inline-flex items-center gap-2 bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-[#1A1A1A] shadow-md transition hover:opacity-95"
              >
                <PackageSearch className="h-4 w-4 text-[#E30613]" />
                {t.trackOrder}
              </a>
            </div>
          </div>
        </section>

        <section
          data-online-sales-services
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {trust.map((item) => {
            const inner = (
              <>
                <item.icon className="h-7 w-7 shrink-0 text-[#E30613]" />
                <div>
                  <div className="text-sm font-extrabold">{item.title}</div>
                  <div className="mt-0.5 text-xs leading-5 text-neutral-500">
                    {item.sub}
                  </div>
                  {item.href && item.hrefLabel ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#E30613]">
                      {item.hrefLabel}
                      <ArrowRight
                        className={`h-3 w-3 ${isRtl ? "rotate-180" : ""}`}
                      />
                    </span>
                  ) : null}
                </div>
              </>
            );
            return item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start gap-3 border bg-white p-4 transition hover:border-[#E30613]"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={item.title}
                className="flex items-start gap-3 border bg-white p-4"
              >
                {inner}
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-black">{t.onlineSalesStepsTitle}</h2>
            <p className="text-sm text-neutral-600">{t.onlineSalesStepsDesc}</p>
            <ol
              data-online-sales-steps
              className="grid gap-3 sm:grid-cols-2"
            >
              {steps.map((step) => (
                <li key={step.title} className="border bg-white p-4">
                  <step.icon className="mb-2 h-5 w-5 text-[#E30613]" />
                  <h3 className="text-sm font-extrabold">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5 border bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#E30613]" />
              <h3 className="text-sm font-extrabold">{t.servicesPayment}</h3>
            </div>
            <p className="text-xs leading-5 text-neutral-600">
              {t.onlineSalesPaymentCodDesc}
            </p>
            <div className="mt-4 border-t pt-4">
              <div className="mb-2 flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#E30613]" />
                <h3 className="text-sm font-extrabold">
                  {t.onlineSalesDeliveryTitle}
                </h3>
              </div>
              <ul className="space-y-2 text-xs leading-5 text-neutral-600">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {t.onlineSalesDeliveryTripoli}
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {t.onlineSalesDeliveryLibya}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <OrderTrackingSection
          lang={lang}
          theme={theme}
          trackingRequest={trackingRequest}
        />

        <section className="grid gap-3 md:grid-cols-3">
          <article
            data-online-sales-payment
            className="border bg-white p-4"
          >
            <CreditCard className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">
              {t.onlineSalesPaymentTitle}
            </h2>
            <p className="mt-1 text-sm font-bold text-neutral-700">
              {t.onlineSalesPaymentCodTitle}
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {t.onlineSalesPaymentCodDesc}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-600">
              {t.onlineSalesPaymentConfirmDesc}
            </p>
          </article>
          <article
            data-online-sales-delivery
            className="border bg-white p-4"
          >
            <Truck className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">
              {t.onlineSalesDeliveryTitle}
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {t.onlineSalesDeliveryTripoli}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-600">
              {t.onlineSalesDeliveryLibya}
            </p>
          </article>
          <article
            data-online-sales-returns
            className="border bg-white p-4"
          >
            <RotateCcw className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">
              {t.onlineSalesReturnsTitle}
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              {t.onlineSalesReturnsDesc}
            </p>
            <Link
              href="/returns"
              className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#E30613] underline underline-offset-2"
            >
              {t.onlineSalesReturnsLink}
              <ArrowRight className={`h-3 w-3 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </article>
        </section>

        <section data-online-sales-faq className="border bg-white p-4 sm:p-6">
          <h2 className="mb-3 text-xl font-black">{t.onlineSalesFaqTitle}</h2>
          <div className="divide-y">
            {faqs.map((item) => (
              <details key={item.q} className="py-3">
                <summary className="cursor-pointer text-sm font-extrabold">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-3 border bg-white p-5">
          <MessageCircle className="h-5 w-5 fill-[#25D366] text-[#25D366]" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-extrabold">{t.onlineSalesCtaTitle}</p>
            <p className="text-xs text-neutral-500">{t.onlineSalesCtaDesc}</p>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            className="inline-flex items-center gap-2 bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#1EBE5D]"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            WhatsApp
          </a>
          <a
            href={`tel:${contactPhone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <Phone className="h-4 w-4" />
            {t.onlineSalesCall}
          </a>
        </section>
      </main>

      <footer className="border-t bg-[#1a1a1a] py-8 text-white">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-4 px-3">
          <p className="text-xs font-bold text-neutral-400">
            {lang === "ar"
              ? "شركة المنهج للقرطاسية — طرابلس، ليبيا"
              : "Al Manhaj Company for Stationery — Tripoli, Libya"}
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-neutral-300">
            <Link href="/" className="hover:text-white hover:underline">
              {lang === "ar" ? "المتجر" : "Store"}
            </Link>
            <Link href="/wholesale" className="hover:text-white hover:underline">
              {t.navWholesale}
            </Link>
            <Link href="/services" className="hover:text-white hover:underline">
              {lang === "ar" ? "خدمات الطباعة" : "Printing Services"}
            </Link>
            <Link href="/magasin" className="hover:text-white hover:underline">
              {t.ourStore}
            </Link>
            <Link href="/returns" className="hover:text-white hover:underline">
              {lang === "ar" ? "الاسترجاع والشحن" : "Shipping & returns"}
            </Link>
            <Link href="/privacy" className="hover:text-white hover:underline">
              {lang === "ar" ? "الخصوصية" : "Privacy"}
            </Link>
            <Link href="/terms" className="hover:text-white hover:underline">
              {lang === "ar" ? "الشروط" : "Terms"}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
