"use client";

import type { TopBanner } from "@/db/schema";
import {
  bannerScrimClass,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { StoreImage } from "@/components/StoreImage";

interface TopBannerRowProps {
  banners: TopBanner[];
  lang: Language;
  theme: ThemeConfig;
  onOpenCatalog: (slug: string) => void;
}

/**
 * Rangée de 3 bannières côte à côte, placée juste sous les rubans de marques.
 * Chaque bannière est entièrement pilotée depuis le panneau admin (photo,
 * textes facultatifs, catégorie cible). Une bannière sans texte affiche
 * uniquement sa photo.
 */
export function TopBannerRow({ banners, lang, theme, onOpenCatalog }: TopBannerRowProps) {
  if (banners.length === 0) return null;

  const isArabic = lang === "ar";

  return (
    <section
      className="mx-auto w-full max-w-[1440px] px-3 pt-3 sm:px-4 lg:px-6"
      role="group"
      aria-label={isArabic ? "اللافتات الرئيسية" : "Featured banners"}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {banners.map((banner, index) => {
          const badge = isArabic ? banner.badgeAr : banner.badgeEn;
          const title = isArabic ? banner.titleAr : banner.titleEn;
          const subtitle = isArabic ? banner.subtitleAr : banner.subtitleEn;
          const cta = isArabic ? banner.ctaAr : banner.ctaEn;
          const hasCopy = Boolean(
            badge?.trim() || title?.trim() || subtitle?.trim() || cta?.trim()
          );
          const fallbackAlt = isArabic
            ? `لافتة ${index + 1}`
            : `Banner ${index + 1}`;

          return (
            <button
              key={banner.id || `top-banner-${index}`}
              type="button"
              onClick={() => onOpenCatalog(banner.targetCategory?.trim() || "all")}
              aria-label={title?.trim() || fallbackAlt}
              className="group relative block h-[220px] overflow-hidden border text-start sm:h-[340px] lg:h-[420px] xl:h-[480px]"
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
                <div className="absolute inset-0 flex items-end p-3 text-white sm:p-5">
                  <div className="max-w-[95%]">
                    {badge?.trim() && (
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-white/85 sm:text-[10px]">
                        {badge}
                      </span>
                    )}
                    {title?.trim() && (
                      <span className="block text-xs font-extrabold leading-tight sm:text-lg">
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
                        className="mt-2 inline-flex px-2 py-1 text-[10px] font-extrabold text-white sm:px-3 sm:py-1.5 sm:text-[11px]"
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
