"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Category, Product } from "@/db/schema";
import {
  UI_TEXT,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { CategoryImage } from "@/components/CategoryImage";
import {
  getProductParentSlug,
  getProductSubcategorySlug,
} from "@/lib/category-hierarchy";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Menu,
  X,
} from "lucide-react";

/**
 * "All departments" mega menu, mounted in the navigation strip.
 *
 * Desktop (lg+): a click on the trigger drops a panel over the page — a column
 * listing the departments (first one selected on open), and, beside it, the
 * sub-categories of the selected department laid out in columns, like Mytek's
 * "TOUS NOS RAYONS". Nothing opens on hover: the department changes when it is
 * clicked.
 *
 * The panel only shows the tree (departments → sub-categories): no product
 * photos, prices or buttons, so the whole catalogue stays readable. Departments
 * that have no sub-categories list their product names as plain text links.
 * Products are browsed in the catalogue drawer (a click on any entry).
 *
 * Mobile / tablet: the same tree is rendered as an off-canvas drawer (portal on
 * <body>) with accordion departments.
 */

const MENU_ID = "departments-mega-menu";
const DESKTOP_QUERY = "(min-width: 1024px)";
/** Departments without sub-categories list a few product names, not the whole shelf. */
const PLAIN_PRODUCT_LIMIT = 12;

interface DepartmentGroup {
  category: Category;
  items: Product[];
  subcategories: { category: Category; items: Product[] }[];
}

interface CatalogVerticalMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  products: Product[];
  lang: Language;
  theme: ThemeConfig;
  /** Filters the catalogue drawer on a department or sub-category slug. */
  onSelectCategory: (slug: string) => void;
  /** Opens a product from a department that has no sub-categories. */
  onQuickView: (product: Product) => void;
}

function matches(query: string) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

