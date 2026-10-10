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
  layout?: "card" | "list";
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
      className={`product-card-mytek group relative flex ${
        isListLayout ? "flex-col sm:flex-row sm:items-stretch" : "flex-col"
      } rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm`}
    >
      {/* Image Gallery Container */}
      <div
        className={`relative w-full overflow-hidden bg-gray-50 ${
          isListLayout
            ? "aspect-[16/9] sm:aspect-square sm:h-48 sm:w-48 sm:shrink-0 sm:self-center sm:ms-3 sm:rounded-lg"
            : "aspect-[16/9]"
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
              className="relative h-full w-full flex-shrink-0 snap-center overflow-hidden"
            >
              <ProductImage
                product={product}
                src={imgUrl}
                alt={`${title} - ${idx + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Top Badges - Mytek style */}
        <div className="pointer-events-none absolute top-2 inset-x-2 flex items-start justify-between gap-1.5">
          <div className="flex flex-wrap gap-1">
            {discountPct > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm" style={{backgroundColor: '#E31837'}}>
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#1A1A2E] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                <Sparkles className="h-2.5 w-2.5" />
                {lang === "ar" ? "مميز" : "TOP"}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {activeImageIdx + 1}/{images.length}
            </span>
          )}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToImage(activeImageIdx - 1);
              }}
              aria-label="Previous image"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white active:scale-95 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToImage(activeImageIdx + 1);
              }}
              aria-label="Next image"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white active:scale-95 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Quick View Button - Mytek style */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition hover:bg-white opacity-0 group-hover:opacity-100"
        >
          <Eye className="h-3 w-3" />
          <span>{t.viewDetails}</span>
        </button>
      </div>

      {/* Card Body - Mytek style clean layout */}
      <div className="flex flex-1 flex-col p-3">
        {/* Category Label */}
        <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 mb-0.5 truncate">
          {categoryName}
        </span>

        {/* Product Title */}
        <h3
          onClick={() => onQuickView(product)}
          className="cursor-pointer text-[12px] sm:text-sm font-bold leading-snug line-clamp-2 mb-1 text-gray-900 hover:text-red-700 transition-colors"
        >
          {title}
        </h3>

        {/* Description (collapsible) */}
        <div className="mb-2 flex-1">
          <p className={`text-[10px] sm:text-[11px] leading-relaxed text-gray-500 ${detailsExpanded ? "" : "line-clamp-1"}`}>
            {description}
          </p>
          {detailsExpanded && specs && (
            <p className="mt-1.5 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600">
              {specs}
            </p>
          )}
          <button
            type="button"
            aria-expanded={detailsExpanded}
            onClick={() => setDetailsExpanded((expanded) => !expanded)}
            className="mt-1 text-[10px] font-bold text-red-600 hover:text-red-700 transition"
          >
            {detailsExpanded ? t.hideDetails : t.readDetails}
          </button>
        </div>

        {/* Price Section - Mytek prominent style */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <span dir="ltr" className="text-sm sm:text-base font-extrabold text-gray-900">
              {formatPrice(product.price, lang)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span dir="ltr" className="text-[10px] sm:text-xs line-through text-gray-400">
                {formatPrice(product.originalPrice, lang)}
              </span>
            )}
          </div>
          {/* Stock indicator */}
          <div className="mt-0.5">
            {product.stock > 15 ? (
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-semibold">
                <PackageCheck className="h-3 w-3" />
                {t.inStock}
              </span>
            ) : product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-amber-600 font-semibold">
                <AlertTriangle className="h-3 w-3" />
                {t.lowStock} ({product.stock})
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-red-600 font-semibold">
                {t.outOfStock}
              </span>
            )}
          </div>
          <WholesalePriceDisclosure product={product} lang={lang} theme={theme} compact />
        </div>

        {/* Action Buttons - Mytek style */}
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => triggerAdd(1)}
            className="flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 px-2 text-[10px] sm:text-[11px] font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-40"
            style={{
              backgroundColor: justAdded ? "#059669" : "#E31837",
            }}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "تمت!" : "Added!"}</span>
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

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => triggerAdd(product.wholesaleMinQty)}
            title={`${t.addWholesaleMin} (+${product.wholesaleMinQty})`}
            className="flex items-center justify-center gap-1 rounded-md border border-gray-200 py-1.5 px-2 text-[10px] font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40"
          >
            <Layers className="h-3 w-3 shrink-0 text-red-500" />
            <span className="truncate">+{product.wholesaleMinQty}</span>
          </button>
        </div>
      </div>
    </div>
  );
}