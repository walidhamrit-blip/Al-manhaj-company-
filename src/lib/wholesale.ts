export const WHOLESALE_TIER2_QTY = 50;
export const WHOLESALE_TIER3_QTY = 200;
export const WHOLESALE_TIER2_FACTOR = 0.94;
export const WHOLESALE_TIER3_FACTOR = 0.88;

export type WholesaleQuote = {
  retailUnit: number;
  appliedUnit: number;
  tierName: string;
  totalCost: number;
  totalSavings: number;
};

export function computeWholesaleQuote(input: {
  retailUnit: number;
  wholesaleUnit: number;
  minQty: number;
  qty: number;
  retailLabel: string;
  tier1Label: string;
  tier2Label: string;
  tier3Label: string;
}): WholesaleQuote {
  const retailUnit = Number(input.retailUnit) || 0;
  const wholesaleUnit = Number(input.wholesaleUnit) || 0;
  const minQty = Math.max(1, Number(input.minQty) || 10);
  const qty = Number(input.qty) || 0;

  let appliedUnit = retailUnit;
  let tierName = input.retailLabel;

  if (qty >= WHOLESALE_TIER3_QTY) {
    appliedUnit = Number((wholesaleUnit * WHOLESALE_TIER3_FACTOR).toFixed(2));
    tierName = input.tier3Label;
  } else if (qty >= WHOLESALE_TIER2_QTY) {
    appliedUnit = Number((wholesaleUnit * WHOLESALE_TIER2_FACTOR).toFixed(2));
    tierName = input.tier2Label;
  } else if (qty >= minQty) {
    appliedUnit = wholesaleUnit;
    tierName = input.tier1Label;
  }

  const totalCost = appliedUnit * qty;
  const totalSavings = Math.max(0, (retailUnit - appliedUnit) * qty);

  return { retailUnit, appliedUnit, tierName, totalCost, totalSavings };
}

export function buildWholesaleWhatsAppMessage(input: {
  lang: "ar" | "en";
  productTitle: string;
  sku: string;
  qty: number;
  totalLabel: string;
}): string {
  if (input.lang === "ar") {
    return `مرحباً، أود طلب عرض سعر جملة للمؤسسات:\n• المنتج: ${input.productTitle} (${input.sku})\n• الكمية: ${input.qty} قطعة\n• الإجمالي التقديري: ${input.totalLabel}`;
  }
  return `Hello, I would like a B2B Wholesale Quote:\n• Product: ${input.productTitle} (${input.sku})\n• Quantity: ${input.qty} units\n• Estimated Total: ${input.totalLabel}`;
}
