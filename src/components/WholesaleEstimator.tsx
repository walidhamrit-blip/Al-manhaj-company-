"use client";

import React, { useMemo, useState } from "react";
import type { Product } from "@/db/schema";
import {
  UI_TEXT,
  formatPrice,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import {
  buildWholesaleWhatsAppMessage,
  computeWholesaleQuote,
} from "@/lib/wholesale";
import { Check, Layers, MessageCircle, Search, ShoppingBag } from "lucide-react";

interface WholesaleEstimatorProps {
  products: Product[];
  lang: Language;
  theme: ThemeConfig;
  onAddToCart: (product: Product, qty: number) => void;
  onInquire: (message: string) => void;
}

export function WholesaleEstimator({
  products,
  lang,
  theme,
  onAddToCart,
  onInquire,
}: WholesaleEstimatorProps) {
  const t = UI_TEXT[lang];
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [qty, setQty] = useState(25);
  const [added, setAdded] = useState(false);
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.titleAr, product.titleEn, product.sku, product.categorySlug, product.subcategorySlug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [products, query]);

  const selected =
    filteredProducts.find((product) => product.id === productId) ||
    filteredProducts[0] ||
    null;

  const quote = useMemo(() => {
    if (!selected) return null;
    return computeWholesaleQuote({
      retailUnit: Number(selected.price),
      wholesaleUnit: Number(selected.wholesalePrice),
      minQty: selected.wholesaleMinQty || 10,
      qty,
      retailLabel: lang === "ar" ? "سعر التقسيط العادي" : "Standard Retail Rate",
      tier1Label: t.tier1Label,
      tier2Label: t.tier2Label,
      tier3Label: t.tier3Label,
    });
  }, [selected, qty, lang, t.tier1Label, t.tier2Label, t.tier3Label]);

  return (
    <div
      data-wholesale-estimator
      style={{
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.border,
      }}
      className="rounded-none border p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Layers style={{ color: theme.colors.accentPrimary }} className="h-5 w-5" />
        <h3 className="text-base sm:text-lg font-extrabold">
          {t.wholesaleCalculatorTitle}
        </h3>
      </div>

      <div>
        <label
          className="block text-xs font-bold mb-1.5"
          htmlFor="wholesale-product-search"
        >
          {t.wholesaleSearchLabel}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            style={{ color: theme.colors.textSecondary }}
            className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 opacity-70"
          />
          <input
            id="wholesale-product-search"
            data-wholesale-search
            type="search"
            value={query}
            placeholder={t.wholesaleSearchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setAdded(false);
            }}
            style={{
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            }}
            className="w-full rounded-none border py-2.5 ps-9 pe-3 text-xs sm:text-sm font-bold outline-none focus:ring-2"
          />
        </div>
        {filteredProducts.length === 0 && (
          <p
            data-wholesale-search-empty
            className="mt-1.5 text-[11px] font-bold text-red-500"
          >
            {t.wholesaleSearchEmpty}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold mb-1.5" htmlFor="wholesale-product">
          {t.selectProduct}
        </label>
        <select
          id="wholesale-product"
          value={selected?.id ?? 0}
          disabled={filteredProducts.length === 0}
          onChange={(event) => {
            setProductId(Number(event.target.value));
            setAdded(false);
          }}
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
          }}
          className="w-full rounded-none border px-3 py-2.5 text-xs sm:text-sm font-bold outline-none disabled:opacity-60"
        >
          {filteredProducts.map((prod) => (
            <option key={prod.sku} value={prod.id}>
              {lang === "ar" ? prod.titleAr : prod.titleEn} (
              {formatPrice(prod.wholesalePrice, lang)})
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span>{t.quantityLabel}</span>
          <span className="text-sm font-black tabular-nums">
            {qty} {t.units}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={250}
          step={5}
          value={qty}
          aria-label={t.quantityLabel}
          onChange={(event) => {
            setQty(Number(event.target.value));
            setAdded(false);
          }}
          className="w-full cursor-pointer accent-current"
        />
        <div className="flex justify-between text-[10px] opacity-70 mt-1">
          <span>10+ (Tier 1)</span>
          <span>50+ (Tier 2)</span>
          <span>200+ (Tier 3)</span>
        </div>
      </div>

      {quote && selected && (
        <div
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
          }}
          className="rounded-none border p-4 space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-75">{t.unitPriceApplied}:</span>
            <span className="font-extrabold tabular-nums">
              {formatPrice(quote.appliedUnit, lang)} /{" "}
              {lang === "ar" ? "قطعة" : "unit"}
            </span>
          </div>
          <p className="text-[11px] font-semibold opacity-80">{quote.tierName}</p>
          <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
            <span>{t.totalSavings}:</span>
            <span className="tabular-nums">
              -{formatPrice(quote.totalSavings, lang)}
            </span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between text-base font-black">
            <span>{t.totalEstimated}:</span>
            <span className="tabular-nums">{formatPrice(quote.totalCost, lang)}</span>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-1">
        {selected && (
          <button
            type="button"
            onClick={() => {
              onAddToCart(selected, qty);
              setAdded(true);
            }}
            style={{
              backgroundColor: theme.colors.accentPrimary,
              color: "#FFFFFF",
            }}
            className="w-full flex items-center justify-center gap-2 rounded-none py-3 px-4 text-xs sm:text-sm font-extrabold shadow-md transition hover:opacity-95"
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            <span>
              {added
                ? t.wholesaleAddedToCart
                : `${t.addEstimateToCart} (${qty} ${t.units})`}
            </span>
          </button>
        )}

        {selected && quote && (
          <button
            type="button"
            onClick={() => {
              onInquire(
                buildWholesaleWhatsAppMessage({
                  lang,
                  productTitle: lang === "ar" ? selected.titleAr : selected.titleEn,
                  sku: selected.sku,
                  qty,
                  totalLabel: formatPrice(quote.totalCost, lang),
                }),
              );
            }}
            className="w-full flex items-center justify-center gap-2 rounded-none bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 px-4 text-xs font-extrabold shadow transition"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            <span>{t.inquireWholesaleWhatsApp}</span>
          </button>
        )}
      </div>
    </div>
  );
}
