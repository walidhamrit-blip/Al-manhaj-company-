"use client";

import React, { useState, useMemo } from "react";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { ProductImage } from "@/components/ProductImage";
import { CategoryImage } from "@/components/CategoryImage";
import {
  getProductParentSlug,
  getProductSubcategorySlug,
} from "@/lib/category-hierarchy";
import { ProductTile } from "@/components/ProductTile";
import {
  X,
  Search,
  BookOpen,
  Layers,
  ShoppingBag,
  Package,
  CheckCircle2,
} from "lucide-react";

function productMatchesCategory(
  product: Product,
  categorySlug: string,
  categoriesBySlug: ReadonlyMap<string, Category>
): boolean {
  const category = categoriesBySlug.get(categorySlug);
  return category?.parentSlug
    ? getProductSubcategorySlug(product, categoriesBySlug) === categorySlug
    : getProductParentSlug(product, categoriesBySlug) === categorySlug;
}

interface MasterCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
  // Controlled from the page: the header search bar and the category tiles
  // drive the same search / department state as the drawer itself.
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeDeptSlug: string;
  onActiveDeptSlugChange: (slug: string) => void;
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
  searchQuery,
  onSearchQueryChange,
  activeDeptSlug,
  onActiveDeptSlugChange,
  onAddToCart,
  onQuickView,
}: MasterCatalogDrawerProps) {
  const t = UI_TEXT[lang];
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const categoriesBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories]
  );

  const groupedCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories
      .filter((category) => !category.parentSlug)
      .map((cat) => {
        const items = products.filter((product) => {
          if (product.isHidden) return false;
          if (getProductParentSlug(product, categoriesBySlug) !== cat.slug) return false;
          if (activeDeptSlug !== "all" && !productMatchesCategory(product, activeDeptSlug, categoriesBySlug)) {
            return false;
          }
          if (!q) return true;
          return (
            product.titleEn.toLowerCase().includes(q) ||
            product.titleAr.toLowerCase().includes(q) ||
            product.descriptionEn.toLowerCase().includes(q) ||
            product.descriptionAr.toLowerCase().includes(q) ||
            product.sku.toLowerCase().includes(q)
          );
        });
        return { category: cat, items };
      })
      .filter((group) => group.items.length > 0);
  }, [categories, categoriesBySlug, products, searchQuery, activeDeptSlug]);

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
                onChange={(e) => onSearchQueryChange(e.target.value)}
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

          {/* Keep all departments visible rather than hiding them in a horizontal scroller. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => onActiveDeptSlugChange("all")}
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
              <span className="shrink-0 tabular-nums opacity-75">
                ({products.filter((product) => !product.isHidden).length})
              </span>
            </button>
            {categories.map((cat) => {
              const countInCat = products.filter(
                (product) =>
                  !product.isHidden &&
                  productMatchesCategory(product, cat.slug, categoriesBySlug)
              ).length;
              const isSelected = activeDeptSlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => onActiveDeptSlugChange(cat.slug)}
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
                key={category.slug}
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
                </div>

                {/* Square product tiles */}
                <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4 xl:grid-cols-4">
                  {items.map((item) => (
                    <ProductTile
                      key={item.sku}
                      product={item}
                      lang={lang}
                      theme={theme}
                      added={addedProductId === item.id}
                      onOpen={onQuickView}
                      onQuickAdd={(prod) => handleQuickAdd(prod, 1)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
