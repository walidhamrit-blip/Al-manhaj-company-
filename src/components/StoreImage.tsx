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

export function StoreImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  sizes,
  priority = false,
  loading = "lazy",
  onError,
}: StoreImageProps) {
  const source = src?.trim() || "/images/hero-stationery.jpg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={alt}
      // Une image de héros doit être chargée tout de suite et en priorité
      // (`fetchPriority="high"`) : c'est l'élément LCP de la page d'accueil.
      // `decoding="async"` évite de bloquer le fil principal au décodage.
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      width={width}
      height={height}
      sizes={sizes}
      className={
        fill
          ? `absolute inset-0 h-full w-full ${className || "object-cover"}`
          : className
      }
      onError={onError}
    />
  );
}
