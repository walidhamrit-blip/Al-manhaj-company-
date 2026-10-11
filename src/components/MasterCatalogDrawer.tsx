"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import {
  getProductParentSlug,
  getProductSubcategorySlug,
} from "@/lib/category-hierarchy";
import { ProductTile } from "@/components/ProductTile";
import { ChevronLeft, ChevronRight, LayoutGrid, Package, Search, X } from "lucide-react";

/**
 * Product belongs to `categorySlug` — either directly (department) or through
 * one of its sub-categories.
 */
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

type CatalogNode = {
  slug: string;
  name: string;
  items: Product[];
  subcategories: Category[];
};

/**
 * Hierarchical catalog: department rail → sub-categories → products of the
 * selected node. The previous version listed every department AND every
 * sub-category as a single wall of buttons and then poured the whole catalog
 * into one endless scroll; the tree now stays legible and only the selected
 * branch is rendered.
 */
export function MasterCatalogDrawer({
  isOpen,
  onClose,
  categories,
  products,
  lang,
  theme,
  searchQuery,
  onSearchQueryChange,
  activeDeptSlug,
  onActiveDeptSlugChange,
  onAddToCart,
  onQuickView,
}: MasterCatalogDrawerProps) {
  const t = UI_TEXT[lang];
  const isRtl = lang === "ar";
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const categoriesBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories]
  );

  const visibleProducts = useMemo(
    () => products.filter((product) => !product.isHidden),
    [products]
  );

  const name = useCallback(
    (category: Category) => (lang === "ar" ? category.nameAr : category.nameEn),
    [lang]
  );

  /** Only the departments (top level) — sub-categories are shown one level down. */
  const departments = useMemo(
    () =>
      [...categories]
        .filter((category) => !category.parentSlug)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const subcategoriesOf = useCallback(
    (parentSlug: string) =>
      [...categories]
        .filter((category) => category.parentSlug === parentSlug)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const itemsOf = useCallback(
    (slug: string) =>
      slug === "all"
        ? visibleProducts
        : visibleProducts.filter((product) =>
            productMatchesCategory(product, slug, categoriesBySlug)
          ),
    [visibleProducts, categoriesBySlug]
  );

  const query = searchQuery.trim().toLowerCase();
  const matchesQuery = useCallback(
    (product: Product) =>
      !query ||
      product.titleEn.toLowerCase().includes(query) ||
      product.titleAr.toLowerCase().includes(query) ||
      product.descriptionEn.toLowerCase().includes(query) ||
      product.descriptionAr.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query),
    [query]
  );

  // Which node is selected, and its parent (a sub-category is always shown as
  // a child of its department).
  const activeCategory =
    activeDeptSlug === "all" ? null : categoriesBySlug.get(activeDeptSlug) ?? null;
  const activeParent = activeCategory
    ? activeCategory.parentSlug
      ? categoriesBySlug.get(activeCategory.parentSlug) ?? null
      : activeCategory
    : null;

  const nodes = useMemo<CatalogNode[]>(
    () =>
      departments.map((department) => ({
        slug: department.slug,
        name: name(department),
        items: itemsOf(department.slug),
        subcategories: subcategoriesOf(department.slug),
      })),
    [departments, itemsOf, name, subcategoriesOf]
  );

  const activeNode = nodes.find((node) => node.slug === activeParent?.slug) ?? null;

  const shownItems = useMemo(
    () => itemsOf(activeDeptSlug).filter(matchesQuery),
    [itemsOf, activeDeptSlug, matchesQuery]
  );

  const allCount = visibleProducts.length;
  const activeCount = itemsOf(activeDeptSlug).length;

  if (!isOpen) return null;

  const handleQuickAdd = (product: Product, qty: number) => {
    onAddToCart(product, qty);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 900);
  };

  const parentChipClass = (selected: boolean) =>
    `flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
      selected ? "text-white" : "hover:border-current/40"
    }`;

  const parentChipStyle = (selected: boolean) =>
    selected
      ? {
          backgroundColor: theme.colors.accentPrimary,
          borderColor: theme.colors.accentPrimary,
          color: "#FFFFFF",
        }
      : {
          backgroundColor: theme.colors.bgSecondary,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        };

  const renderDepartmentsRail = () => (
    <nav
      aria-label={t.navDepartments}
      className="hidden w-64 shrink-0 flex-col overflow-y-auto border-e custom-scrollbar lg:flex"
      style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated }}
    >
      <span
        className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest"
        style={{ color: theme.colors.textSecondary }}
      >
        {t.navDepartments}
      </span>

      <button
        type="button"
        onClick={() => onActiveDeptSlugChange("all")}
        aria-current={activeDeptSlug === "all"}
        className="flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-extrabold transition"
        style={{
          backgroundColor:
            activeDeptSlug === "all" ? theme.colors.accentPrimary : "transparent",
          color: activeDeptSlug === "all" ? "#FFFFFF" : theme.colors.textPrimary,
        }}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{t.catalogAllProductsShort}</span>
        <span className="shrink-0 text-[10px] tabular-nums opacity-70">{allCount}</span>
      </button>

      {nodes.map((node) => {
        const selected = activeParent?.slug === node.slug;
        return (
          <button
            key={node.slug}
            type="button"
            onClick={() => onActiveDeptSlugChange(node.slug)}
            aria-current={selected}
            className="flex items-center gap-2.5 px-4 py-2.5 text-start text-xs font-semibold transition hover:opacity-80"
            style={{
              backgroundColor: selected ? theme.colors.bgSecondary : "transparent",
              color: selected ? theme.colors.accentPrimary : theme.colors.textPrimary,
            }}
          >
            <span className="min-w-0 flex-1 truncate">{name(
              categoriesBySlug.get(node.slug) as Category
            )}</span>
            <span className="shrink-0 text-[10px] tabular-nums opacity-60">
              {node.items.length}
            </span>
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 opacity-60 ${isRtl ? "rotate-180" : ""}`}
            />
          </button>
        );
      })}
    </nav>
  );

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
        className="relative z-10 flex h-full w-full max-w-5xl flex-col border-e shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
          }}
          className="border-b px-4 py-3.5 sm:px-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold tracking-tight sm:text-lg">
                {t.masterCatalog}
              </h2>
              <p className="truncate text-xs" style={{ color: theme.colors.textSecondary }}>
                {allCount} {t.itemsLabel} · {departments.length}{" "}
                {lang === "ar" ? "أقسام" : "departments"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:opacity-80"
              aria-label={t.closeBtn}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-3">
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

          {/* Departments — horizontal rail on phones/tablets, vertical rail on desktop */}
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar lg:hidden">
            <button
              type="button"
              onClick={() => onActiveDeptSlugChange("all")}
              aria-pressed={activeDeptSlug === "all"}
              className={parentChipClass(activeDeptSlug === "all")}
              style={parentChipStyle(activeDeptSlug === "all")}
            >
              {t.catalogAllProductsShort}
              <span className="text-[10px] tabular-nums opacity-70">{allCount}</span>
            </button>
            {nodes.map((node) => (
              <button
                key={node.slug}
                type="button"
                onClick={() => onActiveDeptSlugChange(node.slug)}
                aria-pressed={activeParent?.slug === node.slug}
                className={parentChipClass(activeParent?.slug === node.slug)}
                style={parentChipStyle(activeParent?.slug === node.slug)}
              >
                {node.name}
                <span className="text-[10px] tabular-nums opacity-70">
                  {node.items.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {renderDepartmentsRail()}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Breadcrumb: All products › Department › Sub-category */}
            <div
              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-b px-4 py-3 text-xs sm:px-5"
              style={{ borderColor: theme.colors.border }}
            >
              <button
                type="button"
                onClick={() => onActiveDeptSlugChange("all")}
                className="font-semibold transition hover:underline"
                style={{
                  color:
                    activeCategory === null
                      ? theme.colors.textPrimary
                      : theme.colors.textSecondary,
                }}
              >
                {t.catalogAllProductsShort}
              </button>
              {!activeCategory && (
                <span className="tabular-nums opacity-60">({shownItems.length})</span>
              )}

              {activeParent && (
                <>
                  <ChevronLeft
                    className={`h-3.5 w-3.5 shrink-0 opacity-50 ${isRtl ? "rotate-180" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => onActiveDeptSlugChange(activeParent.slug)}
                    className="font-bold transition hover:underline"
                    style={{
                      color: activeCategory?.parentSlug
                        ? theme.colors.textSecondary
                        : theme.colors.accentPrimary,
                    }}
                  >
                    {name(activeParent)}
                  </button>
                </>
              )}

              {activeCategory?.parentSlug && (
                <>
                  <ChevronLeft
                    className={`h-3.5 w-3.5 shrink-0 opacity-50 ${isRtl ? "rotate-180" : ""}`}
                  />
                  <span className="font-extrabold" style={{ color: theme.colors.accentPrimary }}>
                    {name(activeCategory)}
                  </span>
                  <span className="tabular-nums opacity-60">({shownItems.length})</span>
                </>
              )}
            </div>

            {/* Sub-categories of the selected department: names only, no products. */}
            {activeNode && activeNode.subcategories.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-5"
                style={{ borderColor: theme.colors.border }}
              >
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t.catalogSubcategories}
                </span>
                {activeNode.subcategories.map((sub) => {
                  const selected = activeDeptSlug === sub.slug;
                  const count = itemsOf(sub.slug).length;
                  return (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() =>
                        onActiveDeptSlugChange(selected ? sub.parentSlug ?? "all" : sub.slug)
                      }
                      aria-pressed={selected}
                      style={parentChipStyle(selected)}
                      className={`min-h-8 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                        selected ? "" : "hover:border-current/40"
                      }`}
                    >
                      {name(sub)}
                      <span className="ms-1.5 text-[10px] tabular-nums opacity-70">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Products of the selected branch */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
              {shownItems.length === 0 ? (
                <div className="py-16 text-center">
                  <Package
                    style={{ color: theme.colors.textSecondary }}
                    className="mx-auto mb-3 h-12 w-12 opacity-50"
                  />
                  <p className="text-base font-semibold">
                    {lang === "ar"
                      ? "لا توجد منتجات مطابقة في هذا القسم"
                      : "No products match here."}
                  </p>
                  {query && activeDeptSlug !== "all" && (
                    <button
                      type="button"
                      onClick={() => onActiveDeptSlugChange("all")}
                      className="mt-3 rounded-lg px-3 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
                      style={{ backgroundColor: theme.colors.accentPrimary }}
                    >
                      {t.catalogSearchAll}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {shownItems.map((item) => (
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
              )}
              {activeCount > shownItems.length && shownItems.length > 0 && (
                <p
                  className="mt-4 text-center text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {shownItems.length} / {activeCount} {t.itemsLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
