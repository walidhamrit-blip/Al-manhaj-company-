"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Category, Product } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language } from "@/lib/i18n-themes";
import { CategoryImage } from "@/components/CategoryImage";
import { ProductImage } from "@/components/ProductImage";
import {
  getProductParentSlug,
  getProductSubcategorySlug,
} from "@/lib/category-hierarchy";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Menu,
  Percent,
  ShoppingBag,
  X,
} from "lucide-react";

/**
 * Mytek-style vertical catalogue menu.
 *
 * Desktop (lg+): a red "Master Catalog" trigger in the navigation strip opens,
 * on hover or click, a vertical list of departments that floats OVER the page
 * (absolute positioning) — it never pushes the homepage content. Hovering a
 * department opens a flyout with its products, like Mytek's mega menu.
 *
 * Mobile / tablet: the same vertical list is rendered as an off-canvas drawer
 * (portal on <body>) with accordion departments.
 */

const MYTEK_NAVY = "#1A1A2E";
const MYTEK_RED = "#E31837";
const MYTEK_RED_SOFT = "#FFF0F0";
const HOVER_OPEN_DELAY_MS = 120;
const HOVER_CLOSE_DELAY_MS = 220;
const DESKTOP_HOVER_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
const DESKTOP_QUERY = "(min-width: 1024px)";
const FLYOUT_PRODUCT_LIMIT = 10;
const MENU_ID = "catalog-vertical-menu";

interface CategoryGroup {
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
  /** Filters the storefront by department and scrolls to the catalog grid. */
  onSelectCategory: (slug: string) => void;
  /** Shows only promotional products in the storefront. */
  onShowPromotions: () => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, qty: number) => void;
}

type TimerRef = React.MutableRefObject<number | null>;

