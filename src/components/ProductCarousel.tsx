"use client";

import React, { useRef } from "react";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductCard } from "@/components/ProductCard";
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
    <section className="mx-auto w-full max-w-[1320px] px-2 sm:px-3 lg:px-4 py-5 sm:py-6">
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
          const cat = categories.find((c) => c.slug === product.categorySlug);
          const inCart = cart.find((c) => c.product.id === product.id)?.quantity || 0;
          return (
            <div
              key={`carousel-${product.id}`}
              className="w-[180px] sm:w-[210px] lg:w-[220px] shrink-0 snap-start"
            >
              <ProductCard
                product={product}
                category={cat}
                lang={lang}
                theme={theme}
                currencySymbol={currencySymbol}
                cartQty={inCart}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                layout="compact"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
