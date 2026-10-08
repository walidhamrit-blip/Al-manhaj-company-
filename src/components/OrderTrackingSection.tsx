"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Package,
  PackageSearch,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import type {
  OrderLineItem,
  OrderStatus,
  OrderStatusEvent,
} from "@/db/schema";
import {
  ORDER_STATUS_DESCRIPTIONS,
  getOrderStatusLabel,
} from "@/lib/orders";
import { CatalogPhoto } from "@/components/CatalogPhoto";
import {
  UI_TEXT,
  formatPrice,
  type Language,
  type ThemeConfig,
} from "@/lib/i18n-themes";

interface TrackedOrder {
  orderNumber: string;
  items: OrderLineItem[];
  total: number;
  currency: string;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  createdAt: string;
}

export interface OrderTrackingRequest {
  orderNumber: string;
  phone: string;
  requestId: number;
}

interface OrderTrackingSectionProps {
  lang: Language;
  theme: ThemeConfig;
  trackingRequest?: OrderTrackingRequest | null;
}

const PROGRESS_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

function formatDate(value: string | Date, lang: Language): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function OrderTrackingSection({
  lang,
  theme,
  trackingRequest,
}: OrderTrackingSectionProps) {
  const t = UI_TEXT[lang];
  const isAr = lang === "ar";
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const findOrder = useCallback(
    async (reference: string, customerPhone: string) => {
      if (!reference.trim() || !customerPhone.trim()) {
        setErrorMessage(t.trackingNotFound);
        setOrder(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setOrder(null);
      try {
        const params = new URLSearchParams({
          orderNumber: reference.trim(),
          phone: customerPhone.trim(),
        });
        const response = await fetch(`/api/orders/track?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.order) {
          setErrorMessage(
            response.status === 404 || response.status === 400
              ? t.trackingNotFound
              : t.trackingUnavailable
          );
          return;
        }
        setOrder(data.order as TrackedOrder);
      } catch {
        setErrorMessage(t.trackingUnavailable);
      } finally {
        setIsLoading(false);
      }
    },
    [t.trackingNotFound, t.trackingUnavailable]
  );

  useEffect(() => {
    if (!trackingRequest) return;
    const timer = window.setTimeout(() => {
      setOrderNumber(trackingRequest.orderNumber);
      setPhone(trackingRequest.phone);
      void findOrder(trackingRequest.orderNumber, trackingRequest.phone);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [trackingRequest, findOrder]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void findOrder(orderNumber, phone);
  };

  const statusEvents = order?.statusHistory || [];
  const lastProgressStatus =
    order?.status === "cancelled"
      ? [...statusEvents]
          .reverse()
          .find((event) => event.status !== "cancelled")?.status || "pending"
      : order?.status || "pending";
  const progressIndex = PROGRESS_STATUSES.indexOf(lastProgressStatus);
  const latestStatusText = order ? getOrderStatusLabel(order.status, lang) : "";
  const latestDescription = order
    ? ORDER_STATUS_DESCRIPTIONS[order.status][lang]
    : "";
  const latestEvent = order
    ? [...statusEvents].reverse().find((event) => event.status === order.status)
    : undefined;

  return (
    <section
      id="order-tracking"
      style={{
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary,
        borderColor: theme.colors.border,
      }}
      className="scroll-mt-24 border-t px-3 py-12 sm:px-5 sm:py-16"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div
              style={{ color: theme.colors.accentPrimary }}
              className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em]"
            >
              <PackageSearch className="h-4 w-4" />
              {isAr ? "خدمة متابعة الطلبات" : "ORDER CARE"}
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t.trackOrderTitle}
            </h2>
            <p
              style={{ color: theme.colors.textSecondary }}
              className="mt-2 max-w-xl text-sm leading-6"
            >
              {t.trackOrderSubtitle}
            </p>
          </div>
          <div
            style={{
              backgroundColor: theme.colors.bgSecondary,
              borderColor: theme.colors.border,
              color: theme.colors.textSecondary,
            }}
            className="flex max-w-md items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-5"
          >
            <ClipboardCheck
              style={{ color: theme.colors.accentPrimary }}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{t.trackOrderPrivacy}</span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
          <div
            style={{
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.colors.border,
            }}
            className="h-fit rounded-2xl border p-4 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <div
                style={{
                  backgroundColor: theme.colors.badgeBg,
                  color: theme.colors.badgeText,
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl"
              >
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold">{t.trackOrderTitle}</h3>
                <p
                  style={{ color: theme.colors.textSecondary }}
                  className="mt-0.5 text-xs"
                >
                  {isAr ? "أدخل بيانات الطلب" : "Enter your order details"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="tracking-reference"
                  className="mb-1.5 block text-xs font-bold"
                >
                  {t.orderNumberLabel}
                </label>
                <input
                  id="tracking-reference"
                  type="text"
                  required
                  autoComplete="off"
                  dir="ltr"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
                  placeholder={t.orderNumberPlaceholder}
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  }}
                  className="w-full rounded-xl border px-3.5 py-3 text-sm font-bold tracking-wide outline-none transition focus:ring-2"
                />
              </div>

              <div>
                <label
                  htmlFor="tracking-phone"
                  className="mb-1.5 block text-xs font-bold"
                >
                  {t.orderPhoneLabel}
                </label>
                <input
                  id="tracking-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t.orderPhonePlaceholder}
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  }}
                  className="w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-2"
                />
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold leading-5 text-rose-700"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: theme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? (
                  <Clock3 className="h-4 w-4 animate-pulse" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>{isLoading ? t.trackingLoading : t.trackOrderBtn}</span>
              </button>
            </form>

            <div
              style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
              className="mt-5 border-t pt-4 text-[11px] leading-5"
            >
              {isAr
                ? "يتم تحديث الحالة من فريق المتجر عند تأكيد الطلب وتجهيزه للتوصيل."
                : "Our team updates your order as it is confirmed, prepared and delivered."}
            </div>
          </div>

          <div
            style={{
              backgroundColor: theme.colors.bgElevated,
              borderColor: theme.colors.border,
            }}
            className="min-h-[300px] rounded-2xl border p-4 shadow-sm sm:p-6"
            aria-live="polite"
          >
            {order ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: theme.colors.border }}>
                  <div>
                    <p
                      style={{ color: theme.colors.textSecondary }}
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    >
                      {t.orderStatus}
                    </p>
                    <h3 dir="ltr" className="mt-1 text-xl font-black tracking-wide">
                      {order.orderNumber}
                    </h3>
                    <p
                      style={{ color: theme.colors.textSecondary }}
                      className="mt-1 text-xs"
                    >
                      {t.orderDate}: {formatDate(order.createdAt, lang)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                      order.status === "cancelled"
                        ? "bg-rose-100 text-rose-700"
                        : order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status === "cancelled" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : order.status === "delivered" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Truck className="h-3.5 w-3.5" />
                    )}
                    {latestStatusText}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor:
                      order.status === "cancelled"
                        ? "#FFF1F2"
                        : theme.colors.bgSecondary,
                    borderColor:
                      order.status === "cancelled"
                        ? "#FECDD3"
                        : theme.colors.border,
                  }}
                  className="rounded-xl border p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        order.status === "cancelled"
                          ? "bg-rose-100 text-rose-600"
                          : "bg-white text-emerald-600"
                      }`}
                    >
                      {order.status === "cancelled" ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{latestStatusText}</p>
                      <p className="mt-1 text-xs leading-5 opacity-75">
                        {latestDescription}
                      </p>
                      {latestEvent && (
                        <p className="mt-2 text-[10px] font-semibold opacity-60">
                          {formatDate(latestEvent.at, lang)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {order.status === "cancelled" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700">
                    {ORDER_STATUS_DESCRIPTIONS.cancelled[lang]}
                  </div>
                ) : (
                  <div>
                    <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider opacity-75">
                      {isAr ? "مراحل الطلب" : "Order progress"}
                    </h4>
                    <ol className="space-y-0">
                      {PROGRESS_STATUSES.map((status, index) => {
                        const isComplete = index < progressIndex;
                        const isCurrent = status === order.status;
                        const event = [...statusEvents]
                          .reverse()
                          .find((item) => item.status === status);
                        return (
                          <li key={status} className="relative flex min-h-[58px] gap-3">
                            {index < PROGRESS_STATUSES.length - 1 && (
                              <span
                                style={{
                                  backgroundColor:
                                    index < progressIndex
                                      ? theme.colors.accentPrimary
                                      : theme.colors.border,
                                }}
                                className="absolute start-[9px] top-5 h-[calc(100%-8px)] w-px"
                              />
                            )}
                            <span
                              style={{
                                backgroundColor:
                                  isCurrent || isComplete
                                    ? theme.colors.accentPrimary
                                    : theme.colors.bgSecondary,
                                color:
                                  isCurrent || isComplete
                                    ? "#FFFFFF"
                                    : theme.colors.textSecondary,
                                borderColor: theme.colors.border,
                              }}
                              className="relative z-[1] mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                            >
                              {isComplete ? (
                                <Check className="h-3 w-3" />
                              ) : isCurrent ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-35" />
                              )}
                            </span>
                            <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pb-3">
                              <div>
                                <p className={`text-xs ${isCurrent ? "font-extrabold" : "font-semibold opacity-75"}`}>
                                  {getOrderStatusLabel(status, lang)}
                                </p>
                                {(isCurrent || isComplete) && (
                                  <p
                                    style={{ color: theme.colors.textSecondary }}
                                    className="mt-0.5 text-[10px] leading-4"
                                  >
                                    {ORDER_STATUS_DESCRIPTIONS[status][lang]}
                                  </p>
                                )}
                              </div>
                              {event && (
                                <time
                                  className="shrink-0 pt-0.5 text-[10px] tabular-nums opacity-60"
                                  dateTime={event.at}
                                >
                                  {formatDate(event.at, lang)}
                                </time>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                  }}
                  className="rounded-xl border p-3.5"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h4 className="text-xs font-extrabold">{t.orderDetails}</h4>
                    <span dir="ltr" className="text-sm font-black tabular-nums">
                      {formatPrice(Number(order.total), lang)}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: theme.colors.border }}>
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        style={{ borderColor: theme.colors.border }}
                        className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
                      >
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-black/10">
                          <CatalogPhoto
                            src={item.imageUrl || "/images/new/main-storefront-hq.jpg"}
                            alt=""
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold">
                            {isAr ? item.titleAr : item.titleEn}
                          </p>
                          <p
                            style={{ color: theme.colors.textSecondary }}
                            className="mt-0.5 text-[10px]"
                          >
                            {item.quantity} × {formatPrice(Number(item.unitPrice), lang)}
                          </p>
                        </div>
                        <span dir="ltr" className="shrink-0 text-xs font-extrabold tabular-nums">
                          {formatPrice(Number(item.lineTotal), lang)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[265px] flex-col items-center justify-center px-3 py-8 text-center">
                <div
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    color: theme.colors.accentPrimary,
                  }}
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                >
                  <PackageSearch className="h-7 w-7" />
                </div>
                <h3 className="text-base font-extrabold">
                  {isAr ? "حالة طلبك في مكان واحد" : "Your order, all in one place"}
                </h3>
                <p
                  style={{ color: theme.colors.textSecondary }}
                  className="mt-2 max-w-md text-xs leading-5"
                >
                  {isAr
                    ? "بعد إرسال طلبك، ستجد رقم التتبع في رسالة واتساب. أدخل الرقم ورقم هاتفك هنا لمشاهدة مراحل التجهيز والتوصيل."
                    : "After placing an order, use the reference from your WhatsApp order message together with your phone number to see every delivery update."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {["pending", "preparing", "shipped", "delivered"].map((status) => {
                    const Icon =
                      status === "shipped"
                        ? Truck
                        : status === "delivered"
                          ? CheckCircle2
                          : status === "preparing"
                            ? Package
                            : Clock3;
                    return (
                      <span
                        key={status}
                        style={{
                          backgroundColor: theme.colors.bgSecondary,
                          color: theme.colors.textSecondary,
                          borderColor: theme.colors.border,
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold"
                      >
                        <Icon className="h-3 w-3" />
                        {getOrderStatusLabel(status as OrderStatus, lang)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