export function CatalogVerticalMenu({
  isOpen,
  onOpenChange,
  categories,
  products,
  lang,
  theme,
  onSelectCategory,
  onQuickView,
}: CatalogVerticalMenuProps) {
  const t = UI_TEXT[lang];
  const isRtl = lang === "ar";

  const rootRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  // Desktop column department + mobile accordion department (null = "follow the
  // default", see `selectedSlug` below).
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const visibleProducts = useMemo(
    () => products.filter((product) => !product.isHidden),
    [products]
  );

  const categoriesBySlug = useMemo(
    () => new Map<string, Category>(categories.map((category) => [category.slug, category])),
    [categories]
  );

  const departments = useMemo(
    () =>
      [...categories]
        .filter((category) => !category.parentSlug)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const category of categories) {
      if (!category.parentSlug) continue;
      const list = map.get(category.parentSlug) || [];
      list.push(category);
      map.set(category.parentSlug, list);
    }
    for (const [, subs] of map) subs.sort((a, b) => a.sortOrder - b.sortOrder);
    return map;
  }, [categories]);

  const groups = useMemo<DepartmentGroup[]>(
    () =>
      departments.map((category) => {
        const subcategories = (subcategoriesByParent.get(category.slug) || []).map(
          (sub) => ({
            category: sub,
            items: visibleProducts.filter(
              (product) =>
                getProductSubcategorySlug(product, categoriesBySlug) === sub.slug
            ),
          })
        );
        const items = visibleProducts.filter(
          (product) =>
            getProductParentSlug(product, categoriesBySlug) === category.slug
        );
        return { category, items, subcategories };
      }),
    [departments, subcategoriesByParent, visibleProducts, categoriesBySlug]
  );

  // Until a department is clicked, the panel follows the first one: the side
  // column is therefore filled as soon as the menu opens (and even in the
  // server-rendered HTML), like Mytek's "Tous nos rayons".
  const defaultSlug = groups[0]?.category.slug ?? null;
  const selectedSlug = activeSlug ?? defaultSlug;

  const activeGroup =
    groups.find((group) => group.category.slug === selectedSlug) ?? null;

  // Every close path goes through here so hover/accordion state never leaks
  // into the next opening.
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) {
        setActiveSlug(null);
        setExpandedSlug(null);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  // Escape key + click outside (trigger, panel and mobile drawer excluded).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (mobilePanelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, setOpen]);

  // The mobile drawer covers the page: freeze the background scroll.
  useEffect(() => {
    if (!isOpen || matches(DESKTOP_QUERY)) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleSelectCategory = (slug: string) => {
    setOpen(false);
    onSelectCategory(slug);
  };

  const handleQuickView = (product: Product) => {
    setOpen(false);
    onQuickView(product);
  };

  const categoryName = (category: Category) =>
    lang === "ar" ? category.nameAr : category.nameEn;
  const productName = (product: Product) =>
    lang === "ar" ? product.titleAr : product.titleEn;
  const viewAllLabel = (count: number) =>
    t.catalogMenuViewAll.replace("{count}", String(count));

  const accentText = { color: theme.colors.accentPrimary };
  const borderStyle = { borderColor: theme.colors.border };

  /** Sub-categories of a department: names only, in columns. */
  const renderSubcategoryColumns = (group: DepartmentGroup) => (
    <ul className="mt-3 columns-2 gap-x-6 gap-y-0.5 xl:columns-3">
      {group.subcategories.map((sub) => (
        <li key={sub.category.slug} className="break-inside-avoid">
          <button
            type="button"
            onClick={() => handleSelectCategory(sub.category.slug)}
            className="group flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-start text-[11.5px] font-medium text-gray-600 transition hover:bg-neutral-50 hover:text-[color:var(--accent-primary)]"
          >
            <span className="min-w-0 truncate group-hover:underline">
              {categoryName(sub.category)}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
              {sub.items.length}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  /** No sub-categories: plain product names, no photos or prices. */
  const renderPlainProductColumns = (group: DepartmentGroup) => (
    <>
      <ul className="mt-3 columns-2 gap-x-6 gap-y-0.5 xl:columns-3">
        {group.items.slice(0, PLAIN_PRODUCT_LIMIT).map((product) => (
          <li key={product.sku} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => handleQuickView(product)}
              className="group flex w-full items-start gap-1.5 rounded px-1.5 py-1 text-start text-[11.5px] font-medium text-gray-600 transition hover:bg-neutral-50 hover:text-[color:var(--accent-primary)]"
            >
              <span className="min-w-0 flex-1 truncate group-hover:underline">
                {productName(product)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {group.items.length > PLAIN_PRODUCT_LIMIT && (
        <button
          type="button"
          onClick={() => handleSelectCategory(group.category.slug)}
          className="mt-2 text-[11px] font-bold underline underline-offset-2"
          style={accentText}
        >
          {t.catalogMenuMore.replace(
            "{count}",
            String(group.items.length - PLAIN_PRODUCT_LIMIT)
          )}
        </button>
      )}
    </>
  );

  const desktopDropdown = (
    <div
      id={MENU_ID}
      className="absolute start-0 top-full z-50 hidden items-stretch shadow-2xl lg:flex"
    >
      {/* Departments column */}
      <div
        className="flex w-72 shrink-0 flex-col border border-t-0"
        style={{ ...borderStyle, backgroundColor: theme.colors.bgElevated }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={borderStyle}
        >
          <Menu className="h-4 w-4" style={accentText} />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-900">
            {t.allDepartments}
          </span>
        </div>

        <ul
          role="menu"
          aria-label={t.allDepartments}
          className="custom-scrollbar max-h-[62vh] overflow-y-auto py-1"
        >
          <li>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelectCategory("all")}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-xs font-extrabold text-gray-900 transition hover:bg-neutral-50"
            >
              <LayoutGrid className="h-4 w-4 shrink-0" style={accentText} />
              <span className="min-w-0 flex-1 truncate">
                {t.catalogMenuAllProducts}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
                {visibleProducts.length}
              </span>
            </button>
          </li>

          {groups.map(({ category, items }) => {
            const isActive = selectedSlug === category.slug;
            const name = categoryName(category);
            return (
              <li key={category.slug}>
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={isActive}
                  onFocus={() => setActiveSlug(category.slug)}
                  onClick={() => setActiveSlug(category.slug)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-xs transition ${
                    isActive
                      ? "bg-neutral-50 font-extrabold"
                      : "font-semibold hover:bg-neutral-50"
                  }`}
                  style={{ color: isActive ? theme.colors.accentPrimary : "#1A1A1A" }}
                >
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
                    {items.length}
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 ${isRtl ? "rotate-180" : ""} ${
                      isActive ? "" : "text-gray-400"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Department detail: sub-categories (or plain product names) in columns */}
      {activeGroup && (
        <div
          className="custom-scrollbar max-h-[62vh] w-[600px] overflow-y-auto border border-s-0 border-t-0 p-5 xl:w-[760px]"
          style={{ ...borderStyle, backgroundColor: theme.colors.bgElevated }}
        >
          <div
            className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2.5"
            style={borderStyle}
          >
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-gray-900">
                {categoryName(activeGroup.category)}
              </h3>
              <p className="text-[10px] tabular-nums text-gray-400">
                {activeGroup.items.length} {t.itemsLabel}
                {activeGroup.subcategories.length > 0 && (
                  <>
                    {" · "}
                    {activeGroup.subcategories.length} {t.catalogSubcategories}
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectCategory(activeGroup.category.slug)}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold hover:underline"
              style={accentText}
            >
              {viewAllLabel(activeGroup.items.length)}
              <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
            </button>
          </div>

          {activeGroup.items.length === 0 && activeGroup.subcategories.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-500">
              {t.catalogMenuEmpty}
            </p>
          ) : activeGroup.subcategories.length > 0 ? (
            renderSubcategoryColumns(activeGroup)
          ) : (
            renderPlainProductColumns(activeGroup)
          )}

          <p className="mt-4 border-t pt-2.5 text-[10px] text-gray-400" style={borderStyle}>
            {t.catalogMenuHint}
          </p>
        </div>
      )}
    </div>
  );

  const mobileDrawer = (
    <div className="fixed inset-0 z-50 flex lg:hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        ref={mobilePanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.allDepartments}
        className="relative z-10 flex h-full w-[86vw] max-w-sm flex-col text-gray-900 shadow-2xl"
        style={{ backgroundColor: theme.colors.bgElevated }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            backgroundColor: theme.colors.textPrimary,
            borderBottom: `3px solid ${theme.colors.accentPrimary}`,
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5 text-white">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: theme.colors.accentPrimary }}
            >
              <Menu className="h-4 w-4" />
            </span>
            <h2 className="min-w-0 truncate text-sm font-extrabold">
              {t.allDepartments}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.closeBtn}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-start text-xs font-extrabold text-gray-900"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ color: theme.colors.accentPrimary, backgroundColor: "#F5F5F5" }}
            >
              <LayoutGrid className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">{t.catalogMenuAllProducts}</span>
            <span className="text-[10px] tabular-nums text-gray-400">
              {visibleProducts.length}
            </span>
          </button>

          {groups.map(({ category, items, subcategories }) => {
            const expanded = expandedSlug === category.slug;
            const name = categoryName(category);
            return (
              <div key={category.slug} className="border-b border-gray-100">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedSlug(expanded ? null : category.slug)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start transition"
                  style={{ backgroundColor: expanded ? "#F5F5F5" : "transparent" }}
                >
                  <CategoryImage
                    slug={category.slug}
                    src={category.imageUrl}
                    alt={name}
                    className="h-9 w-9 shrink-0 rounded-md border border-gray-100 bg-gray-50 object-contain p-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-xs font-bold"
                      style={{ color: expanded ? theme.colors.accentPrimary : "#1A1A1A" }}
                    >
                      {name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {items.length} {t.itemsLabel}
                      {subcategories.length > 0 && (
                        <> · {subcategories.length} {t.catalogSubcategories}</>
                      )}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expanded && (
                  <div className="bg-neutral-50 px-3 pb-3 pt-1">
                    {subcategories.length > 0 ? (
                      <ul className="overflow-hidden rounded-md border border-gray-200 bg-white">
                        {subcategories.map((sub) => (
                          <li key={sub.category.slug} className="border-b border-gray-100 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => handleSelectCategory(sub.category.slug)}
                              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start transition hover:bg-neutral-50"
                            >
                              <span
                                className="min-w-0 truncate text-[11.5px] font-semibold text-gray-700"
                              >
                                {categoryName(sub.category)}
                              </span>
                              <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
                                {sub.items.length}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : items.length === 0 ? (
                      <p className="py-3 text-center text-[11px] text-gray-500">
                        {t.catalogMenuEmpty}
                      </p>
                    ) : (
                      <ul className="overflow-hidden rounded-md border border-gray-200 bg-white">
                        {items.slice(0, PLAIN_PRODUCT_LIMIT).map((product) => (
                          <li
                            key={product.sku}
                            className="border-b border-gray-100 last:border-b-0"
                          >
                            <button
                              type="button"
                              onClick={() => handleQuickView(product)}
                              className="w-full px-3 py-2 text-start text-[11.5px] font-medium text-gray-700 transition hover:bg-neutral-50"
                            >
                              <span className="line-clamp-2">{productName(product)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(category.slug)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-extrabold text-white transition hover:opacity-90"
                      style={{ backgroundColor: theme.colors.accentPrimary }}
                    >
                      <span>{viewAllLabel(items.length)}</span>
                      <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="border-t border-gray-100 px-4 py-3 text-[10px] text-gray-400">
          {t.catalogMenuHint}
        </p>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={MENU_ID}
        className="flex h-full min-h-14 items-center gap-2 px-3 py-3 text-[13px] font-extrabold uppercase tracking-wide text-white transition hover:opacity-90 sm:px-4 sm:text-sm lg:text-base"
        style={{
          backgroundColor: theme.isDark ? theme.colors.bgSecondary : theme.colors.textPrimary,
          color: "#FFFFFF",
        }}
      >
        <Menu className="h-5 w-5 shrink-0" />
        <span>{t.navDepartments}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && desktopDropdown}
      {isOpen && typeof document !== "undefined" && createPortal(mobileDrawer, document.body)}
    </div>
  );
}
