"use client";

import type { ArticleBanner } from "@/db/schema";
import {
  bannerScrimClass,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { StoreImage } from "@/components/StoreImage";

interface ArticleBannerGridProps {
  banners: ArticleBanner[];
  lang: Language;
  theme: ThemeConfig;
  onOpenCatalog: (slug: string) => void;
}

/** Medium article/offer banners; blank copy fields intentionally show photos only. */
export function ArticleBannerGrid({
  banners,
  lang,
  theme,
  onOpenCatalog,
}: ArticleBannerGridProps) {
  if (banners.length === 0) return null;

  const isArabic = lang === "ar";

  return (
    <section
      className="mx-auto w-full max-w-[1760px] px-3 pt-3 sm:px-4 lg:px-6"
      role="group"
      aria-label={isArabic ? "لافتات المقالات والعروض" : "Articles and offers"}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {banners.map((banner, index) => {
          const badge = isArabic ? banner.badgeAr : banner.badgeEn;
          const title = isArabic ? banner.titleAr : banner.titleEn;
          const subtitle = isArabic ? banner.subtitleAr : banner.subtitleEn;
          const cta = isArabic ? banner.ctaAr : banner.ctaEn;
          const hasCopy = Boolean(
            badge?.trim() || title?.trim() || subtitle?.trim() || cta?.trim()
          );
          const fallbackAlt = isArabic
            ? `لافتة المقالات والعروض ${index + 1}`
            : `Article and offer banner ${index + 1}`;

          return (
            <button
              key={banner.id || `article-banner-${index}`}
              type="button"
              onClick={() => onOpenCatalog(banner.targetCategory?.trim() || "all")}
              aria-label={title?.trim() || fallbackAlt}
              className="group relative block h-[160px] overflow-hidden border text-start sm:h-[200px] lg:h-[230px]"
              style={{ borderColor: theme.colors.border }}
            >
              <StoreImage
                src={banner.imageUrl}
                alt={title?.trim() || fallbackAlt}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {hasCopy && (
                <div
                  className={bannerScrimClass(
                    lang,
                    "from-black/75 via-black/20 to-transparent"
                  )}
                />
              )}
              {hasCopy && (
                <div className="absolute inset-0 flex items-end p-4 text-white sm:p-5">
                  <div className="max-w-[90%]">
                    {badge?.trim() && (
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/85">
                        {badge}
                      </span>
                    )}
                    {title?.trim() && (
                      <span className="block text-base font-extrabold leading-tight sm:text-lg">
                        {title}
                      </span>
                    )}
                    {subtitle?.trim() && (
                      <span className="mt-1 hidden text-xs leading-relaxed text-white/85 sm:block">
                        {subtitle}
                      </span>
                    )}
                    {cta?.trim() && (
                      <span
                        className="mt-2 inline-flex px-3 py-1.5 text-[11px] font-extrabold text-white"
                        style={{ backgroundColor: theme.colors.accentPrimary }}
                      >
                        {cta}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
