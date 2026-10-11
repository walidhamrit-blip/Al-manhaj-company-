"use client";

import React, { useState } from "react";
import type { Product } from "@/db/schema";
import { getProductImageFallback } from "@/lib/product-image-fallbacks";
import { StoreImage } from "@/components/StoreImage";

interface ProductImageProps {
  product: Pick<Product, "sku" | "categorySlug">;
  src: string;
  alt: string;
  /**
   * Classes used to size/frame the picture box (`h-16 w-16 rounded-xl border…`).
   * Defaults to filling the parent box. `object-fit` utilities found here
   * (`object-cover`, `object-contain`, …) are applied to the <img> itself.
   */
  className?: string;
  loading?: "lazy" | "eager";
}

/** `object-cover`, `md:object-contain`, `!object-fill`… */
const OBJECT_FIT_CLASS = /(?:^|:)!?object-(cover|contain|fill|none|scale-down)$/;

/**
 * Keep product tiles visible if an old catalog record points to a blocked
 * external image host.
 *
 * The picture is wrapped in its own positioned, sized box, so it can never
 * escape the row that displays it. Both parts matter:
 * - `relative` gives the <img> a containing block of its own;
 * - the box carries the caller's sizing classes.
 *
 * Without them the picture used to be absolutely positioned against the
 * nearest positioned ancestor — the whole drawer / mega-menu / modal — so every
 * line of a list painted a full-panel photo on top of the others, the last
 * rendered product's picture covering the panel and hiding the cart lines (a
 * full cart then looked empty, showing nothing but the last product's photo).
 */
export function ProductImage({
  product,
  src,
  alt,
  className,
  loading = "lazy",
}: ProductImageProps) {
  const fallbackSrc = getProductImageFallback(product);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const source = src?.trim() || fallbackSrc;
  const displayedSrc = failedSrc === source ? fallbackSrc : source;

  const boxClasses: string[] = [];
  const fitClasses: string[] = [];
  for (const token of (className ?? "").split(/\s+/).filter(Boolean)) {
    if (OBJECT_FIT_CLASS.test(token)) fitClasses.push(token);
    else boxClasses.push(token);
  }

  return (
    <span
      className={`relative block overflow-hidden ${
        boxClasses.join(" ") || "h-full w-full"
      }`}
    >
      <StoreImage
        src={displayedSrc}
        alt={alt}
        fill={false}
        loading={loading}
        className={`block h-full w-full ${fitClasses.join(" ") || "object-contain"}`}
        sizes="(max-width: 768px) 50vw, 220px"
        onError={() => setFailedSrc(source)}
      />
    </span>
  );
}
