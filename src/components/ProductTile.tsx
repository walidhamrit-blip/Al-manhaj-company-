"use client";

import React from "react";
import Image from "next/image";
import type { Product } from "@/db/schema";
import type { Brand } from "@/lib/brand-data";
import { INITIAL_BRANDS } from "@/lib/brand-data";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { PromoBadge } from "@/components/PromoBadge";
import { Check, ShoppingCart } from "lucide-react";

interface ProductTileProps {
  product: Product;
  lang: Language;
  theme: ThemeConfig;
  added?: boolean;
  /** Homepage carousels use the editorial layout from the product-board reference. */
  presentation?: boolean;
  brands?: Brand[];
  /**
   * Hot Deals carousels only: adds the golden "PROMO" / "عرض" badge in the
   * corner opposite the discount percentage. Category carousels keep the
   * plain card.
   */
  showPromoBadge?: boolean;
  onOpen: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

const COMMON_WORDMARKS = [
  "MSI",
  "ASUS",
  "Lenovo",
  "Acer",
  "Apple",
  "Samsung",
  "Xiaomi",
  "Sony",
  "LG",
];

function normalizeBrandSearch(value: string): string {
  return ` ${value.toLocaleLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ").trim()} `;
}

function findBrand(product: Product, brands: Brand[]): Brand | undefined {
  const searchable = normalizeBrandSearch(
    `${product.titleEn} ${product.titleAr} ${product.sku}`,
  );
  return [...brands]
    .filter((brand) => brand.isActive)
    .sort((a, b) => b.nameEn.length - a.nameEn.length)
    .find((brand) =>
      [brand.nameEn, brand.nameAr, brand.slug.replace(/[-_]+/g, " ")]
        .filter(Boolean)
        .some((name) => searchable.includes(normalizeBrandSearch(name))),
    );
}

function findWordmark(product: Product, brand?: Brand): string {
  if (brand?.nameEn) return brand.nameEn;
  const searchable = normalizeBrandSearch(
    `${product.titleEn} ${product.titleAr} ${product.sku}`,
  );
  const knownWordmark = COMMON_WORDMARKS.find((name) =>
    searchable.includes(normalizeBrandSearch(name)),
  );
  if (knownWordmark) return knownWordmark;
  return product.titleEn.trim().split(/\s+/).slice(0, 2).join(" ") || product.sku;
}

/**
 * Screenshot-style product card. Clicking anywhere opens the detail sheet;
 * the purchase action stays in that sheet rather than appearing as a cart icon
 * in the product presentation.
 */
function ProductPresentationCard({
  product,
  lang,
  theme,
  brands,
  showPromoBadge,
  title,
  description,
  image,
  discountPct,
  onOpen,
}: {
  product: Product;
  lang: Language;
  theme: ThemeConfig;
  brands: Brand[];
  showPromoBadge: boolean;
  title: string;
  description: string;
  image: string;
  discountPct: number;
  onOpen: (product: Product) => void;
}) {
  const matchingBrand = findBrand(product, brands);
  const wordmark = findWordmark(product, matchingBrand);
  const logoSrc = matchingBrand?.logoUrl?.trim();
  const currencyLabel = lang === "ar" ? "د.ل" : "LYD";

  return (
    <button
      type="button"
      data-product-presentation-card
      onClick={() => onOpen(product)}
      aria-label={`${title} — ${formatPrice(product.price, lang)} — ${UI_TEXT[lang].viewDetails}`}
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#D3D3D3",
        color: "#20202B",
      }}
      className="group relative flex aspect-[0.92/1] w-full flex-col overflow-hidden border-2 text-start shadow-[0_2px_4px_rgba(0,0,0,0.16)] transition-shadow duration-200 hover:shadow-[0_5px_13px_rgba(0,0,0,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
    >
      <div className="flex w-full shrink-0 flex-col px-3 pt-2.5">
        <h3
          data-product-title
          className="line-clamp-2 min-h-[2.35em] text-[12px] font-extrabold leading-[1.16] sm:text-[13px]"
        >
          {title}
        </h3>
        <p
          data-product-summary
          style={{ color: theme.colors.textSecondary }}
          className="mt-1 line-clamp-1 min-h-[1.3em] text-[10px] font-semibold leading-tight sm:text-[11px]"
        >
          {description}
        </p>
      </div>

      <div className="flex h-9 w-full shrink-0 items-center px-3" aria-hidden="true">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt=""
            width={112}
            height={32}
            unoptimized
            className="h-7 w-auto max-w-[112px] object-contain object-left"
          />
        ) : (
          <span
            dir="ltr"
            className="max-w-full truncate text-xl font-black italic leading-none tracking-[-0.06em] text-[#171717]"
          >
            {wordmark}
          </span>
        )}
      </div>

      <div
        data-product-image
        className="relative min-h-0 w-full flex-1 overflow-hidden bg-white px-3 pb-1"
      >
        <ProductImage
          product={product}
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {discountPct > 0 && (
          <span
            style={{ backgroundColor: "#E30613", color: "#FFFFFF" }}
            className="absolute start-2 top-2 rounded-sm px-1.5 py-0.5 text-[10px] font-extrabold shadow-sm"
          >
            -{discountPct}%
          </span>
        )}
        {showPromoBadge && <PromoBadge lang={lang} />}
      </div>

      <div className="flex w-full shrink-0 items-end justify-between gap-2 px-3 pb-2.5 pt-1">
        <div className="min-w-0">
          {discountPct > 0 && product.originalPrice && (
            <span
              dir="ltr"
              style={{ color: theme.colors.textSecondary }}
              className="mb-0.5 block text-[10px] font-semibold leading-none line-through opacity-80"
            >
              {formatPrice(product.originalPrice, lang)}
            </span>
          )}
          <span dir="ltr" className="inline-flex items-baseline gap-1 whitespace-nowrap leading-none">
            <span className="text-[2rem] font-black tracking-[-0.07em] text-[#D70A18] sm:text-[2.35rem]">
              {Number(product.price).toFixed(2)}
            </span>
            <span className="text-[10px] font-extrabold text-[#D70A18] sm:text-xs">
              {currencyLabel}
            </span>
          </span>
        </div>
        {product.stock <= 0 && (
          <span className="mb-1 shrink-0 text-[10px] font-bold text-rose-700">
            {UI_TEXT[lang].outOfStock}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * Compact catalogue tile remains available inside the full catalogue drawer;
 * homepage product carousels opt into the screenshot-style presentation above.
 */
export function ProductTile({
  product,
  lang,
  theme,
  added = false,
  presentation = false,
  brands = INITIAL_BRANDS,
  showPromoBadge = false,
  onOpen,
  onQuickAdd,
}: ProductTileProps) {
  const t = UI_TEXT[lang];
  const title = lang === "ar" ? product.titleAr : product.titleEn;
  const description = lang === "ar" ? product.descriptionAr : product.descriptionEn;
  const image =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : "/images/hero-stationery.jpg";

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const outOfStock = product.stock <= 0;

  if (presentation) {
    return (
      <ProductPresentationCard
        product={product}
        lang={lang}
        theme={theme}
        brands={brands}
        showPromoBadge={showPromoBadge}
        title={title}
        description={description}
        image={image}
        discountPct={discountPct}
        onOpen={onOpen}
      />
    );
  }

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
