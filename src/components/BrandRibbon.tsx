"use client";
import type { Brand, BrandSection } from "@/lib/brand-data";
import { isBrandGroup, ribbonBrands } from "@/lib/brand-ribbons";

export function BrandRibbon({ section, brands, lang, onSearch }: {
  section: BrandSection; brands: Brand[]; lang: "en" | "ar";
  onSearch: (query: string) => void;
}) {
  const items = ribbonBrands(brands, section.group);
  if (!section.isActive || section.type !== "brands" || !isBrandGroup(section.group) || !items.length) return null;
  // Each half must cover the widest ribbon, even with only one active brand.
  // Additional tiles are decorative, not additional keyboard stops.
  // The ribbon is full-bleed like the main banner, so each half must cover a
  // wide viewport (2560px) even with a single active brand.
  const repetitions = Math.max(1, Math.ceil(2560 / (172 * items.length)));
  const tiles = Array.from({ length: repetitions }, () => items).flat();
  const title = section.group === "it"
    ? { en: "Computing & printer brands", ar: "ماركات الحاسوب والطابعات" }
    : { en: "Stationery & school brands", ar: "ماركات القرطاسية والمستلزمات المدرسية" };
  return <section className={`brand-ribbon brand-ribbon--${section.group}`} aria-label={title[lang]} dir={lang === "ar" ? "rtl" : "ltr"}>
    <div className="brand-ribbon-window" dir="ltr">
      <div className="brand-ribbon-track" dir="ltr">
        {[false, true].map((copy) => <div className="brand-ribbon-set" key={String(copy)} aria-hidden={copy || undefined}>
          {tiles.map((brand, index) => <button type="button" key={`${brand.slug}-${index}`}
            data-decorative={index >= items.length || undefined}
            aria-hidden={index >= items.length || undefined}
            tabIndex={copy || index >= items.length ? -1 : 0}
            onClick={() => onSearch(brand.searchQuery || brand.nameEn)} aria-label={brand.nameEn}>
            {/* Local vector logos; no third-party image requests. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brands/${brand.slug}.svg`} alt="" width={144} height={48} />
          </button>)}
        </div>)}
      </div>
    </div>
  </section>;
}
