"use client";

import React, { useState } from "react";
import type { Product, Category } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { WholesalePriceDisclosure } from "@/components/WholesalePriceDisclosure";
import {
  X,
  ShoppingBag,
  Layers,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Plus,
  Minus,
} from "lucide-react";

interface ProductQuickViewModalProps {
  product: Product | null;
  category?: Category;
  onClose: () => void;
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
  onAddToCart: (product: Product, qty: number) => void;
}

export function ProductQuickViewModal({
  product,
  category,
  onClose,
  lang,
  theme,
  currencySymbol,
  onAddToCart,
}: ProductQuickViewModalProps) {
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  if (!product) return null;

  const t = UI_TEXT[lang];
  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ["/images/hero-stationery.jpg"];

  const activeImgUrl = images[selectedImg % images.length];
  const isWholesale = qty >= product.wholesaleMinQty;
  const activeUnitPrice = isWholesale
    ? Number(product.wholesalePrice)
    : Number(product.price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
      />

      <div
        className="relative z-10 grid w-full max-w-3xl grid-cols-1 md:grid-cols-2 rounded-lg border border-gray-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 end-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Image Gallery Column */}
        <div className="relative flex flex-col bg-neutral-100">
          <div className="relative aspect-[4/3] md:aspect-square w-full overflow-hidden">
            <ProductImage
              product={product}
              src={activeImgUrl}
              alt={lang === "ar" ? product.titleAr : product.titleEn}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImg(
                      (selectedImg - 1 + images.length) % images.length
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImg((selectedImg + 1) % images.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div
              style={{ backgroundColor: theme.colors.bgSecondary }}
              className="flex items-center justify-center gap-3 p-3"
            >
              {images.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImg(idx)}
                  style={{
                    borderColor:
                      selectedImg === idx
                        ? theme.colors.accentPrimary
                        : "transparent",
                  }}
                  className="h-14 w-20 rounded-xl border-2 overflow-hidden transition"
                >
                  <ProductImage
                    product={product}
                    src={url}
                    alt={`Thumb ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="flex flex-col justify-between p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs mb-2">
              <span
                style={{ color: theme.colors.accentPrimary }}
                className="font-bold uppercase tracking-wider"
              >
                {category
                  ? lang === "ar"
                    ? category.nameAr
                    : category.nameEn
                  : product.categorySlug}
              </span>
              <span className="font-mono text-xs opacity-70">{product.sku}</span>
            </div>

            <h2 className="text-xl font-extrabold leading-snug mb-2">
              {lang === "ar" ? product.titleAr : product.titleEn}
            </h2>

            <div className="mb-3">
              <p
                style={{ color: theme.colors.textSecondary }}
                className={`text-sm leading-relaxed ${detailsExpanded ? "" : "line-clamp-2"}`}
              >
                {lang === "ar" ? product.descriptionAr : product.descriptionEn}
              </p>
              {detailsExpanded && (product.specsEn || product.specsAr) && (
                <div
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    color: theme.colors.textSecondary,
                  }}
                  className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold"
                >
                  {lang === "ar" ? product.specsAr : product.specsEn}
                </div>
              )}
              <button
                type="button"
                aria-expanded={detailsExpanded}
                onClick={() => setDetailsExpanded((expanded) => !expanded)}
                style={{ color: theme.colors.accentPrimary }}
                className="mt-1.5 text-xs font-bold underline underline-offset-2"
              >
                {detailsExpanded ? t.hideDetails : t.readDetails}
              </button>
            </div>

            {/* Retail price is public; wholesale details open only on request. */}
            <div
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
              }}
              className="rounded-2xl border p-3.5 mb-2"
            >
              <span
                style={{ color: theme.colors.textSecondary }}
                className="text-xs block"
              >
                {t.retailPrice}
              </span>
              <span dir="ltr" className="text-xl font-extrabold tabular-nums">
                {formatPrice(product.price, lang)}
              </span>
            </div>
            <div className="mb-4">
              <WholesalePriceDisclosure product={product} lang={lang} theme={theme} />
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                  }}
                  className="inline-flex items-center rounded-xl border p-1"
                >
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 text-sm font-extrabold tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setQty(product.wholesaleMinQty)}
                  style={{
                    backgroundColor: theme.colors.badgeBg,
                    color: theme.colors.badgeText,
                  }}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    {lang === "ar"
                      ? `كمية الجملة (${product.wholesaleMinQty})`
                      : `Set Wholesale (${product.wholesaleMinQty})`}
                  </span>
                </button>
              </div>

              <div className="text-end">
                <span className="text-xs opacity-70 block">
                  {lang === "ar" ? "الإجمالي" : "Total"}
                </span>
                <span dir="ltr" className="text-lg font-extrabold tabular-nums">
                  {formatPrice(activeUnitPrice * qty, lang)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onAddToCart(product, qty);
                onClose();
              }}
              style={{
                backgroundColor: theme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-sm font-extrabold shadow-lg transition hover:opacity-95"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>
                {t.addToCart} ({qty} {t.units})
              </span>
            </button>

            <div className="flex items-center justify-between text-xs opacity-75 pt-1">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <PackageCheck className="h-4 w-4" />
                {t.inStock}: {product.stock} {t.units}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
