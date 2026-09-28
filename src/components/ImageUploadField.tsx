"use client";

import React, { useRef, useState } from "react";
import type { Language, ThemeConfig } from "@/lib/i18n-themes";
import {
  UploadCloud,
  ImagePlus,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  adminToken: string;
  lang: Language;
  theme: ThemeConfig;
  required?: boolean;
  optional?: boolean;
}

const MAX_DIMENSION = 1600;
// "image/*" is the most compatible value: specific MIME lists make some
// Android / Windows pickers grey out perfectly valid .jpg files.
const ACCEPTED = "image/*";
const IMAGE_EXTENSIONS = /\.(jpe?g|jfif|pjpeg|png|webp|gif|avif|bmp)$/i;
const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

type DecodedImage = { source: CanvasImageSource; width: number; height: number; release: () => void };

/** Decode an image file with createImageBitmap, falling back to <img>. */
async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close?.(),
      };
    } catch {
      /* fall back to HTMLImageElement */
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = objectUrl;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

/**
 * Normalise any photo into a clean, web-friendly file:
 * - re-encodes to JPEG (PNG kept for transparency, GIF kept for animation)
 * - fixes the "image/jpg" / empty MIME type problem from some phones
 * - resizes large camera photos to max 1600px
 * If the browser cannot decode the file, the original bytes are sent and the
 * server detects the real format from the file content.
 */
async function normalizeImage(file: File): Promise<Blob> {
  const lowerName = file.name.toLowerCase();
  if (file.type === "image/gif" || lowerName.endsWith(".gif")) return file;

  let decoded: DecodedImage | null = null;
  try {
    decoded = await decodeImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const keepPng = file.type === "image/png" || lowerName.endsWith(".png");
    if (!keepPng) {
      // JPEG has no transparency: paint a white background first.
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(decoded.source, 0, 0, width, height);

    const outType = keepPng ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outType, keepPng ? undefined : 0.86)
    );
    return blob && blob.size > 0 ? blob : file;
  } catch {
    return file;
  } finally {
    decoded?.release();
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  adminToken,
  lang,
  theme,
  required,
  optional,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<{ name: string; size: number } | null>(
    null
  );

  const isAr = lang === "ar";

  const uploadFile = async (rawFile: File) => {
    setError(null);

    const name = rawFile.name || "photo.jpg";
    const looksLikeImage =
      rawFile.type.startsWith("image/") ||
      IMAGE_EXTENSIONS.test(name) ||
      HEIC_EXTENSIONS.test(name) ||
      rawFile.type === "" ||
      rawFile.type === "application/octet-stream";

    if (!looksLikeImage) {
      setError(isAr ? "الرجاء اختيار ملف صورة (JPG أو PNG)." : "Please choose an image file (JPG or PNG).");
      return;
    }
    if (rawFile.size === 0) {
      setError(isAr ? "الملف فارغ." : "The selected file is empty.");
      return;
    }
    if (!adminToken) {
      setError(
        isAr
          ? "انتهت جلسة الإدارة، الرجاء تسجيل الدخول من جديد."
          : "Admin session expired — please log in again."
      );
      return;
    }

    setIsUploading(true);
    try {
      const normalized = await normalizeImage(rawFile);
      const baseName = name.replace(/\.[^.]+$/, "") || "photo";
      const ext = normalized.type === "image/png" ? "png" : normalized.type === "image/gif" ? "gif" : "jpg";
      const uploadName = normalized === rawFile ? name : `${baseName}.${ext}`;

      // 1) JSON + base64: survives proxies that mangle multipart bodies / custom headers.
      let res: Response | null = null;
      try {
        const dataUrl = await blobToDataUrl(normalized);
        res = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: adminToken, name: uploadName, data: dataUrl }),
        });
      } catch {
        res = null;
      }

      // 2) Fallback: classic multipart upload.
      if (!res || res.status >= 500) {
        const form = new FormData();
        form.append("file", normalized, uploadName);
        form.append("token", adminToken);
        res = await fetch("/api/uploads", { method: "POST", body: form });
      }

      const data = await res.json().catch(() => ({}) as Record<string, unknown>);

      if (!res.ok || !data.url) {
        const serverMsg = typeof data.error === "string" ? data.error : "";
        setError(
          `${
            serverMsg ||
            (isAr ? "فشل رفع الصورة، حاول مرة أخرى." : "Upload failed, please try again.")
          } (${res.status})`
        );
        return;
      }

      onChange(String(data.url));
      setLastUpload({ name, size: Number(data.size) || normalized.size });
    } catch {
      setError(
        isAr
          ? "تعذر الاتصال بالخادم أثناء الرفع. تحقق من الاتصال وحاول مجدداً."
          : "Could not reach the server during upload. Check your connection and retry."
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void uploadFile(file);
  };

  const openPicker = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const storageLabel = value.startsWith("/api/uploads/")
    ? isAr
      ? "مخزنة في قاعدة بيانات المتجر"
      : "Stored in the store database"
    : value.startsWith("/images/")
      ? isAr
        ? "صورة المتجر الافتراضية"
        : "Built-in store image"
      : value
        ? isAr
          ? "صورة خارجية"
          : "External image"
        : "";

  return (
    <div>
      <label className="flex items-center justify-between text-xs font-bold mb-1.5">
        <span>
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
        {optional && (
          <span className="font-medium opacity-60">
            {isAr ? "اختياري" : "Optional"}
          </span>
        )}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        /* Preview state */
        <div
          style={{
            backgroundColor: theme.colors.bgSecondary,
            borderColor: theme.colors.border,
          }}
          className="flex items-center gap-3 rounded-xl border p-2.5"
        >
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="h-full w-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{storageLabel}</span>
            </div>
            {lastUpload && (
              <p className="truncate text-[11px] opacity-70" title={lastUpload.name}>
                {lastUpload.name} • {formatBytes(lastUpload.size)}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={openPicker}
                disabled={isUploading}
                style={{
                  backgroundColor: theme.colors.accentPrimary,
                  color: "#FFFFFF",
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" />
                {isAr ? "استبدال" : "Replace"}
              </button>
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setLastUpload(null);
                  }}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {isAr ? "إزالة" : "Remove"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty drop-zone state */
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          disabled={isUploading}
          style={{
            backgroundColor: isDragging
              ? theme.colors.badgeBg
              : theme.colors.bgSecondary,
            borderColor: isDragging
              ? theme.colors.accentPrimary
              : theme.colors.border,
          }}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition hover:opacity-90"
        >
          {isUploading ? (
            <>
              <Loader2
                style={{ color: theme.colors.accentPrimary }}
                className="h-7 w-7 animate-spin"
              />
              <span className="text-xs font-bold">
                {isAr ? "جارٍ رفع الصورة..." : "Uploading image..."}
              </span>
            </>
          ) : (
            <>
              {isDragging ? (
                <UploadCloud
                  style={{ color: theme.colors.accentPrimary }}
                  className="h-7 w-7"
                />
              ) : (
                <ImagePlus
                  style={{ color: theme.colors.accentPrimary }}
                  className="h-7 w-7"
                />
              )}
              <span className="inline-flex items-center gap-1 text-xs font-extrabold">
                <FolderOpen className="h-3.5 w-3.5" />
                {isAr
                  ? "اختر صورة من جهازك"
                  : "Choose an image from your device"}
              </span>
              <span className="text-[10px] opacity-60">
                {isAr
                  ? "أو اسحبها وأفلتها هنا • JPG, PNG, WEBP • حتى 8MB"
                  : "or drag & drop here • JPG, PNG, WEBP • up to 8 MB"}
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
