"use client";

type CatalogPhotoProps = {
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

export function CatalogPhoto({
  src,
  alt,
  className,
  fill = true,
  onError,
}: CatalogPhotoProps) {
  const source = src?.trim() || "/images/hero-stationery.jpg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={alt}
      loading="lazy"
      className={
        fill
          ? `absolute inset-0 h-full w-full ${className || "object-cover"}`
          : className
      }
      onError={onError}
    />
  );
}
