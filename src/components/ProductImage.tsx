"use client";

import React, { useState } from "react";
import type { Product } from "@/db/schema";
import { getProductImageFallback } from "@/lib/product-image-fallbacks";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  product: Pick<Product, "sku" | "categorySlug">;
  src: string;
  alt: string;
}

/** Keep product tiles visible if an old catalog record points to a blocked external image host. */
export function ProductImage({
  product,
  src,
  alt,
  ...imageProps
}: ProductImageProps) {
  const fallbackSrc = getProductImageFallback(product);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const source = src?.trim() || fallbackSrc;
  const displayedSrc = failedSrc === source ? fallbackSrc : source;

  return (
    <img
      {...imageProps}
      src={displayedSrc}
      alt={alt}
      onError={() => setFailedSrc(source)}
    />
  );
}
