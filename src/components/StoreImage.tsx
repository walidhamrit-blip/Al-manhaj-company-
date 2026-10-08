"use client";

import React from "react";
import Image from "next/image";

type StoreImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  onError?: () => void;
};

/** next/image wrapper that still works with remote catalog URLs and CSS object-fit classes. */
export function StoreImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  sizes = "100vw",
  priority,
  loading,
  onError,
}: StoreImageProps) {
  const source = src?.trim() || "/images/hero-stationery.jpg";
  if (fill) {
    return (
      <span className="absolute inset-0 block overflow-hidden">
        <Image
          src={source}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={className}
          unoptimized
          onError={onError}
        />
      </span>
    );
  }
  return (
    <Image
      src={source}
      alt={alt}
      width={width || 800}
      height={height || 600}
      sizes={sizes}
      priority={priority}
      loading={loading}
      className={className}
      unoptimized
      onError={onError}
    />
  );
}
