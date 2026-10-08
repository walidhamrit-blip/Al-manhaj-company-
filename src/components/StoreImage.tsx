"use client";

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

/** Native img avoids next/image fill collapsing when a parent has no computed height. */
export function StoreImage({
  src,
  alt,
  className,
  fill = true,
  onError,
}: StoreImageProps) {
  const source = src?.trim() || "/images/hero-stationery.jpg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={alt}
      className={
        fill
          ? `absolute inset-0 h-full w-full ${className || "object-cover"}`
          : className
      }
      onError={onError}
    />
  );
}
