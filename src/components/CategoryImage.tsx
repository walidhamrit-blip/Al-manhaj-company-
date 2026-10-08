"use client";

import React, { useState } from "react";
import { getCategoryIllustration } from "@/lib/category-image-fallbacks";
import { StoreImage } from "@/components/StoreImage";

interface CategoryImageProps {
  slug: string;
  src: string;
  alt: string;
  className?: string;
}

export function CategoryImage({
  slug,
  src,
  alt,
  className,
}: CategoryImageProps) {
  const fallbackSrc = getCategoryIllustration(slug);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const source = src?.trim() || fallbackSrc;
  const displayedSrc = failedSrc === source ? fallbackSrc : source;

  return (
    <StoreImage
      src={displayedSrc}
      alt={alt}
      className={className}
      sizes="(max-width: 768px) 50vw, 240px"
      onError={() => setFailedSrc(source)}
    />
  );
}
