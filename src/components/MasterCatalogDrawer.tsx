"use client";

import React, { useState, useMemo } from "react";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { CategoryImage } from "@/components/CategoryImage";
import { WholesalePriceDisclosure } from "@/components/WholesalePriceDisclosure";
import {
  X,
  Search,
  BookOpen,
  Layers,
  ShoppingBag,
  ArrowUpRight,
  Package,
  CheckCircle2,
} from "lucide-react";

interface MasterCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
  onSelectCategory: (slug: string) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView: (product: Product) => void;
}

export function MasterCatalogDrawer({
  isOpen,
  onClose,
  categories,
  products,
  lang,
  theme,
  currencySymbol,
  onSelectCategory,
  onAddToCart,
  onQuickView,
}: MasterCatalogDrawerProps) {
  const t = UI_TEXT[lang];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDeptSlug, setActiveDeptSlug] = useState<string>("all");
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const groupedCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories
      .map((cat) => {
        const items = products.filter((p) => {
          if (p.categorySlug !== cat.slug) return false;
          if (activeDeptSlug !== "all" && cat.slug !== activeDeptSlug) return false;
          if (!q) return true;
          return (
            p.titleEn.toLowerCase().includes(q) ||
            p.titleAr.toLowerCase().includes(q) ||
            p.descriptionEn.toLowerCase().includes(q) ||
            p.descriptionAr.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
          );
        });
        return { category: cat, items };
      })
      .filter((group) => group.items.length > 0);
  }, [categories, products, searchQuery, activeDeptSlug]);

  if (!isOpen) return null;

  const handleQuickAdd = (product: Product, qty: number) => {
    onAddToCart(product, qty);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          borderColor: theme.colors.border,
        }}
        className="relative z-10 flex h-full w-full max-w-4xl flex-col border-e shadow-2xl overflow-hidden"
      >
        {/* Header - Mytek dark style */}
        <div
          className="flex flex-col gap-4 p-4 sm:p-6"
          style={{backgroundColor: '#1A1A2E', borderBottom: '3px solid #E31837'}}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md shadow-sm"
                style={{backgroundColor: '#E31837', color: '#FFFFFF'}}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  {t.masterCatalog} ({products.length}{" "}
                  {lang === "ar" ? "منتج" : "SKUs"})
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-400">
                  {t.catalogSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
              aria-label={t.closeBtn}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-md border border-white/20 bg-white/10 py-2.5 ps-10 pe-4 text-sm text-white placeholder-gray-400 outline-none focus:border-red-500 focus:bg-white focus:text-gray-900 transition"
              />
            </div>
          </div>

          {/* Keep all departments visible rather than hiding them in a horizontal scroller. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveDeptSlug("all")}
              aria-pressed={activeDeptSlug === "all"}
              style={
                activeDeptSlug === "all"
                  ? {
                      backgroundColor: theme.colors.accentPrimary,
                      borderColor: theme.colors.accentPrimary,
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: theme.colors.bgSecondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    }
              }
              className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start text-xs font-bold transition hover:opacity-85"
            >
              <span className="min-w-0 flex-1 line-clamp-2">{t.allCategories}</span>
              <span className="shrink-0 tabular-nums opacity-75">({products.length})</span>
            </button>
            {categories.map((cat) => {
              const countInCat = products.filter(
                (product) => product.categorySlug === cat.slug
              ).length;
              const isSelected = activeDeptSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveDeptSlug(cat.slug)}
                  aria-pressed={isSelected}
                  style={
                    isSelected
                      ? {
                          backgroundColor: theme.colors.accentPrimary,
                          borderColor: theme.colors.accentPrimary,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: theme.colors.bgSecondary,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        }
                  }
                  className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-start text-xs font-semibold transition hover:opacity-85"
                >
                  <span className="min-w-0 flex-1 line-clamp-2">
                    {lang === "ar" ? cat.nameAr : cat.nameEn}
                  </span>
                  <span className="shrink-0 tabular-nums opacity-75">({countInCat})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Complete Directory Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-8">
          {groupedCatalog.length === 0 ? (
            <div className="py-16 text-center">
              <Package
                style={{ color: theme.colors.textSecondary }}
                className="mx-auto mb-3 h-12 w-12 opacity-50"
              />
              <p className="text-base font-semibold">
                {lang === "ar"
                  ? "لا توجد منتجات مطابقة لبحثك في الكتالوج"
                  : "No catalog items match your search."}
              </p>
            </div>
          ) : (
            groupedCatalog.map(({ category, items }) => (
              <div
                key={category.id}
                style={{
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.colors.border,
                }}
                className="rounded-2xl border overflow-hidden shadow-sm"
              >
                {/* Category Banner Header inside Catalog */}
                <div
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                  }}
                  className="flex flex-wrap items-center justify-between gap-4 border-b p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <CategoryImage
                      slug={category.slug}
                      src={category.imageUrl}
                      alt={lang === "ar" ? category.nameAr : category.nameEn}
                      className="h-14 w-14 rounded-xl bg-white object-contain shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-extrabold">
                          {lang === "ar" ? category.nameAr : category.nameEn}
                        </h3>
                        <span
                          style={{
                            backgroundColor: theme.colors.badgeBg,
                            color: theme.colors.badgeText,
                          }}
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        >
                          {items.length} {t.itemsLabel}
                        </span>
                      </div>
                      <p
                        style={{ color: theme.colors.textSecondary }}
                        className="text-xs sm:text-sm line-clamp-1"
                      >
                        {lang === "ar"
                          ? category.descriptionAr
                          : category.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(category.slug);
                      onClose();
                    }}
                    style={{
                      color: theme.colors.accentPrimary,
                    }}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold hover:underline"
                  >
                    <span>
                      {lang === "ar"
                        ? "عرض القسم في المتجر"
                        : "Filter Store by Department"}
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Detailed Item Rows */}
                <div
                  style={{ borderColor: theme.colors.border }}
                  className="divide-y"
                >
                  {items.map((item) => {
                    const img1 =
                      Array.isArray(item.images) && item.images[0]
                        ? item.images[0]
                        : "/images/hero-stationery.jpg";
                    const img2 =
                      Array.isArray(item.images) && item.images[1]
                        ? item.images[1]
                        : null;

                    return (
                      <div
                        key={item.id}
                        style={{ borderColor: theme.colors.border }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition hover:bg-black/[0.02]"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Dual Mini Thumbnails */}
                          <div
                            onClick={() => onQuickView(item)}
                            className="cursor-pointer flex gap-1.5 shrink-0"
                          >
                            <ProductImage
                              product={item}
                              src={img1}
                              alt={item.titleEn}
                              className="h-16 w-16 rounded-xl object-cover border border-black/10"
                            />
                            {img2 && (
                              <ProductImage
                                product={item}
                                src={img2}
                                alt={item.titleEn}
                                className="hidden md:block h-16 w-16 rounded-xl object-cover border border-black/10 opacity-90"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                style={{
                                  backgroundColor: theme.colors.bgSecondary,
                                  color: theme.colors.textSecondary,
                                }}
                                className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                              >
                                {item.sku}
                              </span>
                              <span className="text-[11px] font-semibold text-emerald-600">
                                • {t.inStock}: {item.stock}
                              </span>
                            </div>

                            <h4
                              onClick={() => onQuickView(item)}
                              className="cursor-pointer text-sm sm:text-base font-bold truncate hover:underline"
                            >
                              {lang === "ar" ? item.titleAr : item.titleEn}
                            </h4>

                            <p
                              style={{ color: theme.colors.textSecondary }}
                              className={`text-xs mt-0.5 ${expandedProductId === item.id ? "" : "line-clamp-1"}`}
                            >
                              {lang === "ar"
                                ? item.descriptionAr
                                : item.descriptionEn}
                            </p>

                            {expandedProductId === item.id && (item.specsEn || item.specsAr) && (
                              <p
                                style={{ color: theme.colors.accentPrimary }}
                                className="text-[11px] font-medium mt-1"
                              >
                                {lang === "ar" ? item.specsAr : item.specsEn}
                              </p>
                            )}
                            <button
                              type="button"
                              aria-expanded={expandedProductId === item.id}
                              onClick={() =>
                                setExpandedProductId((current) =>
                                  current === item.id ? null : item.id
                                )
                              }
                              style={{ color: theme.colors.accentPrimary }}
                              className="mt-1 text-[11px] font-bold underline underline-offset-2"
                            >
                              {expandedProductId === item.id ? t.hideDetails : t.readDetails}
                            </button>
                          </div>
                        </div>

                        {/* Pricing & Direct Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-gray-200">
                          <div className="w-full max-w-[210px] text-start sm:text-end">
                            <span
                              style={{ color: theme.colors.textSecondary }}
                              className="text-[10px] font-semibold"
                            >
                              {t.retailPrice}
                            </span>
                            <div dir="ltr" className="text-sm sm:text-base font-extrabold tabular-nums">
                              {formatPrice(item.price, lang)}
                            </div>
                            <div className="mt-1 sm:ms-auto sm:max-w-[210px]">
                              <WholesalePriceDisclosure
                                product={item}
                                lang={lang}
                                theme={theme}
                                compact
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item, 1)}
                              style={{
                                backgroundColor:
                                  addedProductId === item.id
                                    ? "#059669"
                                    : theme.colors.accentPrimary,
                                color: "#FFFFFF",
                              }}
                              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition hover:opacity-90"
                            >
                              {addedProductId === item.id ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <ShoppingBag className="h-3.5 w-3.5" />
                              )}
                              <span>+1</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleQuickAdd(item, item.wholesaleMinQty)
                              }
                              style={{
                                backgroundColor: theme.colors.bgSecondary,
                                color: theme.colors.textPrimary,
                                borderColor: theme.colors.border,
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold transition hover:opacity-80"
                              title={t.addWholesaleMin}
                            >
                              <Layers className="h-3.5 w-3.5" />
                              <span>+{item.wholesaleMinQty}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
