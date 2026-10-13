"use client";

import React, { useRef } from "react";
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
    <section className="mx-auto w-full max-w-[1760px] px-3 sm:px-4 lg:px-6 py-5 sm:py-6">
      <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2" style={{ borderColor: theme.colors.border }}>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {onSeeMore && (
            <button
              type="button"
              onClick={onSeeMore}
              className="text-xs sm:text-sm font-semibold hover:underline"
              style={{ color: theme.colors.accentPrimary }}
            >
              {seeMoreLabel || t.seeMore}
            </button>
          )}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByCards(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
            style={{ borderColor: theme.colors.border }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCards(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
            style={{ borderColor: theme.colors.border }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {products.map((product) => {
          const inCart = cart.find((c) => c.product.id === product.id)?.quantity || 0;
          return (
            <div
              key={`carousel-${product.id ?? product.sku}`}
              className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2.25rem)/4)]"
            >
              <ProductTile
                product={product}
                lang={lang}
                theme={theme}
                added={inCart > 0}
                showPromoBadge={promoBadge}
                onOpen={onQuickView}
                onQuickAdd={(prod) => onAddToCart(prod, 1)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
