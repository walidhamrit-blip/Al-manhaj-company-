"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Store,
} from "lucide-react";
import { StoreImage } from "@/components/StoreImage";
import { UI_TEXT, type Language } from "@/lib/i18n-themes";

const GALLERY = [
  {
    src: "/images/new/main-storefront-hq.jpg",
    altEn: "Al Manhaj storefront in Al Bivi",
    altAr: "واجهة مغاز شركة المنهج في البيفي",
  },
  {
    src: "/images/almanhaj-storefront.jpg",
    altEn: "Showroom entrance",
    altAr: "مدخل المعرض",
  },
  {
    src: "/images/new/landscape-01.jpg",
    altEn: "Inside the stationery aisles",
    altAr: "داخل أروقة القرطاسية",
  },
  {
    src: "/images/new/hero-stationery-01.jpg",
    altEn: "Paper and writing wall",
    altAr: "ركن الورق وأدوات الكتابة",
  },
];

export default function MagasinPage() {
  const [lang, setLang] = useState<Language>("ar");
  const isRtl = lang === "ar";
  const t = UI_TEXT[lang];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-[#EEEEEE] text-[#1A1A1A]">
      <div className="bg-[#222] text-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-3 py-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Phone className="h-3.5 w-3.5" />
            <span dir="ltr">+218 91-214-5050</span>
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
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-3 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#E30613] text-lg font-black text-white">
              {lang === "ar" ? "م" : "A"}
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold">
                {lang === "ar" ? "شركة المنهج للقرطاسية" : "AL-MANHAJ"}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {t.ourStore}
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2 text-xs font-extrabold text-white"
          >
            {lang === "ar" ? "العودة للمتجر" : "Back to shop"}
            <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
          </Link>
        </div>
        <div className="bg-[#E30613] text-white">
          <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-3 py-2 text-xs font-semibold sm:text-sm">
            <Store className="h-4 w-4" />
            <span>{t.ourStoreTitle}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-3 py-6 sm:py-10">
        <section className="relative h-[280px] overflow-hidden bg-black sm:h-[420px] lg:h-[520px]">
          <StoreImage
            src="/images/new/main-storefront-hq.jpg"
            alt={lang === "ar" ? "واجهة مغاز المنهج" : "Al Manhaj storefront"}
            className="object-cover"
            fill
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-200">
              {lang === "ar" ? "البيفي، طرابلس" : "Al Bivi, Tripoli"}
            </p>
            <h1 className="mt-1 max-w-2xl text-2xl font-black sm:text-4xl">{t.ourStoreTitle}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">{t.ourStoreLead}</p>
          </div>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="border bg-white p-4">
            <MapPin className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">{t.ourStoreAddressTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t.ourStoreMapNote}</p>
          </article>
          <article className="border bg-white p-4">
            <Clock className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">{t.ourStoreHoursTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {lang === "ar" ? "السبت – الخميس: 09:00 – 21:00" : "Sat – Thu: 09:00 – 21:00"}
            </p>
            <p className="text-xs text-neutral-500">
              {lang === "ar" ? "الجمعة: مغلق" : "Friday: closed"}
            </p>
          </article>
          <article className="border bg-white p-4">
            <Phone className="mb-2 h-5 w-5 text-[#E30613]" />
            <h2 className="text-sm font-extrabold">{t.ourStoreContactTitle}</h2>
            <p className="mt-1 font-mono text-sm" dir="ltr">
              +218 91-214-5050
            </p>
            <p className="text-sm">info@almanhaj.ly</p>
          </article>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 border-b border-neutral-300 pb-2 text-xl font-bold">{t.ourStoreGallery}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GALLERY.map((photo) => (
              <div key={photo.src} className="relative h-56 overflow-hidden border bg-white sm:h-72">
                <StoreImage
                  src={photo.src}
                  alt={lang === "ar" ? photo.altAr : photo.altEn}
                  className="h-full w-full object-cover"
                  fill={false}
                  width={960}
                  height={640}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-wrap gap-3 border bg-white p-5">
          <a
            href="https://wa.me/218912145050"
            className="inline-flex items-center gap-2 bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            WhatsApp
          </a>
          <a
            href="tel:+218912145050"
            className="inline-flex items-center gap-2 bg-[#E30613] px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <Phone className="h-4 w-4" />
            {lang === "ar" ? "اتصل الآن" : "Call now"}
          </a>
          <a
            href="mailto:info@almanhaj.ly"
            className="inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-bold"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </section>
      </main>
    </div>
  );
}
