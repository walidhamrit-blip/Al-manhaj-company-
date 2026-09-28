"use client";

import React, { useState, useMemo } from "react";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
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
        {/* Header */}
        <div
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
          }}
          className="flex flex-col gap-4 border-b p-4 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: theme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md"
              >
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {t.masterCatalog} ({products.length}{" "}
                  {lang === "ar" ? "منتج" : "SKUs"})
                </h2>
                <p
                  style={{ color: theme.colors.textSecondary }}
                  className="text-xs sm:text-sm"
                >
                  {t.catalogSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:opacity-80"
              aria-label={t.closeBtn}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Department Jump Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                style={{ color: theme.colors.textSecondary }}
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3.5 h-4 w-4"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  backgroundColor: theme.colors.bgSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
                className="w-full rounded-xl border py-2.5 ps-10 pe-4 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setActiveDeptSlug("all")}
              style={
                activeDeptSlug === "all"
                  ? {
                      backgroundColor: theme.colors.accentPrimary,
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: theme.colors.bgSecondary,
                      color: theme.colors.textPrimary,
                    }
              }
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
            >
              {t.allCategories} ({products.length})
            </button>
            {categories.map((cat) => {
              const countInCat = products.filter(
                (p) => p.categorySlug === cat.slug
              ).length;
              const isSelected = activeDeptSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveDeptSlug(cat.slug)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: theme.colors.accentPrimary,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: theme.colors.bgSecondary,
                          color: theme.colors.textPrimary,
                        }
                  }
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                >
                  {lang === "ar" ? cat.nameAr : cat.nameEn} ({countInCat})
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
                    <img
                      src={category.imageUrl}
                      alt={lang === "ar" ? category.nameAr : category.nameEn}
                      className="h-14 w-14 rounded-xl object-cover shadow-sm"
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
                            <img
                              src={img1}
                              alt={item.titleEn}
                              className="h-16 w-16 rounded-xl object-cover border border-black/10"
                            />
                            {img2 && (
                              <img
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
                              className="text-xs line-clamp-1 mt-0.5"
                            >
                              {lang === "ar"
                                ? item.descriptionAr
                                : item.descriptionEn}
                            </p>

                            {(item.specsEn || item.specsAr) && (
                              <p
                                style={{ color: theme.colors.accentPrimary }}
                                className="text-[11px] font-medium mt-1"
                              >
                                {lang === "ar" ? item.specsAr : item.specsEn}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Pricing & Direct Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-gray-200">
                          <div className="text-start sm:text-end">
                            <div dir="ltr" className="text-sm sm:text-base font-extrabold tabular-nums">
                              {formatPrice(item.price, lang)}
                            </div>
                            <div
                              style={{ color: theme.colors.accentPrimary }}
                              dir="ltr"
                              className="text-[11px] font-bold tabular-nums"
                            >
                              {t.wholesalePrice}: {formatPrice(item.wholesalePrice, lang)} (
                              {item.wholesaleMinQty}+)
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
