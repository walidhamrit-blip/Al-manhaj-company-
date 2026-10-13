"use client";

import React from "react";
import type { Product } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { PromoBadge } from "@/components/PromoBadge";
import { Check, ShoppingCart } from "lucide-react";

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
 * Fiche article presque carrée : photo, nom, prix et bouton panier vert.
 * Sur mobile la photo reste carrée et le texte passe dessous ; à partir de
 * sm la fiche entière a un ratio ~10:11 et la photo remplit l'espace restant.
 * Un clic sur la carte ouvre la fiche détaillée ; le panier vert ajoute au panier.
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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-md border transition-shadow duration-200 hover:shadow-md sm:aspect-[10/11]"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-white sm:aspect-auto sm:min-h-0 sm:flex-1">
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
      </div>

      <div className="flex shrink-0 flex-col gap-1.5 p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-snug sm:text-sm">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span
              dir="ltr"
              style={{ color: theme.colors.accentPrimary }}
              className="text-sm font-extrabold tabular-nums sm:text-base"
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

          <button
            type="button"
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            aria-label={t.addToCart}
            title={t.addToCart}
            className="ms-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
          >
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
