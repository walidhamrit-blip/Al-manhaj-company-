"use client";

import React, { useRef } from "react";
import type { Brand } from "@/lib/brand-data";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductTile } from "@/components/ProductTile";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  title: string;
  seeMoreLabel?: string;
  products: Product[];
  categories: Category[];
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
  cart: { product: Product; quantity: number }[];
  brands?: Brand[];
  /** Forwarded to every tile: Hot Deals only, never the category carousels. */
  promoBadge?: boolean;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView: (product: Product) => void;
  onSeeMore?: () => void;
}

export function ProductCarousel({
  title,
  seeMoreLabel,
  products,
  categories,
  lang,
  theme,
  currencySymbol,
  cart,
  brands,
  promoBadge = false,
  onAddToCart,
  onQuickView,
  onSeeMore,
}: ProductCarouselProps) {
  const t = UI_TEXT[lang];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isRtl = lang === "ar";

  const scrollByCards = (direction: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: isRtl ? -direction * amount : direction * amount, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1584px] px-3 py-5 sm:px-4 sm:py-6 lg:px-6">
      <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2" style={{ borderColor: theme.colors.border }}>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        {onSeeMore && (
          <button
            type="button"
            onClick={onSeeMore}
            className="text-xs font-semibold hover:underline sm:text-sm"
            style={{ color: theme.colors.accentPrimary }}
          >
            {seeMoreLabel || t.seeMore}
          </button>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label={isRtl ? "السابق" : "Previous"}
          onClick={() => scrollByCards(-1)}
          className="absolute start-0 top-1/2 z-20 flex h-[84px] w-10 -translate-y-1/2 items-center justify-center border border-[#d2d2d2] bg-white/95 text-neutral-600 shadow-sm transition hover:bg-white hover:text-[#d70a18]"
        >
          {isRtl ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
        </button>
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 pb-2 no-scrollbar scroll-smooth"
        >
          {products.map((product) => {
            const inCart = cart.find((item) => item.product.id === product.id)?.quantity || 0;
            return (
              <div
                key={`carousel-${product.id ?? product.sku}`}
                className="w-[min(82vw,320px)] shrink-0 snap-start sm:w-[min(43vw,340px)] lg:w-[min(31vw,350px)]"
              >
                <ProductTile
                  product={product}
                  lang={lang}
                  theme={theme}
                  brands={brands}
                  added={inCart > 0}
                  presentation
                  showPromoBadge={promoBadge}
                  onOpen={onQuickView}
                  onQuickAdd={(prod) => onAddToCart(prod, 1)}
                />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          aria-label={isRtl ? "التالي" : "Next"}
          onClick={() => scrollByCards(1)}
          className="absolute end-0 top-1/2 z-20 flex h-[84px] w-10 -translate-y-1/2 items-center justify-center border border-[#d2d2d2] bg-white/95 text-neutral-600 shadow-sm transition hover:bg-white hover:text-[#d70a18]"
        >
          {isRtl ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </button>
      </div>
    </section>
  );
}
