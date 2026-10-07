"use client";

import React, { useState } from "react";
import { getCategoryIllustration } from "@/lib/category-image-fallbacks";

interface CategoryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  slug: string;
  src: string;
  alt: string;
}

export function CategoryImage({
  slug,
  src,
  alt,
  ...imageProps
}: CategoryImageProps) {
  const fallbackSrc = getCategoryIllustration(slug);
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
