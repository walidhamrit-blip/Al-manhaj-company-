"use client";

import React from "react";
import type { Product } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { PromoBadge } from "@/components/PromoBadge";
import { Check, Plus } from "lucide-react";

interface ProductTileProps {
  product: Product;
  lang: Language;
  theme: ThemeConfig;
  added?: boolean;
  /**
   * Hot Deals carousels only: adds the golden "PROMO" / "عرض" badge in the
   * corner opposite the discount percentage. Category carousels keep the
   * plain card.
   */
  showPromoBadge?: boolean;
  onOpen: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

/**
 * Carte carrée : photo, nom, prix (badge -% si promo).
 * Un clic sur la carte ouvre la fiche détaillée ; le bouton + ajoute au panier.
 */
export function ProductTile({
  product,
  lang,
  theme,
  added = false,
  showPromoBadge = false,
  onOpen,
  onQuickAdd,
}: ProductTileProps) {
  const t = UI_TEXT[lang];
  const title = lang === "ar" ? product.titleAr : product.titleEn;
  const image =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : "/images/hero-stationery.jpg";

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const outOfStock = product.stock <= 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
      style={{
        backgroundColor: theme.colors.bgElevated,
        borderColor: theme.colors.border,
        color: theme.colors.textPrimary,
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-md border transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <ProductImage
          product={product}
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        />

        {discountPct > 0 && (
          <span
            style={{ backgroundColor: theme.colors.accentPrimary, color: "#FFFFFF" }}
            className="absolute start-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-extrabold shadow-sm"
          >
            -{discountPct}%
          </span>
        )}

        {/* Coin opposé au pourcentage de réduction ; purement décoratif. */}
        {showPromoBadge && <PromoBadge lang={lang} />}

        <button
          type="button"
          disabled={outOfStock}
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product);
          }}
          aria-label={t.addToCart}
          title={t.addToCart}
          style={{
            backgroundColor: added ? "#059669" : theme.colors.accentPrimary,
            color: "#FFFFFF",
          }}
          className="absolute bottom-2 end-2 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition hover:opacity-90 disabled:opacity-40"
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-snug">
          {title}
        </h3>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span
            dir="ltr"
            style={{ color: theme.colors.accentPrimary }}
            className="text-sm font-extrabold tabular-nums"
          >
            {formatPrice(product.price, lang)}
          </span>
          {discountPct > 0 && (
            <span
              dir="ltr"
              style={{ color: theme.colors.textSecondary }}
              className="text-[11px] line-through tabular-nums opacity-75"
            >
              {formatPrice(product.originalPrice as number, lang)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
