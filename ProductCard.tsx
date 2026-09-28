"use client";

import React, { useRef, useState } from "react";
import type { Product, Category } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import {
  ShoppingBag,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Eye,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";

interface ProductCardProps {
  product: Product;
  category?: Category;
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
  cartQty: number;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView: (product: Product) => void;
}

export function ProductCard({
  product,
  category,
  lang,
  theme,
  currencySymbol,
  cartQty,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const t = UI_TEXT[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : ["/images/hero-stationery.jpg"];

  const title = lang === "ar" ? product.titleAr : product.titleEn;
  const description = lang === "ar" ? product.descriptionAr : product.descriptionEn;
  const specs = lang === "ar" ? product.specsAr : product.specsEn;
  const categoryName = category
    ? lang === "ar"
      ? category.nameAr
      : category.nameEn
    : product.categorySlug;

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(Math.abs(scrollLeft) / clientWidth);
      setActiveImageIdx(Math.min(idx, images.length - 1));
    }
  };

  const scrollToImage = (index: number) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    const targetIdx = (index + images.length) % images.length;
    setActiveImageIdx(targetIdx);
    scrollRef.current.scrollTo({
      left: lang === "ar" ? -targetIdx * width : targetIdx * width,
      behavior: "smooth",
    });
  };

  const triggerAdd = (qty: number) => {
    if (product.stock <= 0) return;
    onAddToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgElevated,
        borderColor: theme.colors.border,
        color: theme.colors.textPrimary,
      }}
      className="group relative flex flex-col rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
    >
      {/* Image Gallery Container (Scrollable 1 or 2 photos) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {images.map((imgUrl, idx) => (
            <div
              key={`${product.id}-img-${idx}`}
              className="relative h-full w-full flex-shrink-0 snap-center overflow-hidden"
            >
              <img
                src={imgUrl}
                alt={`${title} - ${idx + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Top Badges */}
        <div className="pointer-events-none absolute top-3 inset-x-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {discountPct > 0 && (
              <span
                style={{
                  backgroundColor: theme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm"
              >
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && (
              <span
                style={{
                  backgroundColor: theme.colors.badgeBg,
                  color: theme.colors.badgeText,
                }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md"
              >
                <Sparkles className="h-3 w-3" />
                {lang === "ar" ? "الأكثر مبيعاً" : "Bestseller"}
              </span>
            )}
          </div>

          {/* Photo counter badge */}
          {images.length > 1 && (
            <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {activeImageIdx + 1} / {images.length} {t.photoCount}
            </span>
          )}
        </div>

        {/* Navigation Arrows for Multi-Image Scroll */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToImage(activeImageIdx - 1);
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition hover:bg-white active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToImage(activeImageIdx + 1);
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition hover:bg-white active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Bottom Dots + Quick View Trigger */}
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      activeImageIdx === i
                        ? "w-5 bg-white"
                        : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-white"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{t.viewDetails}</span>
              </button>
            </div>
          </>
        )}

        {images.length === 1 && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{t.viewDetails}</span>
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category & Stock Row */}
        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
          <span
            style={{ color: theme.colors.accentPrimary }}
            className="font-semibold uppercase tracking-wider truncate"
          >
            {categoryName}
          </span>

          {product.stock > 15 ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <PackageCheck className="h-3.5 w-3.5" />
              {t.inStock} ({product.stock})
            </span>
          ) : product.stock > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t.lowStock} ({product.stock})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
              {t.outOfStock}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onQuickView(product)}
          className="cursor-pointer text-base sm:text-lg font-bold leading-snug line-clamp-2 mb-1.5 hover:opacity-80 transition-opacity"
        >
          {title}
        </h3>

        {/* Technical Specs Pill */}
        {specs && (
          <p
            style={{
              backgroundColor: theme.colors.bgSecondary,
              color: theme.colors.textSecondary,
            }}
            className="mb-2.5 inline-block self-start rounded-lg px-2.5 py-1 text-[11px] font-medium"
          >
            {specs}
          </p>
        )}

        {/* Product Description */}
        <p
          style={{ color: theme.colors.textSecondary }}
          className="text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 flex-1"
        >
          {description}
        </p>

        {/* Dual Pricing Box: Retail + Wholesale */}
        <div
          style={{
            backgroundColor: theme.colors.bgSecondary,
            borderColor: theme.colors.border,
          }}
          className="mb-4 rounded-xl border p-3 flex items-center justify-between gap-2"
        >
          <div>
            <span
              style={{ color: theme.colors.textSecondary }}
              className="block text-[11px] font-medium"
            >
              {t.retailPrice}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span dir="ltr" className="text-lg sm:text-xl font-extrabold tabular-nums">
                {formatPrice(product.price, lang)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span
                  style={{ color: theme.colors.textSecondary }}
                  dir="ltr"
                  className="text-xs line-through opacity-75 tabular-nums"
                >
                  {formatPrice(product.originalPrice, lang)}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              backgroundColor: theme.colors.badgeBg,
              color: theme.colors.badgeText,
            }}
            className="rounded-lg px-2.5 py-1.5 text-right"
          >
            <div className="flex items-center justify-end gap-1 text-[11px] font-bold">
              <Layers className="h-3 w-3" />
              <span>
                {t.wholesalePrice} ({product.wholesaleMinQty}+)
              </span>
            </div>
            <div dir="ltr" className="text-sm sm:text-base font-extrabold tabular-nums">
              {formatPrice(product.wholesalePrice, lang)}
              <span className="text-[11px] font-normal opacity-80">
                {" "}
                / {lang === "ar" ? "قطعة" : "unit"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add Retail (+1) & Add Wholesale Pack */}
        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => triggerAdd(1)}
            style={{
              backgroundColor: justAdded
                ? "#059669"
                : theme.colors.accentPrimary,
              color: "#FFFFFF",
            }}
            className="col-span-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-40"
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>{lang === "ar" ? "تمت الإضافة!" : "Added!"}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {t.addToCart}
                  {cartQty > 0 ? ` (${cartQty})` : ""}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => triggerAdd(product.wholesaleMinQty)}
            style={{
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.bgElevated,
              color: theme.colors.textPrimary,
            }}
            title={`${t.addWholesaleMin} (+${product.wholesaleMinQty})`}
            className="col-span-2 flex items-center justify-center gap-1 rounded-xl border py-2.5 px-2 text-xs font-semibold transition hover:opacity-80 active:scale-[0.98] disabled:opacity-40"
          >
            <Layers
              style={{ color: theme.colors.accentPrimary }}
              className="h-3.5 w-3.5 shrink-0"
            />
            <span className="truncate">+{product.wholesaleMinQty} {lang === "ar" ? "جملة" : "Bulk"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