function clearTimer(timer: TimerRef) {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
    timer.current = null;
  }
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
  onSelectCategory,
  onShowPromotions,
  onQuickView,
  onAddToCart,
}: CatalogVerticalMenuProps) {
  const t = UI_TEXT[lang];
  const isRtl = lang === "ar";

  const rootRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const addedTimer = useRef<number | null>(null);

  // Desktop flyout department + mobile accordion department.
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const visibleProducts = useMemo(
    () => products.filter((product) => !product.isHidden),
    [products]
  );

  const categoriesBySlug = useMemo(
    () =>
      new Map<string, Category>(
        categories.map((category) => [category.slug, category])
      ),
    [categories]
  );

  const topLevelCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => !c.parentSlug)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parentSlug) {
        const list = map.get(c.parentSlug) || [];
        list.push(c);
        map.set(c.parentSlug, list);
      }
    }
    // Sort subcategories within each parent
    for (const [, subs] of map) {
      subs.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [categories]);

  const groups = useMemo<CategoryGroup[]>(
    () =>
      topLevelCategories.map((category) => {
        const subs = subcategoriesByParent.get(category.slug) || [];
        const subcategories = subs.map((sub) => ({
          category: sub,
          items: visibleProducts.filter(
            (product) =>
              getProductSubcategorySlug(product, categoriesBySlug) === sub.slug
          ),
        }));
        const items = visibleProducts.filter(
          (product) =>
            getProductParentSlug(product, categoriesBySlug) === category.slug
        );
        return { category, items, subcategories };
      }),
    [topLevelCategories, subcategoriesByParent, visibleProducts, categoriesBySlug]
  );

  const promoCount = useMemo(
    () => visibleProducts.filter((product) => product.isPromotion).length,
    [visibleProducts]
  );

  const activeGroup =
    groups.find((group) => group.category.slug === activeSlug) ?? null;

  // Every close path goes through here so hover/accordion state never leaks
  // into the next opening.
  const setOpen = useCallback(
    (next: boolean) => {
      clearTimer(openTimer);
      clearTimer(closeTimer);
      if (!next) {
        setActiveSlug(null);
        setExpandedSlug(null);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  // Escape key + click outside (trigger, dropdown and mobile panel excluded).
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

  useEffect(
    () => () => {
      clearTimer(openTimer);
      clearTimer(closeTimer);
      clearTimer(addedTimer);
    },
    []
  );

  // Hover intent (desktop pointers only) — Mytek opens the menu on hover.
  const handleMouseEnter = () => {
    if (!matches(DESKTOP_HOVER_QUERY)) return;
    clearTimer(closeTimer);
    if (isOpen || openTimer.current !== null) return;
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      onOpenChange(true);
    }, HOVER_OPEN_DELAY_MS);
  };

  const handleMouseLeave = () => {
    if (!matches(DESKTOP_HOVER_QUERY)) return;
    clearTimer(openTimer);
    if (!isOpen || closeTimer.current !== null) return;
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  const handleSelectCategory = (slug: string) => {
    setOpen(false);
    onSelectCategory(slug);
  };

  const handleShowPromotions = () => {
    setOpen(false);
    onShowPromotions();
  };

  const handleQuickView = (product: Product) => {
    setOpen(false);
    onQuickView(product);
  };

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product, 1);
    setAddedProductId(product.id);
    clearTimer(addedTimer);
    addedTimer.current = window.setTimeout(() => {
      addedTimer.current = null;
      setAddedProductId(null);
    }, 900);
  };

  const categoryName = (category: Category) =>
    lang === "ar" ? category.nameAr : category.nameEn;
  const viewAllLabel = (count: number) =>
    t.catalogMenuViewAll.replace("{count}", String(count));

  const renderProductRow = (product: Product) => {
    const title = lang === "ar" ? product.titleAr : product.titleEn;
    const image =
      Array.isArray(product.images) && product.images[0]
        ? product.images[0]
        : "";
    const hasDiscount =
      typeof product.originalPrice === "number" &&
      product.originalPrice > product.price;
    const added = addedProductId === product.id;
    const soldOut = product.stock <= 0;

    return (
      <div
        key={product.id}
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-gray-50"
      >
        <button
          type="button"
          onClick={() => handleQuickView(product)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-start"
        >
          <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
            <ProductImage
              product={product}
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold text-gray-800 transition group-hover:text-red-600">
              {title}
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <span
                dir="ltr"
                className="font-extrabold tabular-nums"
                style={{ color: MYTEK_RED }}
              >
                {formatPrice(product.price, lang)}
              </span>
              {hasDiscount && (
                <span
                  dir="ltr"
                  className="text-[10px] tabular-nums text-gray-400 line-through"
                >
                  {formatPrice(product.originalPrice as number, lang)}
                </span>
              )}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(product)}
          disabled={soldOut}
          aria-label={t.addToCart}
          title={soldOut ? t.outOfStock : t.addToCart}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:border-[#E31837] hover:bg-[#E31837] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-600"
          style={
            added
              ? {
                  backgroundColor: "#059669",
                  borderColor: "#059669",
                  color: "#FFFFFF",
                }
              : undefined
          }
        >
          {added ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <ShoppingBag className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    );
  };

  const desktopDropdown = (
    <div
      id={MENU_ID}
      className="absolute start-0 top-full z-50 hidden items-stretch shadow-2xl lg:flex"
    >
      {/* Vertical department list */}
      <ul
        role="menu"
        aria-label={t.masterCatalog}
        className="custom-scrollbar max-h-[72vh] w-72 shrink-0 overflow-y-auto border border-t-0 border-gray-200 bg-white py-1"
      >
        <li>
          <button
            type="button"
            role="menuitem"
            onMouseEnter={() => setActiveSlug(null)}
            onFocus={() => setActiveSlug(null)}
            onClick={() => handleSelectCategory("all")}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-xs font-extrabold text-gray-900 transition hover:bg-gray-50"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: MYTEK_RED_SOFT, color: MYTEK_RED }}
            >
              <LayoutGrid className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {t.catalogMenuAllProducts}
            </span>
            <span className="text-[10px] tabular-nums text-gray-400">
              {visibleProducts.length}
            </span>
          </button>
        </li>

        {groups.map(({ category, items }) => {
          const active = activeSlug === category.slug;
          const name = categoryName(category);
          return (
            <li key={category.slug}>
              <button
                type="button"
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={active}
                onMouseEnter={() => setActiveSlug(category.slug)}
                onFocus={() => setActiveSlug(category.slug)}
                onClick={() => handleSelectCategory(category.slug)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-xs font-bold transition"
                style={{
                  backgroundColor: active ? MYTEK_RED_SOFT : "transparent",
                  color: active ? MYTEK_RED : "#1A1A1A",
                }}
              >
                <CategoryImage
                  slug={category.slug}
                  src={category.imageUrl}
                  alt={name}
                  className="h-8 w-8 shrink-0 rounded-md border border-gray-100 bg-gray-50 object-contain p-0.5"
                />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="text-[10px] tabular-nums text-gray-400">
                  {items.length}
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 ${active ? "" : "text-gray-400"} ${isRtl ? "rotate-180" : ""}`}
                />
              </button>
            </li>
          );
        })}

        <li className="mt-1 border-t border-gray-100 pt-1">
          <button
            type="button"
            role="menuitem"
            onMouseEnter={() => setActiveSlug(null)}
            onFocus={() => setActiveSlug(null)}
            onClick={handleShowPromotions}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-xs font-extrabold transition hover:bg-gray-50"
            style={{ color: MYTEK_RED }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: MYTEK_RED }}
            >
              <Percent className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {t.catalogMenuPromotions}
            </span>
            <span className="text-[10px] tabular-nums text-gray-400">
              {promoCount}
            </span>
          </button>
        </li>

        <li className="px-3 pb-2 pt-1 text-[10px] text-gray-400">
          {t.catalogMenuHint}
        </li>
      </ul>

      {/* Flyout for the hovered department */}
      {activeGroup && (
        <div className="custom-scrollbar flex max-h-[72vh] w-[620px] overflow-y-auto border border-s-0 border-t-0 border-gray-200 bg-white xl:w-[760px]">
          <div className="flex min-w-0 flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
              <div className="min-w-0">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: MYTEK_RED }}
                >
                  {lang === "ar"
                    ? activeGroup.category.badgeAr
                    : activeGroup.category.badgeEn}
                </span>
                <h3 className="text-base font-extrabold text-gray-900">
                  {categoryName(activeGroup.category)}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                  {lang === "ar"
                    ? activeGroup.category.descriptionAr
                    : activeGroup.category.descriptionEn}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectCategory(activeGroup.category.slug)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-extrabold text-white transition hover:opacity-90"
                style={{ backgroundColor: MYTEK_RED }}
              >
                <span>{viewAllLabel(activeGroup.items.length)}</span>
                <ArrowRight
                  className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {activeGroup.items.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-500">
                {t.catalogMenuEmpty}
              </p>
            ) : activeGroup.subcategories.length > 0 ? (
              <div className="mt-3 space-y-4">
                {activeGroup.subcategories.map((sub) => (
                  <div key={sub.category.slug}>
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(sub.category.slug)}
                      className="mb-1.5 flex items-center gap-2 text-left transition hover:opacity-80"
                    >
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{ color: MYTEK_RED }}
                      >
                        {lang === "ar" ? sub.category.nameAr : sub.category.nameEn}
                      </span>
                      <span className="text-[10px] tabular-nums text-gray-400">
                        ({sub.items.length})
                      </span>
                    </button>
                    {sub.items.length === 0 ? (
                      <p className="py-2 text-center text-[10px] text-gray-400">
                        —
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {sub.items
                          .slice(0, FLYOUT_PRODUCT_LIMIT)
                          .map((product) => renderProductRow(product))}
                      </div>
                    )}
                    {sub.items.length > FLYOUT_PRODUCT_LIMIT && (
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(sub.category.slug)}
                        className="mt-1 self-start text-[10px] font-bold underline underline-offset-2"
                        style={{ color: MYTEK_RED }}
                      >
                        {t.catalogMenuMore.replace(
                          "{count}",
                          String(sub.items.length - FLYOUT_PRODUCT_LIMIT)
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {activeGroup.items
                    .slice(0, FLYOUT_PRODUCT_LIMIT)
                    .map((product) => renderProductRow(product))}
                </div>
                {activeGroup.items.length > FLYOUT_PRODUCT_LIMIT && (
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(activeGroup.category.slug)}
                    className="mt-3 self-start text-[11px] font-bold underline underline-offset-2"
                    style={{ color: MYTEK_RED }}
                  >
                    {t.catalogMenuMore.replace(
                      "{count}",
                      String(activeGroup.items.length - FLYOUT_PRODUCT_LIMIT)
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mytek-style promotional column */}
          <div className="hidden w-48 shrink-0 flex-col justify-between gap-4 border-s border-gray-100 bg-gray-50 p-4 xl:flex">
            <CategoryImage
              slug={activeGroup.category.slug}
              src={activeGroup.category.imageUrl}
              alt={categoryName(activeGroup.category)}
              className="h-36 w-full rounded-lg bg-white object-cover shadow-sm"
            />
            <div className="space-y-2">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: MYTEK_RED_SOFT, color: MYTEK_RED }}
              >
                {lang === "ar"
                  ? activeGroup.category.badgeAr
                  : activeGroup.category.badgeEn}
              </span>
              <p className="text-xs font-bold text-gray-900">
                {activeGroup.items.length} {t.itemsLabel}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const mobileDrawer = (
    <div
      className="fixed inset-0 z-50 flex lg:hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        ref={mobilePanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.masterCatalog}
        className="relative z-10 flex h-full w-[86vw] max-w-sm flex-col bg-white text-gray-900 shadow-2xl"
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            backgroundColor: MYTEK_NAVY,
            borderBottom: `3px solid ${MYTEK_RED}`,
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5 text-white">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: MYTEK_RED }}
            >
              <Menu className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold">
                {t.masterCatalog}
              </h2>
              <p className="truncate text-[10px] text-gray-400">
                {visibleProducts.length} {t.itemsLabel}
              </p>
            </div>
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
              style={{ backgroundColor: MYTEK_RED_SOFT, color: MYTEK_RED }}
            >
              <LayoutGrid className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {t.catalogMenuAllProducts}
            </span>
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
                  onClick={() =>
                    setExpandedSlug(expanded ? null : category.slug)
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-start transition"
                  style={{
                    backgroundColor: expanded ? MYTEK_RED_SOFT : "transparent",
                  }}
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
                      style={{ color: expanded ? MYTEK_RED : "#1A1A1A" }}
                    >
                      {name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {items.length} {t.itemsLabel}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {expanded && (
                  <div className="bg-gray-50 px-3 pb-3 pt-1">
                    {subcategories.length > 0 ? (
                      <div className="space-y-1">
                        {subcategories.map((sub) => (
                          <div key={sub.category.slug} className="rounded-md bg-white border border-gray-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleSelectCategory(sub.category.slug)}
                              className="flex w-full items-center justify-between px-3 py-2 text-start transition hover:bg-gray-50"
                            >
                              <span className="text-[11px] font-bold" style={{ color: MYTEK_RED }}>
                                {lang === "ar" ? sub.category.nameAr : sub.category.nameEn}
                              </span>
                              <span className="text-[10px] tabular-nums text-gray-400">
                                {sub.items.length}
                              </span>
                            </button>
                            {sub.items.length > 0 && (
                              <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {sub.items.slice(0, 3).map((product) => renderProductRow(product))}
                                {sub.items.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectCategory(sub.category.slug)}
                                    className="w-full px-3 py-1.5 text-start text-[10px] font-bold"
                                    style={{ color: MYTEK_RED }}
                                  >
                                    {viewAllLabel(sub.items.length)}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : items.length === 0 ? (
                      <p className="py-3 text-center text-[11px] text-gray-500">
                        {t.catalogMenuEmpty}
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
                        {items.map((product) => renderProductRow(product))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(category.slug)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-extrabold text-white transition hover:opacity-90"
                      style={{ backgroundColor: MYTEK_RED }}
                    >
                      <span>{viewAllLabel(items.length)}</span>
                      <ArrowRight
                        className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleShowPromotions}
            className="flex w-full items-center gap-3 px-4 py-3 text-start text-xs font-extrabold"
            style={{ color: MYTEK_RED }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: MYTEK_RED }}
            >
              <Percent className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {t.catalogMenuPromotions}
            </span>
            <span className="text-[10px] tabular-nums text-gray-400">
              {promoCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={MENU_ID}
        className="flex h-10 items-center gap-2 px-3 text-[11px] font-extrabold uppercase tracking-wide text-white transition hover:opacity-90 sm:px-4 sm:text-xs"
        style={{ backgroundColor: MYTEK_RED }}
      >
        <Menu className="h-4 w-4" />
        <span>{t.masterCatalog}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && desktopDropdown}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(mobileDrawer, document.body)}
    </div>
  );
}
