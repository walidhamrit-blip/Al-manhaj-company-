import type {
  Order,
  OrderLineItem,
  OrderStatus,
  StoreSettings,
} from "@/db/schema";
import type { Language } from "@/lib/i18n-themes";

export type OrderDocumentKind = "purchase-order" | "invoice";

type PrintableOrder = Omit<
  Pick<
    Order,
    | "orderNumber"
    | "customerName"
    | "customerPhone"
    | "customerNotes"
    | "items"
    | "total"
    | "currency"
    | "status"
    | "createdAt"
  >,
  "createdAt"
> & { createdAt: Date | string | null };

type PrintableStoreSettings = Pick<
  StoreSettings,
  | "storeNameEn"
  | "storeNameAr"
  | "contactPhone"
  | "contactEmail"
  | "addressEn"
  | "addressAr"
>;

const FALLBACK_STORE: PrintableStoreSettings = {
  storeNameEn: "Al Manhaj Company for Stationery",
  storeNameAr: "شركة المنهج للقرطاسية",
  contactPhone: "+218 91-214-5050",
  contactEmail: "info@almanhaj.ly",
  addressEn: "Al Bivi, Tripoli, Libya",
  addressAr: "البيفي، طرابلس، ليبيا",
};

const STATUS_LABELS: Record<OrderStatus, { en: string; ar: string }> = {
  pending: { en: "Awaiting confirmation", ar: "بانتظار التأكيد" },
  confirmed: { en: "Confirmed", ar: "تم التأكيد" },
  preparing: { en: "Preparing", ar: "قيد التجهيز" },
  shipped: { en: "Out for delivery", ar: "في الطريق" },
  delivered: { en: "Delivered", ar: "تم التسليم" },
  cancelled: { en: "Cancelled", ar: "ملغاة" },
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function bilingual(en: string, ar: string, lang: Language): string {
  return lang === "ar" ? `${ar} / ${en}` : `${en} / ${ar}`;
}

function formatAmount(amount: number, currency: string, lang: Language): string {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-LY" : "en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
  const code = currency?.trim().toUpperCase() || "LYD";
  const suffix = code === "LYD" && lang === "ar" ? "د.ل" : code;
  return `${formatted} ${suffix}`;
}

function formatDocumentDate(value: Date | string | null, lang: Language): string {
  const date = value instanceof Date ? value : new Date(value ?? "");
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function itemRow(item: OrderLineItem, index: number, currency: string, lang: Language) {
  const itemName = [item.titleEn, item.titleAr].filter(Boolean).join(" / ");
  return `
    <tr>
      <td class="item-name"><strong dir="auto">${escapeHtml(itemName || item.sku || `Item ${index + 1}`)}</strong></td>
      <td dir="ltr" class="sku">${escapeHtml(item.sku || "—")}</td>
      <td class="number">${escapeHtml(item.quantity)}</td>
      <td dir="ltr" class="number">${escapeHtml(formatAmount(item.unitPrice, currency, lang))}</td>
      <td dir="ltr" class="number total-cell">${escapeHtml(formatAmount(item.lineTotal, currency, lang))}</td>
    </tr>`;
}

export function createOrderDocumentHtml(
  order: PrintableOrder,
  kind: OrderDocumentKind,
  settings: PrintableStoreSettings | null,
  lang: Language,
): string {
  const store = settings ?? FALLBACK_STORE;
  const isArabic = lang === "ar";
  const docTitleEn = kind === "invoice" ? "Invoice" : "Purchase order";
  const docTitleAr = kind === "invoice" ? "فاتورة" : "أمر شراء";
  const documentPrefix = kind === "invoice" ? "INV" : "PO";
  const documentTitle = bilingual(docTitleEn, docTitleAr, lang);
  const documentNumber = `${documentPrefix}-${order.orderNumber}`;
  const status = STATUS_LABELS[order.status];
  const statusLabel = bilingual(status.en, status.ar, lang);
  const currency = order.currency || "LYD";
  const documentDate = formatDocumentDate(order.createdAt, lang);
  const notes = order.customerNotes?.trim()
    ? `<section class="notes"><h2>${escapeHtml(bilingual("Delivery notes", "ملاحظات التوصيل", lang))}</h2><p>${escapeHtml(order.customerNotes).replace(/\n/g, "<br>")}</p></section>`
    : "";
  const totalUnits = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const itemsRows = order.items
    .map((item, index) => itemRow(item, index, currency, lang))
    .join("");
  const footerText = kind === "invoice"
    ? bilingual(
        "Please keep this invoice for your records. Contact us if you have any questions about your order.",
        "يرجى الاحتفاظ بهذه الفاتورة لسجلاتكم. تواصلوا معنا إذا كانت لديكم أي استفسارات حول الطلب.",
        lang,
      )
    : bilingual(
        "This document confirms the items and quantities requested in this order.",
        "تؤكد هذه الوثيقة المنتجات والكميات المطلوبة في هذا الطلب.",
        lang,
      );
  const printLabel = bilingual("Print / Save as PDF", "طباعة / حفظ بصيغة PDF", lang);
  const helpText = bilingual(
    "In the print dialog, choose “Save as PDF” to export a PDF copy.",
    "من نافذة الطباعة، اختر «حفظ بصيغة PDF» لتصدير نسخة PDF.",
    lang,
  );

  return `<!doctype html>
<html lang="${isArabic ? "ar" : "en"}" dir="${isArabic ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(documentTitle)} ${escapeHtml(order.orderNumber)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #202124; font: 12px/1.55 Arial, Tahoma, sans-serif; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 auto 18px; max-width: 900px; padding: 12px 16px; border: 1px solid #d7dee7; border-radius: 10px; background: #f7f9fc; color: #394150; }
    .toolbar p { margin: 0; font-size: 12px; }
    .toolbar button { flex: 0 0 auto; border: 0; border-radius: 7px; padding: 10px 15px; background: #a61f1f; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    .sheet { max-width: 900px; min-height: 260mm; margin: 0 auto; padding: 28px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; padding-bottom: 20px; border-bottom: 3px solid #a61f1f; }
    .brand { min-width: 0; }
    .brand h1 { margin: 0; color: #821919; font-size: 20px; line-height: 1.35; }
    .brand .english-name { margin-top: 2px; color: #4b5563; font-size: 12px; font-weight: 700; }
    .brand p { margin: 3px 0 0; color: #626b76; font-size: 10px; }
    .document-heading { min-width: 185px; text-align: end; }
    .document-heading h2 { margin: 0; color: #202124; font-size: 22px; line-height: 1.35; }
    .document-heading .doc-no { margin: 8px 0 0; color: #a61f1f; font: 700 12px/1.5 Arial, sans-serif; }
    .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .meta-card, .customer-card { padding: 10px 12px; border: 1px solid #e2e6eb; border-radius: 8px; background: #fbfbfc; }
    .label { margin: 0 0 4px; color: #69727d; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
    .value { margin: 0; color: #252a31; font-size: 11px; font-weight: 700; overflow-wrap: anywhere; }
    .customer-card { margin-bottom: 18px; }
    .customer-card h2, .notes h2 { margin: 0 0 8px; font-size: 12px; }
    .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
    .customer-grid p { margin: 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    th { padding: 9px 8px; background: #f2f4f7; color: #434b55; font-size: 9px; text-align: start; }
    td { padding: 10px 8px; border-bottom: 1px solid #e5e8ed; vertical-align: top; font-size: 10px; }
    tbody tr { break-inside: avoid; }
    th:nth-child(1), td:nth-child(1) { width: 38%; }
    th:nth-child(2), td:nth-child(2) { width: 15%; }
    th:nth-child(3), td:nth-child(3) { width: 9%; text-align: center; }
    th:nth-child(4), td:nth-child(4) { width: 18%; }
    th:nth-child(5), td:nth-child(5) { width: 20%; }
    .sku { color: #68717c; font-family: monospace; font-size: 9px; }
    .number { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .total-cell { font-weight: 700; }
    .summary { display: flex; justify-content: flex-end; margin-top: 12px; }
    .summary-box { min-width: 230px; padding: 12px 14px; border-radius: 8px; background: #faf1f1; }
    .summary-line { display: flex; justify-content: space-between; gap: 20px; align-items: baseline; }
    .summary-line span:first-child { font-size: 10px; font-weight: 700; }
    .summary-line strong { color: #821919; font-size: 16px; white-space: nowrap; }
    .units { margin: 4px 0 0; color: #69727d; font-size: 9px; }
    .notes { margin-top: 18px; padding: 12px; border: 1px solid #e2e6eb; border-radius: 8px; }
    .notes p { margin: 0; color: #4d5661; overflow-wrap: anywhere; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e6eb; color: #69727d; font-size: 9px; text-align: center; }
    .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 30px; }
    .signature { min-height: 36px; border-bottom: 1px solid #aeb5bd; }
    .signature-label { margin-top: 5px; color: #69727d; font-size: 9px; }
    [dir="rtl"] .document-heading { text-align: start; }
    @media screen {
      body { padding: 18px; background: #eef1f5; }
      .sheet { border-radius: 10px; box-shadow: 0 8px 32px #17202a14; }
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet { max-width: none; min-height: 0; margin: 0; padding: 0; border: 0; border-radius: 0; box-shadow: none; }
      .meta-card, .customer-card, .summary-box, .notes { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      a { color: inherit; text-decoration: none; }
    }
    @media (max-width: 620px) {
      body { padding: 10px; }
      .toolbar { align-items: flex-start; flex-direction: column; }
      .sheet { min-height: 0; padding: 16px; }
      .header { gap: 14px; }
      .brand h1 { font-size: 16px; }
      .document-heading { min-width: 120px; }
      .document-heading h2 { font-size: 17px; }
      .meta { grid-template-columns: 1fr; }
      .customer-grid { grid-template-columns: 1fr; }
      th, td { padding: 7px 4px; font-size: 8px; }
      th:nth-child(2), td:nth-child(2) { width: 13%; }
      th:nth-child(4), td:nth-child(4) { width: 20%; }
      th:nth-child(5), td:nth-child(5) { width: 22%; }
    }
  </style>
</head>
<body>
  <aside class="toolbar">
    <p>${escapeHtml(helpText)}</p>
    <button type="button" onclick="window.print()">${escapeHtml(printLabel)}</button>
  </aside>
  <main class="sheet">
    <header class="header">
      <div class="brand">
        <h1 dir="auto">${escapeHtml(store.storeNameAr || FALLBACK_STORE.storeNameAr)}</h1>
        <p class="english-name" dir="auto">${escapeHtml(store.storeNameEn || FALLBACK_STORE.storeNameEn)}</p>
        <p dir="auto">${escapeHtml(store.addressAr || FALLBACK_STORE.addressAr)} · ${escapeHtml(store.addressEn || FALLBACK_STORE.addressEn)}</p>
        <p dir="ltr">${escapeHtml(store.contactPhone || FALLBACK_STORE.contactPhone)} · ${escapeHtml(store.contactEmail || FALLBACK_STORE.contactEmail)}</p>
      </div>
      <div class="document-heading">
        <h2>${escapeHtml(documentTitle)}</h2>
        <p class="doc-no" dir="ltr">${escapeHtml(documentNumber)}</p>
      </div>
    </header>

    <section class="meta" aria-label="Document information">
      <div class="meta-card"><p class="label">${escapeHtml(bilingual("Order reference", "رقم الطلب", lang))}</p><p class="value" dir="ltr">${escapeHtml(order.orderNumber)}</p></div>
      <div class="meta-card"><p class="label">${escapeHtml(bilingual("Order date", "تاريخ الطلب", lang))}</p><p class="value">${escapeHtml(documentDate)}</p></div>
      <div class="meta-card"><p class="label">${escapeHtml(bilingual("Status", "الحالة", lang))}</p><p class="value">${escapeHtml(statusLabel)}</p></div>
    </section>

    <section class="customer-card">
      <h2>${escapeHtml(bilingual("Bill to / Customer", "بيانات العميل", lang))}</h2>
      <div class="customer-grid">
        <p><span class="label">${escapeHtml(bilingual("Customer name", "اسم العميل", lang))}</span><br><strong dir="auto">${escapeHtml(order.customerName)}</strong></p>
        <p><span class="label">${escapeHtml(bilingual("Phone", "رقم الهاتف", lang))}</span><br><strong dir="ltr">${escapeHtml(order.customerPhone)}</strong></p>
      </div>
    </section>

    <table>
      <thead><tr>
        <th>${escapeHtml(bilingual("Product", "المنتج", lang))}</th>
        <th>${escapeHtml(bilingual("SKU", "رمز المنتج", lang))}</th>
        <th>${escapeHtml(bilingual("Qty", "الكمية", lang))}</th>
        <th>${escapeHtml(bilingual("Unit price", "سعر الوحدة", lang))}</th>
        <th>${escapeHtml(bilingual("Amount", "الإجمالي", lang))}</th>
      </tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="summary">
      <div class="summary-box">
        <div class="summary-line"><span>${escapeHtml(bilingual("Total due", "الإجمالي المستحق", lang))}</span><strong dir="ltr">${escapeHtml(formatAmount(order.total, currency, lang))}</strong></div>
        <p class="units">${escapeHtml(bilingual(`${totalUnits} item(s)`, `${totalUnits} قطعة`, lang))}</p>
      </div>
    </div>

    ${notes}
    <div class="signature-row">
      <div><div class="signature"></div><p class="signature-label">${escapeHtml(bilingual("Prepared by", "أُعدّت بواسطة", lang))}</p></div>
      <div><div class="signature"></div><p class="signature-label">${escapeHtml(bilingual("Customer signature", "توقيع العميل", lang))}</p></div>
    </div>
    <footer class="footer">${escapeHtml(footerText)}<br>${escapeHtml(store.storeNameEn || FALLBACK_STORE.storeNameEn)} · ${escapeHtml(store.contactEmail || FALLBACK_STORE.contactEmail)}</footer>
  </main>
  <script>
    window.addEventListener("load", function () {
      window.setTimeout(function () { window.print(); }, 350);
    });
  </script>
</body>
</html>`;
}

export function openOrderDocument(
  order: PrintableOrder,
  kind: OrderDocumentKind,
  settings: PrintableStoreSettings | null,
  lang: Language,
): boolean {
  if (typeof window === "undefined") return false;
  const printWindow = window.open("", "_blank", "width=920,height=760");
  if (!printWindow) {
    window.alert(
      lang === "ar"
        ? "يرجى السماح بالنوافذ المنبثقة لفتح مستند الطباعة."
        : "Allow pop-ups to open the printable order document.",
    );
    return false;
  }

  try {
    printWindow.document.open();
    printWindow.document.write(createOrderDocumentHtml(order, kind, settings, lang));
    printWindow.document.close();
    printWindow.focus();
    printWindow.opener = null;
    return true;
  } catch {
    printWindow.close();
    window.alert(
      lang === "ar"
        ? "تعذر فتح مستند الطباعة. حاول مرة أخرى."
        : "Couldn't open the printable document. Please try again.",
    );
    return false;
  }
}
