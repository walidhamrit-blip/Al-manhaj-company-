"use client";

import React, { useState } from "react";
import { UI_TEXT, type Language, type ThemeConfig } from "@/lib/i18n-themes";
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Phone,
  AlertTriangle,
} from "lucide-react";

interface WhatsAppOrderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  message: string;
  lang: Language;
  theme: ThemeConfig;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function WhatsAppOrderPanel({
  isOpen,
  onClose,
  phoneNumber,
  message,
  lang,
  theme,
}: WhatsAppOrderPanelProps) {
  const t = UI_TEXT[lang];
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  const displayNumber = cleanNumber.startsWith("218")
    ? cleanNumber
    : "218" + cleanNumber;
  const fullNumber = `+${displayNumber}`;
  const messageBytes = new Blob([message]).size;

  const handleCopyPhone = async () => {
    const ok = await copyToClipboard(fullNumber);
    if (ok) {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2200);
    }
  };

  const handleCopyMessage = async () => {
    const ok = await copyToClipboard(message);
    if (ok) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2200);
    }
  };

  const handleCopyBoth = async () => {
    const ok = await copyToClipboard(
      `${lang === "ar" ? "رقم الواتساب" : "WhatsApp"}: ${fullNumber}\n\n${message}`
    );
    if (ok) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        style={{
          backgroundColor: theme.colors.bgElevated,
          color: theme.colors.textPrimary,
          borderColor: theme.colors.border,
        }}
        className="relative z-10 w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div
          style={{ backgroundColor: "#25D366" }}
          className="flex items-center gap-3 p-5 text-white"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="h-6 w-6 fill-current" />
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-extrabold">
              {lang === "ar"
                ? "إرسال الطلب عبر واتساب"
                : "Send Order via WhatsApp"}
            </h2>
            <p className="text-white/80 text-xs">
              {lang === "ar"
                ? "انسخ الرسالة والرقم ثم افتح واتساب والصقهما"
                : "Copy the message & number, open WhatsApp, paste and send"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition"
            aria-label={t.closeBtn}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Step-by-step instructions */}
          <div
            style={{
              backgroundColor: theme.colors.bgSecondary,
              borderColor: theme.colors.border,
            }}
            className="rounded-2xl border p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
              {lang === "ar" ? "خطوات الإرسال" : "How to send"}
            </p>
            <ol className="space-y-2 text-xs sm:text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span
                  style={{
                    backgroundColor: "#25D366",
                    color: "#FFFFFF",
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                >
                  1
                </span>
                <span>
                  {lang === "ar"
                    ? "انسخ الرسالة الكاملة بالأسفل"
                    : "Copy the full message below"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  style={{
                    backgroundColor: "#25D366",
                    color: "#FFFFFF",
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                >
                  2
                </span>
                <span>
                  {lang === "ar"
                    ? "افتح تطبيق واتساب على هاتفك"
                    : "Open WhatsApp on your phone"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  style={{
                    backgroundColor: "#25D366",
                    color: "#FFFFFF",
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                >
                  3
                </span>
                <span>
                  {lang === "ar"
                    ? `أضف جهة اتصال جديدة باسم "شركة المنهج للقرطاسية" على الرقم ${fullNumber}`
                    : `Add new contact "Al Manhaj Company for Stationery" at ${fullNumber}`}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  style={{
                    backgroundColor: "#25D366",
                    color: "#FFFFFF",
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                >
                  4
                </span>
                <span>
                  {lang === "ar"
                    ? "الصق الرسالة وأرسلها مباشرة"
                    : "Paste the message and send it"}
                </span>
              </li>
            </ol>
          </div>

          {/* Phone Number Card */}
          <div
            style={{
              backgroundColor: theme.colors.bgSecondary,
              borderColor: theme.colors.border,
            }}
            className="rounded-2xl border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {lang === "ar" ? "رقم الواتساب" : "WhatsApp Number"}
              </span>
              <button
                type="button"
                onClick={handleCopyPhone}
                style={{
                  backgroundColor: copiedPhone
                    ? "#16a34a"
                    : theme.colors.badgeBg,
                  color: copiedPhone ? "#FFFFFF" : theme.colors.badgeText,
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
              >
                {copiedPhone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>
                  {copiedPhone
                    ? lang === "ar"
                      ? "تم النسخ!"
                      : "Copied!"
                    : lang === "ar"
                      ? "نسخ الرقم"
                      : "Copy Number"}
                </span>
              </button>
            </div>
            <div dir="ltr" className="flex items-center gap-2">
              <Phone
                className="h-5 w-5 shrink-0"
                style={{ color: "#25D366" }}
              />
              <span className="text-xl sm:text-2xl font-black tracking-wide tabular-nums">
                {fullNumber}
              </span>
            </div>
          </div>

          {/* Message Preview */}
          <div
            style={{
              backgroundColor: theme.colors.bgSecondary,
              borderColor: theme.colors.border,
            }}
            className="rounded-2xl border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {lang === "ar"
                  ? `نص الرسالة (${(messageBytes / 1024).toFixed(1)} KB)`
                  : `Order Message (${(messageBytes / 1024).toFixed(1)} KB)`}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-xl bg-white/90 border border-black/10 p-3 text-xs leading-relaxed whitespace-pre-wrap font-mono text-slate-800">
              {message}
            </div>
            <button
              type="button"
              onClick={handleCopyMessage}
              style={{
                backgroundColor: copiedMessage
                  ? "#16a34a"
                  : theme.colors.badgeBg,
                color: copiedMessage ? "#FFFFFF" : theme.colors.badgeText,
              }}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-extrabold transition hover:opacity-90"
            >
              {copiedMessage ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>
                {copiedMessage
                  ? lang === "ar"
                    ? "تم نسخ الرسالة ✓"
                    : "Message copied ✓"
                  : lang === "ar"
                    ? "📋 نسخ الرسالة الكاملة"
                    : "📋 Copy Full Message"}
              </span>
            </button>
          </div>

          {/* Safety reminder */}
          <div
            style={{
              backgroundColor: theme.colors.badgeBg,
              color: theme.colors.badgeText,
            }}
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs font-medium"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {lang === "ar"
                ? "سيتم الرد على طلبكم خلال ساعات العمل (السبت – الخميس: 09:00 – 21:00)."
                : "Your order will be answered during working hours (Sat – Thu: 09:00 – 21:00)."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
