"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileText,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { Order, OrderStatus, StoreSettings } from "@/db/schema";
import { openOrderDocument } from "@/lib/order-documents";
import {
  ORDER_STATUSES,
  getOrderStatusLabel,
} from "@/lib/orders";
import {
  UI_TEXT,
  formatPrice,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";

interface OrdersAdminPanelProps {
  adminToken: string;
  lang: Language;
  theme: ThemeConfig;
  storeSettings: StoreSettings | null;
}

type AdminOrder = Omit<Order, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type OrderFilter = "all" | "pending" | "inProgress" | "shipped" | "delivered";

function formatDate(value: string | Date, lang: Language): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-LY" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

export function OrdersAdminPanel({
  adminToken,
  lang,
  theme,
  storeSettings,
}: OrdersAdminPanelProps) {
  const t = UI_TEXT[lang];
  const isAr = lang === "ar";
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const loadOrders = useCallback(
    async (quiet = false) => {
      if (!adminToken) return;
      if (quiet) setIsRefreshing(true);
      else setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
          headers: { "x-admin-token": adminToken },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || t.ordersLoadError);
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        setLoadError(t.ordersLoadError);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [adminToken, t.ordersLoadError]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrders(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      inProgress: orders.filter((order) =>
        ["confirmed", "preparing"].includes(order.status)
      ).length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);
    return orders.filter((order) => {
      if (filter === "pending" && order.status !== "pending") return false;
      if (
        filter === "inProgress" &&
        !["confirmed", "preparing"].includes(order.status)
      )
        return false;
      if (filter === "shipped" && order.status !== "shipped") return false;
      if (filter === "delivered" && order.status !== "delivered") return false;
      if (!normalizedQuery) return true;
      const searchable = normalizeQuery(
        [
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          order.customerPhoneNormalized,
          ...order.items.flatMap((item) => [item.titleEn, item.titleAr, item.sku]),
        ].join(" ")
      );
      return normalizedQuery.split(/\s+/).every((word) => searchable.includes(word));
    });
  }, [orders, filter, query]);

  const handleStatusChange = async (order: AdminOrder, nextStatus: OrderStatus) => {
    if (order.status === nextStatus) return;
    setSavingOrderId(order.id);
    setToast("");
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.order) throw new Error(data.error || t.ordersUpdateFailed);
      setOrders((current) =>
        current.map((entry) => (entry.id === order.id ? data.order : entry))
      );
      setToast(
        isAr
          ? `تم تحديث حالة الطلب ${order.orderNumber}`
          : `Updated ${order.orderNumber}`
      );
      window.setTimeout(() => setToast(""), 2400);
    } catch {
      setToast(t.ordersUpdateFailed);
      window.setTimeout(() => setToast(""), 3000);
    } finally {
      setSavingOrderId(null);
    }
  };

  const filters: { id: OrderFilter; label: string; count: number }[] = [
    { id: "all", label: t.ordersFilterAll, count: counts.all },
    { id: "pending", label: t.ordersFilterPending, count: counts.pending },
    { id: "inProgress", label: t.ordersFilterInProgress, count: counts.inProgress },
    { id: "shipped", label: t.ordersFilterShipped, count: counts.shipped },
    { id: "delivered", label: t.ordersFilterDelivered, count: counts.delivered },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            style={{ color: theme.colors.accentPrimary }}
            className="mb-1 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em]"
          >
            <ClipboardList className="h-4 w-4" />
            {isAr ? "المبيعات والتوصيل" : "SALES & FULFILMENT"}
          </div>
          <h3 className="text-xl font-black">{t.ordersManagerTitle}</h3>
          <p
            style={{ color: theme.colors.textSecondary }}
            className="mt-1 max-w-2xl text-xs leading-5"
          >
            {t.ordersManagerSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{ color: theme.colors.textSecondary }}
            className="text-xs font-semibold"
          >
            {orders.length} {t.ordersCountLabel}
          </span>
          <button
            type="button"
            onClick={() => void loadOrders(true)}
            disabled={isLoading || isRefreshing}
            style={{
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition hover:opacity-80 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t.ordersRefresh}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label={t.ordersFilterAll}
          value={counts.all}
          icon={ShoppingBag}
          color="#2563EB"
          theme={theme}
        />
        <SummaryCard
          label={t.ordersFilterPending}
          value={counts.pending}
          icon={Clock3}
          color="#D97706"
          theme={theme}
        />
        <SummaryCard
          label={t.ordersFilterShipped}
          value={counts.shipped}
          icon={Truck}
          color="#C62828"
          theme={theme}
        />
        <SummaryCard
          label={t.ordersFilterDelivered}
          value={counts.delivered}
          icon={CheckCircle2}
          color="#059669"
          theme={theme}
        />
      </div>

      <div
        style={{
          backgroundColor: theme.colors.bgElevated,
          borderColor: theme.colors.border,
        }}
        className="space-y-3 rounded-2xl border p-3 shadow-sm sm:p-4"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search
              style={{ color: theme.colors.textSecondary }}
              className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.ordersSearchPlaceholder}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              }}
              className="w-full rounded-xl border py-2.5 ps-9 pe-3 text-xs outline-none focus:ring-2"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                style={
                  filter === item.id
                    ? {
                        backgroundColor: theme.colors.accentPrimary,
                        color: "#FFFFFF",
                        borderColor: theme.colors.accentPrimary,
                      }
                    : {
                        backgroundColor: theme.colors.bgSecondary,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                      }
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition"
              >
                <span>{item.label}</span>
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] tabular-nums">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {toast && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-xs font-bold ${
              toast === t.ordersUpdateFailed
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {toast}
          </p>
        )}

        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-semibold text-rose-700">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </span>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="shrink-0 underline underline-offset-2"
            >
              {t.ordersRefresh}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold opacity-65">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {t.ordersLoading}
          </div>
        ) : orders.length === 0 && !loadError ? (
          <div
            style={{
              backgroundColor: theme.colors.bgSecondary,
              borderColor: theme.colors.border,
            }}
            className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center"
          >
            <span
              style={{
                backgroundColor: theme.colors.bgElevated,
                color: theme.colors.accentPrimary,
              }}
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
            >
              <Package className="h-6 w-6" />
            </span>
            <h4 className="text-sm font-extrabold">{t.ordersEmptyTitle}</h4>
            <p
              style={{ color: theme.colors.textSecondary }}
              className="mt-1 max-w-md text-xs leading-5"
            >
              {t.ordersEmptySub}
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center text-center">
            <Search className="mb-2 h-6 w-6 opacity-30" />
            <p className="text-sm font-bold">
              {isAr ? "لا توجد نتائج مطابقة" : "No matching orders"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: theme.colors.border }}>
            <table className="w-full min-w-[980px] border-collapse text-start">
              <thead
                style={{
                  backgroundColor: theme.colors.bgSecondary,
                  color: theme.colors.textSecondary,
                }}
                className="text-[10px] font-extrabold uppercase tracking-wider"
              >
                <tr>
                  <th className="px-3 py-3 text-start">{t.ordersTableOrder}</th>
                  <th className="px-3 py-3 text-start">{t.ordersTableCustomer}</th>
                  <th className="px-3 py-3 text-start">{t.ordersTableDate}</th>
                  <th className="px-3 py-3 text-center">{t.ordersTableItems}</th>
                  <th className="px-3 py-3 text-end">{t.ordersTableTotal}</th>
                  <th className="px-3 py-3 text-start">{t.ordersTableStatus}</th>
                  <th className="px-3 py-3 text-end">{t.ordersTableActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const totalUnits = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );
                  const phoneForWhatsApp = order.customerPhone.replace(/\D/g, "");
                  const message = isAr
                    ? `مرحباً ${order.customerName}، نتواصل معك بخصوص طلبك ${order.orderNumber} من شركة المنهج.`
                    : `Hello ${order.customerName}, we're contacting you about your order ${order.orderNumber} from Al Manhaj.`;

                  return (
                    <FragmentOrderRow
                      key={order.id}
                      order={order}
                      isExpanded={isExpanded}
                      totalUnits={totalUnits}
                      saving={savingOrderId === order.id}
                      lang={lang}
                      theme={theme}
                      storeSettings={storeSettings}
                      onToggle={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                      onStatusChange={(status) => void handleStatusChange(order, status)}
                      onContactUrl={
                        phoneForWhatsApp
                          ? `https://wa.me/${phoneForWhatsApp}?text=${encodeURIComponent(message)}`
                          : undefined
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <p
            style={{ color: theme.colors.textSecondary }}
            className="text-[10px] leading-4"
          >
            {isAr
              ? "تعرض اللوحة أحدث 300 طلب. تحديث الحالة يظهر فوراً في صفحة التتبع."
              : "Showing the latest 300 orders. Status updates appear immediately on the customer tracking page."}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  theme,
}: {
  label: string;
  value: number;
  icon: typeof ShoppingBag;
  color: string;
  theme: ThemeConfig;
}) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.bgElevated,
        borderColor: theme.colors.border,
      }}
      className="flex items-center gap-3 rounded-xl border p-3 sm:p-4"
    >
      <span
        style={{ backgroundColor: `${color}16`, color }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p
          style={{ color: theme.colors.textSecondary }}
          className="truncate text-[10px] font-bold leading-4"
        >
          {label}
        </p>
        <p className="text-lg font-black tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function FragmentOrderRow({
  order,
  isExpanded,
  totalUnits,
  saving,
  lang,
  theme,
  storeSettings,
  onToggle,
  onStatusChange,
  onContactUrl,
}: {
  order: AdminOrder;
  isExpanded: boolean;
  totalUnits: number;
  saving: boolean;
  lang: Language;
  theme: ThemeConfig;
  storeSettings: StoreSettings | null;
  onToggle: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onContactUrl?: string;
}) {
  const t = UI_TEXT[lang];
  const isAr = lang === "ar";
  const phoneHref = `tel:${order.customerPhone.replace(/[^+\d]/g, "")}`;

  return (
    <>
      <tr
        style={{ borderColor: theme.colors.border }}
        className="border-t align-middle text-xs transition hover:bg-black/[0.02]"
      >
        <td className="px-3 py-3">
          <div dir="ltr" className="font-mono text-xs font-extrabold tracking-wide">
            {order.orderNumber}
          </div>
        </td>
        <td className="px-3 py-3">
          <p className="max-w-48 truncate font-bold">{order.customerName}</p>
          <a
            href={phoneHref}
            dir="ltr"
            className="mt-1 inline-flex text-[10px] font-mono opacity-65 hover:underline"
          >
            {order.customerPhone}
          </a>
        </td>
        <td
          style={{ color: theme.colors.textSecondary }}
          className="px-3 py-3 text-[11px] tabular-nums"
        >
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {formatDate(order.createdAt, lang)}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 font-bold tabular-nums">
            <Package className="h-3 w-3 opacity-60" />
            {totalUnits}
          </span>
        </td>
        <td dir="ltr" className="px-3 py-3 text-end font-extrabold tabular-nums">
          {formatPrice(Number(order.total), lang)}
        </td>
        <td className="px-3 py-3">
          <div className="relative w-44">
            <select
              value={order.status}
              disabled={saving}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
              aria-label={`${t.ordersTableStatus}: ${order.orderNumber}`}
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              }}
              className="w-full appearance-none rounded-lg border py-2 ps-2.5 pe-7 text-[10px] font-extrabold outline-none disabled:opacity-60"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getOrderStatusLabel(status, lang)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-55" />
          </div>
        </td>
        <td className="px-3 py-3 text-end">
          <button
            type="button"
            onClick={onToggle}
            style={{
              color: theme.colors.accentPrimary,
              backgroundColor: theme.colors.bgSecondary,
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-extrabold transition hover:opacity-80"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {isExpanded ? t.ordersHideDetails : t.ordersShowDetails}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ borderColor: theme.colors.border }} className="border-t">
          <td colSpan={7} className="px-3 py-4">
            <div
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
              }}
              className="rounded-xl border p-3 sm:p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold">{t.orderDetails}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {onContactUrl && (
                    <a
                      href={onContactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-[10px] font-extrabold text-white hover:opacity-90"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t.ordersContactCustomer}
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </a>
                  )}
                  <a
                    href={phoneHref}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold"
                    style={{ borderColor: theme.colors.border }}
                  >
                    {order.customerPhone}
                  </a>
                </div>
              </div>
              {["preparing", "shipped", "delivered"].includes(order.status) && (
                <div
                  style={{
                    backgroundColor: theme.colors.bgElevated,
                    borderColor: theme.colors.border,
                  }}
                  className="mb-3 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <FileText
                      style={{ color: theme.colors.accentPrimary }}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <div>
                      <p className="text-[11px] font-extrabold">
                        {isAr ? "مستندات الطلب" : "Order documents"}
                      </p>
                      <p
                        style={{ color: theme.colors.textSecondary }}
                        className="mt-0.5 text-[10px] leading-4"
                      >
                        {isAr
                          ? "اطبع المستند أو اختر «حفظ بصيغة PDF» من نافذة الطباعة."
                          : "Print the document or choose “Save as PDF” in the print dialog."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openOrderDocument(order, "purchase-order", storeSettings, lang)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-extrabold text-white transition hover:opacity-90"
                      style={{ backgroundColor: theme.colors.accentPrimary }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {isAr ? "أمر شراء · PDF" : "Purchase order · PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openOrderDocument(order, "invoice", storeSettings, lang)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-extrabold transition hover:opacity-80"
                      style={{
                        borderColor: theme.colors.border,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {isAr ? "فاتورة · PDF" : "Invoice · PDF"}
                    </button>
                  </div>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    style={{
                      backgroundColor: theme.colors.bgElevated,
                      borderColor: theme.colors.border,
                    }}
                    className="flex items-center gap-2.5 rounded-lg border p-2.5"
                  >
                    <img
                      src={item.imageUrl || "/images/new/main-storefront-hq.jpg"}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[11px] font-bold">
                        {isAr ? item.titleAr : item.titleEn}
                      </p>
                      <p
                        style={{ color: theme.colors.textSecondary }}
                        className="mt-1 text-[10px]"
                      >
                        {item.sku} · {item.quantity} × {formatPrice(Number(item.unitPrice), lang)}
                      </p>
                    </div>
                    <span dir="ltr" className="shrink-0 text-[11px] font-extrabold tabular-nums">
                      {formatPrice(Number(item.lineTotal), lang)}
                    </span>
                  </div>
                ))}
              </div>
              {order.customerNotes && (
                <div
                  style={{
                    borderColor: theme.colors.border,
                    color: theme.colors.textSecondary,
                  }}
                  className="mt-3 border-t pt-3 text-[11px] leading-5"
                >
                  <span className="font-extrabold text-inherit">
                    {isAr ? "ملاحظات التوصيل: " : "Delivery notes: "}
                  </span>
                  {order.customerNotes}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
