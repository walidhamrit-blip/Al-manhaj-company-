import type { Language } from "@/lib/i18n-themes";
import type { OrderStatus } from "@/db/schema";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

const ORDER_STATUS_LABELS: Record<OrderStatus, Record<Language, string>> = {
  pending: { en: "Awaiting confirmation", ar: "بانتظار التأكيد" },
  confirmed: { en: "Confirmed", ar: "تم التأكيد" },
  preparing: { en: "Preparing", ar: "قيد التجهيز" },
  shipped: { en: "Out for delivery", ar: "في الطريق" },
  delivered: { en: "Delivered", ar: "تم التسليم" },
  cancelled: { en: "Cancelled", ar: "ملغاة" },
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, Record<Language, string>> = {
  pending: {
    en: "Your order has been received and is waiting for our team's confirmation.",
    ar: "استلمنا طلبك وهو بانتظار تأكيد فريقنا.",
  },
  confirmed: {
    en: "Your order is confirmed. We are preparing the next steps.",
    ar: "تم تأكيد طلبك، ونعمل على تجهيز الخطوات التالية.",
  },
  preparing: {
    en: "Our team is preparing your items for delivery.",
    ar: "يقوم فريقنا بتجهيز منتجاتك للتوصيل.",
  },
  shipped: {
    en: "Your order is on its way to you.",
    ar: "طلبك في الطريق إليك.",
  },
  delivered: {
    en: "Your order has been delivered. Thank you for shopping with us.",
    ar: "تم تسليم طلبك. شكراً لاختيارك متجرنا.",
  },
  cancelled: {
    en: "This order was cancelled. Please contact us if you need help.",
    ar: "تم إلغاء هذا الطلب. يرجى التواصل معنا إذا احتجت إلى المساعدة.",
  },
};

export function getOrderStatusLabel(status: OrderStatus, lang: Language): string {
  return ORDER_STATUS_LABELS[status][lang];
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}
