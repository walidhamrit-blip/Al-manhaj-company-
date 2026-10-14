"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MidBannerSlide } from "@/db/schema";
import {
  UI_TEXT,
  bannerImageFrameClass,
  bannerScrimClass,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { StoreImage } from "@/components/StoreImage";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_INTERVAL_MS = 6500;
const SWIPE_THRESHOLD_PX = 40;

interface SectionBannerCarouselProps {
  banners: MidBannerSlide[];
  lang: Language;
  theme: ThemeConfig;
  onOpenCatalog: (slug: string) => void;
}

/** A banner with every text field left blank is a pure photo: no overlay. */
function hasCopy(banner: MidBannerSlide): boolean {
  return Boolean(
    banner.badgeEn?.trim() ||
      banner.badgeAr?.trim() ||
      banner.titleEn?.trim() ||
      banner.titleAr?.trim() ||
      banner.subtitleEn?.trim() ||
      banner.subtitleAr?.trim() ||
      banner.ctaEn?.trim() ||
      banner.ctaAr?.trim()
  );
}

/**
 * Full-width photo banners shown between two homepage sections.
 *
 * The slides cross-fade rather than translate: in Arabic the whole document is
 * mirrored by `dir="rtl"`, and an opacity blend has no direction to get wrong.
 * Autoplay pauses on hover and on keyboard focus, and never runs at all when
 * the visitor asked for reduced motion (the Ken Burns breathing effect is
 * already silenced by globals.css in that case).
 */
export function SectionBannerCarousel({
  banners,
  lang,
  theme,
  onOpenCatalog,
}: SectionBannerCarouselProps) {
  const t = UI_TEXT[lang];
  const isRtl = lang === "ar";
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const count = banners.length;

  const goTo = useCallback(
    (delta: number) => setIndex((prev) => (prev + delta + count) % count),
    [count]
  );

  // Reduced motion: no auto-advance, manual controls stay available.
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (count <= 1 || isPaused || prefersReducedMotion) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, isPaused, prefersReducedMotion]);

  if (count === 0) return null;

  // Safe after the guard above: `index % count` would be NaN on an empty list.
  const current = index % count;

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || count <= 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    // A predominantly vertical drag is the visitor scrolling the page: it must
    // never flip a slide. In RTL, swiping towards the inline end goes back.
    if (Math.abs(dx) < Math.abs(dy)) return;
    const forward = isRtl ? dx > 0 : dx < 0;
    goTo(forward ? 1 : -1);
  };

  return (
    <section
      className="storefront-shell pt-4 sm:pt-5"
      role="group"
      aria-label={t.midBannersTitle}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative h-[210px] w-full overflow-hidden border bg-black sm:h-[290px] lg:h-[360px] xl:h-[420px]"
        style={{ borderColor: theme.colors.border }}
      >
        {banners.map((banner, i) => {
          const active = i === current;
          const copy = hasCopy(banner);
          return (
            <div
              key={banner.id || `banner-${i}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* StoreImage is a plain <img>: it honours `loading` but ignores
                  `priority`/`sizes`, so the first slide is loaded eagerly this
                  way (it sits high enough on the page to be the LCP image).
                  Le cadre porte le miroir éventuel : l'animation Ken Burns et
                  le zoom au survol restent sur l'image et se composent. */}
              <div className={bannerImageFrameClass(lang, banner.mirrorInArabic)}>
                <StoreImage
                  src={banner.imageUrl}
                  alt={lang === "ar" ? banner.titleAr : banner.titleEn}
                  className={`h-full w-full object-cover ${active ? "kenburns-bg" : ""}`}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
              {copy && <div className={bannerScrimClass(lang, "from-black/80 via-black/30 to-transparent")} />}
              {copy && (
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full max-w-2xl px-5 text-white sm:px-10 lg:px-14">
                    {(lang === "ar" ? banner.badgeAr : banner.badgeEn)?.trim() && (
                      <span className="mb-2 inline-flex w-fit bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                        {lang === "ar" ? banner.badgeAr : banner.badgeEn}
                      </span>
                    )}
                    <h2 className="text-xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                      {lang === "ar" ? banner.titleAr : banner.titleEn}
                    </h2>
                    {(lang === "ar" ? banner.subtitleAr : banner.subtitleEn)?.trim() && (
                      <p className="mt-2 hidden max-w-xl text-xs leading-relaxed text-white/85 sm:block sm:text-sm">
                        {lang === "ar" ? banner.subtitleAr : banner.subtitleEn}
                      </p>
                    )}
                    {(lang === "ar" ? banner.ctaAr : banner.ctaEn)?.trim() && (
                      <button
                        type="button"
                        tabIndex={active ? 0 : -1}
                        onClick={() =>
                          onOpenCatalog(banner.targetCategory?.trim() || "all")
                        }
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
                        style={{ backgroundColor: theme.colors.accentPrimary }}
                      >
                        <span>{lang === "ar" ? banner.ctaAr : banner.ctaEn}</span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label={t.bannerPrevious}
              className="absolute start-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition hover:bg-white sm:start-3"
            >
              <ChevronLeft className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label={t.bannerNext}
              className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition hover:bg-white sm:end-3"
            >
              <ChevronRight className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={`dot-${banner.id || i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`${t.bannerGoToSlide} ${i + 1}`}
                  aria-current={i === current}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
