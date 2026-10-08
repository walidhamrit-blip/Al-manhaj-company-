"use client";

import React, { useState } from "react";
import type { Product } from "@/db/schema";
import { getProductImageFallback } from "@/lib/product-image-fallbacks";
import { StoreImage } from "@/components/StoreImage";

interface ProductImageProps {
  product: Pick<Product, "sku" | "categorySlug">;
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/** Keep product tiles visible if an old catalog record points to a blocked external image host. */
export function ProductImage({
  product,
  src,
  alt,
  className,
}: ProductImageProps) {
  const fallbackSrc = getProductImageFallback(product);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const source = src?.trim() || fallbackSrc;
  const displayedSrc = failedSrc === source ? fallbackSrc : source;

  return (
    <StoreImage
      src={displayedSrc}
      alt={alt}
      className={className}
      sizes="(max-width: 768px) 50vw, 220px"
      onError={() => setFailedSrc(source)}
    />
  );
}
