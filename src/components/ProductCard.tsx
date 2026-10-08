"use client";

import React, { useRef, useState } from "react";
import type { Product, Category } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { WholesalePriceDisclosure } from "@/components/WholesalePriceDisclosure";
import {
  ShoppingBag,
  Layers,
  ChevronLeft,
  ChevronRight,
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
  layout?: "card" | "list" | "compact";
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
  layout = "card",
}: ProductCardProps) {
  const t = UI_TEXT[lang];
  const isListLayout = layout === "list";
  const isCompact = layout === "compact";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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
      className={`group relative flex h-full overflow-hidden border bg-white transition-shadow duration-200 hover:shadow-md ${
        isListLayout ? "flex-col sm:flex-row sm:items-stretch" : "flex-col"
      }`}
    >
      <div
        className={`relative w-full overflow-hidden bg-white ${
          isListLayout
            ? "aspect-square sm:h-44 sm:w-44 sm:shrink-0 sm:self-center"
            : isCompact
              ? "aspect-square"
              : "aspect-square"
        }`}
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {images.map((imgUrl, idx) => (
            <div
              key={`${product.id}-img-${idx}`}
              className="relative h-full w-full flex-shrink-0 snap-center overflow-hidden bg-white"
            >
              <ProductImage
                product={product}
                src={imgUrl}
                alt={`${title} - ${idx + 1}`}
                loading="lazy"
                className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute top-2 inset-x-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {discountPct > 0 && (
              <span
                style={{
                  backgroundColor: theme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-extrabold shadow-sm"
              >
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && !isCompact && (
              <span className="inline-flex items-center rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {lang === "ar" ? "الأكثر مبيعاً" : "Top"}
              </span>
            )}
          </div>
        </div>

        {images.length > 1 && !isCompact && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToImage(activeImageIdx - 1);
              }}
              aria-label="Previous image"
              className="absolute left-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow opacity-0 transition group-hover:opacity-100"
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
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow opacity-0 transition group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute bottom-2 end-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-800 shadow opacity-0 transition group-hover:opacity-100"
          aria-label={t.viewDetails}
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <div className={`flex flex-1 flex-col ${isCompact ? "p-2.5" : "p-3"}`}>
        <span
          style={{ color: theme.colors.textSecondary }}
          className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wide"
        >
          {categoryName}
        </span>

        <h3
          onClick={() => onQuickView(product)}
          className={`cursor-pointer font-semibold leading-snug hover:underline ${
            isCompact ? "mb-1 line-clamp-2 min-h-[2.4em] text-[13px]" : "mb-1.5 line-clamp-2 text-sm"
          }`}
        >
          {title}
        </h3>

        {!isCompact && (
          <div className="mb-2 flex-1">
            <p
              style={{ color: theme.colors.textSecondary }}
              className={`text-xs leading-relaxed ${detailsExpanded ? "" : "line-clamp-1"}`}
            >
              {description}
            </p>
            {detailsExpanded && specs && (
              <p
                style={{
                  backgroundColor: theme.colors.bgSecondary,
                  color: theme.colors.textSecondary,
                }}
                className="mt-2 rounded px-2 py-1 text-[11px] font-medium"
              >
                {specs}
              </p>
            )}
            <button
              type="button"
              aria-expanded={detailsExpanded}
              onClick={() => setDetailsExpanded((expanded) => !expanded)}
              style={{ color: theme.colors.accentPrimary }}
              className="mt-1 text-[11px] font-bold hover:underline"
            >
              {detailsExpanded ? t.hideDetails : t.readDetails}
            </button>
          </div>
        )}

        <div className="mt-auto">
          <div className="mb-1.5 flex items-baseline gap-1.5">
            <span
              dir="ltr"
              className={`font-extrabold tabular-nums ${isCompact ? "text-sm" : "text-base"}`}
              style={{ color: theme.colors.accentPrimary }}
            >
              {formatPrice(product.price, lang)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span
                style={{ color: theme.colors.textSecondary }}
                dir="ltr"
                className="text-[11px] line-through opacity-75 tabular-nums"
              >
                {formatPrice(product.originalPrice, lang)}
              </span>
            )}
          </div>

          {!isCompact && (
            <div className="mb-2 text-[11px]">
              {product.stock > 15 ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <PackageCheck className="h-3.5 w-3.5" />
                  {t.inStock}
                </span>
              ) : product.stock > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t.lowStock}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                  {t.outOfStock}
                </span>
              )}
            </div>
          )}

          {!isCompact && (
            <div className="mb-2">
              <WholesalePriceDisclosure product={product} lang={lang} theme={theme} compact />
            </div>
          )}

          {isCompact ? (
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => triggerAdd(1)}
              style={{
                backgroundColor: justAdded ? "#059669" : theme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-sm py-1.5 text-[11px] font-bold transition hover:opacity-95 disabled:opacity-40"
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{lang === "ar" ? "تمت" : "Added"}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {t.addToCart}
                    {cartQty > 0 ? ` (${cartQty})` : ""}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => triggerAdd(1)}
                style={{
                  backgroundColor: justAdded ? "#059669" : theme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="col-span-3 flex items-center justify-center gap-1.5 rounded-sm py-2 px-2 text-xs font-bold transition hover:opacity-95 disabled:opacity-40"
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
                className="col-span-2 flex items-center justify-center gap-1 rounded-sm border py-2 px-2 text-xs font-semibold transition hover:opacity-80 disabled:opacity-40"
              >
                <Layers
                  style={{ color: theme.colors.accentPrimary }}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span className="truncate">
                  +{product.wholesaleMinQty} {lang === "ar" ? "جملة" : "Bulk"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
