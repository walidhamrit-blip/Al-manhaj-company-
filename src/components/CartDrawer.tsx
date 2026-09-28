"use client";

import React, { useState } from "react";
import type { Product, StoreSettings } from "@/db/schema";
import { UI_TEXT, formatPrice, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import { WhatsAppOrderPanel } from "@/components/WhatsAppOrderPanel";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  Layers,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: number, newQty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  settings: StoreSettings | null;
  lang: Language;
  theme: ThemeConfig;
  currencySymbol: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  settings,
  lang,
  theme,
  currencySymbol,
}: CartDrawerProps) {
  const t = UI_TEXT[lang];
  const [customerName, setCustomerName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [showWaPanel, setShowWaPanel] = useState(false);

  if (!isOpen) return null;

  const lineCalculations = cart.map((item) => {
    const isWholesale = item.quantity >= item.product.wholesaleMinQty;
    const unitPrice = isWholesale
      ? Number(item.product.wholesalePrice)
      : Number(item.product.price);
    const retailBaseline =
      item.product.originalPrice &&
      item.product.originalPrice > item.product.price
        ? Number(item.product.originalPrice)
        : Number(item.product.price);

    const lineTotal = unitPrice * item.quantity;
    const lineSavings = Math.max(
      0,
      (retailBaseline - unitPrice) * item.quantity
    );

    return {
      ...item,
      isWholesale,
      unitPrice,
      lineTotal,
      lineSavings,
    };
  });

  const grandTotal = lineCalculations.reduce(
    (acc, item) => acc + item.lineTotal,
    0
  );
  const totalSavings = lineCalculations.reduce(
    (acc, item) => acc + item.lineSavings,
    0
  );
  const totalUnits = lineCalculations.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const buildWhatsAppMessage = () => {
    const storeTitle = settings
      ? lang === "ar"
        ? settings.storeNameAr
        : settings.storeNameEn
      : lang === "ar"
        ? "شركة المنهج للقرطاسية"
        : "Al Manhaj Company for Stationery";

    if (lang === "ar") {
      const lines = [
        `🛍️ *طلب جديد - ${storeTitle}*`,
        customerName.trim() ? `👤 *العميل / المؤسسة:* ${customerName.trim()}` : "",
        `📦 *تفاصيل السلة (${totalUnits} قطعة):*`,
        "--------------------------------",
        ...lineCalculations.map((item, idx) => {
          const modeLabel = item.isWholesale ? "سعر الجملة" : "سعر التقسيط";
          return `${idx + 1}. *${item.product.titleAr}* (${item.product.sku})\n   • الكمية: ${
            item.quantity
          } × ${formatPrice(item.unitPrice, "ar")} (${modeLabel}) = *${formatPrice(item.lineTotal, "ar")}*`;
        }),
        "--------------------------------",
        totalSavings > 0
          ? `✨ *إجمالي التوفير والخصم:* ${formatPrice(totalSavings, "ar")}`
          : "",
        `💰 *المبلغ الإجمالي للطلب:* *${formatPrice(grandTotal, "ar")}*`,
        customerNotes.trim() ? `📍 *ملاحظات التوصيل:* ${customerNotes.trim()}` : "",
        "\nيرجى تأكيد توفر الطلب وطريقة الدفع والتوصيل. شكراً لكم!",
      ].filter(Boolean);
      return lines.join("\n");
    } else {
      const lines = [
        `🛍️ *NEW ORDER - ${storeTitle}*`,
        customerName.trim() ? `👤 *Customer / Org:* ${customerName.trim()}` : "",
        `📦 *Order Summary (${totalUnits} units):*`,
        "--------------------------------",
        ...lineCalculations.map((item, idx) => {
          const modeLabel = item.isWholesale ? "Wholesale Rate" : "Retail Rate";
          return `${idx + 1}. *${item.product.titleEn}* (${item.product.sku})\n   • Qty: ${
            item.quantity
          } × ${formatPrice(item.unitPrice, "en")} (${modeLabel}) = *${formatPrice(item.lineTotal, "en")}*`;
        }),
        "--------------------------------",
        totalSavings > 0
          ? `✨ *Total Bulk/Promo Savings:* ${formatPrice(totalSavings, "en")}`
          : "",
        `💰 *TOTAL ORDER AMOUNT:* *${formatPrice(grandTotal, "en")}*`,
        customerNotes.trim() ? `📍 *Delivery Notes:* ${customerNotes.trim()}` : "",
        "\nPlease confirm availability and delivery schedule. Thank you!",
      ].filter(Boolean);
      return lines.join("\n");
    }
  };

  const rawPhone = settings?.whatsappNumber || "218912145050";

  const handleSendWhatsApp = () => {
    if (cart.length === 0) return;
    // Essayer l'ouverture directe d'abord (meilleure UX)
    try {
      const clean = rawPhone.replace(/[^0-9]/g, "");
      const formatted = clean.startsWith("218") ? clean : "218" + clean;
      const waUrl = `https://wa.me/${formatted}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
      const opened = window.open(waUrl, "_blank", "noopener,noreferrer");
      // Si le popup est bloqué, afficher le panneau de copie manuelle en fallback
      if (!opened) {
        setShowWaPanel(true);
      } else {
        // Optionnel: garder le panneau ouvert aussi pour voir la confirmation
        // setShowWaPanel(true);
      }
    } catch {
      setShowWaPanel(true);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard?.writeText(buildWhatsAppMessage());
    } catch {
      /* ignore */
    }
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Content */}
      <div
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          borderColor: theme.colors.border,
        }}
        className="relative z-10 flex h-full w-full max-w-md flex-col border-s shadow-2xl"
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: theme.colors.bgElevated,
            borderColor: theme.colors.border,
          }}
          className="flex items-center justify-between border-b p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: theme.colors.accentPrimary,
                color: "#FFFFFF",
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            >
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                {t.cartTitle}
              </h2>
              <p
                style={{ color: theme.colors.textSecondary }}
                className="text-xs"
              >
                {totalUnits} {t.units}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition"
              >
                {t.clearCartBtn}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-80"
              aria-label={t.closeBtn}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3.5">
          {lineCalculations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12 px-4">
              <div
                style={{ backgroundColor: theme.colors.bgSecondary }}
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              >
                <ShoppingBag
                  style={{ color: theme.colors.textSecondary }}
                  className="h-8 w-8 opacity-60"
                />
              </div>
              <h3 className="text-base font-bold mb-1">{t.cartEmpty}</h3>
              <p
                style={{ color: theme.colors.textSecondary }}
                className="text-xs max-w-xs"
              >
                {t.cartEmptySub}
              </p>
            </div>
          ) : (
            lineCalculations.map(
              ({ product, quantity, isWholesale, unitPrice, lineTotal }) => {
                const img =
                  Array.isArray(product.images) && product.images[0]
                    ? product.images[0]
                    : "/images/hero-stationery.jpg";
                const unitsNeededForWholesale = Math.max(
                  0,
                  product.wholesaleMinQty - quantity
                );

                return (
                  <div
                    key={product.id}
                    style={{
                      backgroundColor: theme.colors.bgElevated,
                      borderColor: theme.colors.border,
                    }}
                    className="rounded-2xl border p-3.5 shadow-sm transition"
                  >
                    <div className="flex gap-3">
                      <img
                        src={img}
                        alt={product.titleEn}
                        className="h-16 w-16 rounded-xl object-cover shrink-0 border border-black/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                            {lang === "ar" ? product.titleAr : product.titleEn}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            className="text-rose-500 hover:text-rose-600 p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span dir="ltr" className="font-bold tabular-nums">
                            {formatPrice(unitPrice, lang)}
                          </span>
                          {isWholesale && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              <Sparkles className="h-2.5 w-2.5" />
                              {t.wholesaleAppliedBadge}
                            </span>
                          )}
                        </div>

                        {/* Stepper & Line Total */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <div
                            style={{
                              backgroundColor: theme.colors.bgSecondary,
                              borderColor: theme.colors.border,
                            }}
                            className="inline-flex items-center rounded-xl border p-0.5"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQty(product.id, quantity - 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-xs font-extrabold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQty(product.id, quantity + 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div dir="ltr" className="text-sm font-extrabold tabular-nums">
                            {formatPrice(lineTotal, lang)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Smart Upsell to Wholesale Tier */}
                    {!isWholesale && unitsNeededForWholesale > 0 && (
                      <div
                        style={{
                          backgroundColor: theme.colors.badgeBg,
                          color: theme.colors.badgeText,
                        }}
                        className="mt-2.5 flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px]"
                      >
                        <span className="font-medium">
                          {t.addMoreForWholesale.replace(
                            "{n}",
                            String(unitsNeededForWholesale)
                          )}{" "}
                          ({formatPrice(product.wholesalePrice, lang)})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(product.id, product.wholesaleMinQty)
                          }
                          className="inline-flex items-center gap-1 font-extrabold underline ms-2 shrink-0"
                        >
                          <Layers className="h-3 w-3" />
                          <span>
                            {lang === "ar"
                              ? `ترقية إلى ${product.wholesaleMinQty}`
                              : `Set ${product.wholesaleMinQty}`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
            )
          )}
        </div>

        {/* Footer Checkout with WhatsApp Integration */}
        {cart.length > 0 && (
          <div
            style={{
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.colors.border,
            }}
            className="border-t p-4 space-y-3"
          >
            {/* Optional Customer Info for WhatsApp Message */}
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.customerNamePlaceholder}
                style={{
                  backgroundColor: theme.colors.bgSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
                className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              />
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder={t.customerNotesPlaceholder}
                style={{
                  backgroundColor: theme.colors.bgSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
                className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              />
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1 pt-1">
              {totalSavings > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>{t.totalSavingsCart}</span>
                  <span dir="ltr" className="tabular-nums">
                    -{formatPrice(totalSavings, lang)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-base sm:text-lg font-extrabold">
                <span>{t.subtotalLabel}</span>
                <span dir="ltr" className="tabular-nums">
                  {formatPrice(grandTotal, lang)}
                </span>
              </div>
            </div>

            {/* Primary WhatsApp Order Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3.5 px-4 text-sm font-extrabold shadow-lg transition active:scale-[0.99]"
                title={lang === "ar" ? "فتح واتساب مباشرة مع الطلب جاهز للإرسال" : "Open WhatsApp directly with order pre-filled"}
              >
                <MessageCircle className="h-5 w-5 fill-current" />
                <span>{t.checkoutWhatsAppBtn} ↗</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                style={{
                  backgroundColor: theme.colors.bgSecondary,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }}
                title={
                  lang === "ar"
                    ? "نسخ نص الطلب"
                    : "Copy formatted order message"
                }
                className="flex items-center justify-center rounded-xl border px-3.5 py-3.5 text-xs font-bold transition hover:opacity-80"
              >
                {copiedPreview ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="text-center text-[11px] font-medium opacity-70">
              {lang === "ar"
                ? "افتح واتساب ثم الصق هذه الرسالة في المحادثة"
                : "Open WhatsApp and paste this message into the chat"}
            </p>
          </div>
        )}
      </div>

      <WhatsAppOrderPanel
        isOpen={showWaPanel}
        onClose={() => setShowWaPanel(false)}
        phoneNumber={rawPhone}
        message={buildWhatsAppMessage()}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}
