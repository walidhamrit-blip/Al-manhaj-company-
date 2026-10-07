"use client";

import React, { useId, useState } from "react";
import type { Product } from "@/db/schema";
import {
  UI_TEXT,
  formatPrice,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";
import { ChevronDown, Layers } from "lucide-react";

interface WholesalePriceDisclosureProps {
  product: Pick<Product, "sku" | "wholesalePrice" | "wholesaleMinQty">;
  lang: Language;
  theme: ThemeConfig;
  compact?: boolean;
}

export function WholesalePriceDisclosure({
  product,
  lang,
  theme,
  compact = false,
}: WholesalePriceDisclosureProps) {
  const t = UI_TEXT[lang];
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(String(Math.max(1, product.wholesaleMinQty)));

  const parsedQuantity = Number(quantity);
  const isValidQuantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0;
  const meetsMinimum = isValidQuantity && parsedQuantity >= product.wholesaleMinQty;

  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
        style={{
          backgroundColor: theme.colors.bgSecondary,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        }}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border text-start font-semibold transition hover:opacity-80 ${
          compact ? "px-2.5 py-2 text-[11px]" : "px-3 py-2.5 text-xs"
        }`}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Layers
            style={{ color: theme.colors.accentPrimary }}
            className="h-4 w-4 shrink-0"
          />
          <span className="truncate">
            {isOpen ? t.wholesaleHideQuoteButton : t.wholesaleQuoteButton}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id={panelId}
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
          }}
          className="mt-2 rounded-xl border p-3 shadow-sm"
        >
          <label
            htmlFor={`${panelId}-quantity`}
            style={{ color: theme.colors.textSecondary }}
            className="mb-1.5 block text-[11px] font-semibold"
          >
            {t.wholesaleQuantityPrompt}
          </label>
          <input
            id={`${panelId}-quantity`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            style={{
              backgroundColor: theme.colors.bgSecondary,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm font-bold tabular-nums outline-none focus:ring-2"
          />

          {!meetsMinimum ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p style={{ color: theme.colors.textSecondary }} className="text-[11px]">
                {t.wholesaleStartsAt.replace("{qty}", String(product.wholesaleMinQty))}
              </p>
              <button
                type="button"
                onClick={() => setQuantity(String(product.wholesaleMinQty))}
                style={{ color: theme.colors.accentPrimary }}
                className="text-[11px] font-bold underline underline-offset-2"
              >
                {t.wholesaleUseMinimum.replace("{qty}", String(product.wholesaleMinQty))}
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.badgeText,
              }}
              className="mt-3 grid grid-cols-2 gap-2 rounded-lg p-2.5"
            >
              <div className="min-w-0">
                <span className="block text-[10px] font-medium opacity-75">
                  {t.wholesaleUnitPrice}
                </span>
                <strong dir="ltr" className="block truncate text-sm font-extrabold tabular-nums">
                  {formatPrice(Number(product.wholesalePrice), lang)}
                  <span className="ms-1 text-[10px] font-medium">/ {t.units}</span>
                </strong>
              </div>
              <div className="min-w-0 text-end">
                <span className="block text-[10px] font-medium opacity-75">
                  {t.wholesaleOrderTotal}
                </span>
                <strong dir="ltr" className="block truncate text-sm font-extrabold tabular-nums">
                  {formatPrice(Number(product.wholesalePrice) * parsedQuantity, lang)}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
