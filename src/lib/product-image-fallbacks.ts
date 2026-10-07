import type { Product } from "@/db/schema";

const PRODUCT_FALLBACKS: Record<string, string> = {
  "NB-ATELIER-01": "/images/new/notebook-kyoto-01.jpg",
  "NB-SPIRAL-02": "/images/new/paper-a4-01.jpg",
  "NB-PLANNER-03": "/images/new/paper-a4-01.jpg",
  "WR-FOUNT-01": "/images/new/pen-fountain-01.jpg",
  "WR-GEL-02": "/images/new/gel-sakura-01.jpg",
  "WR-PASTEL-03": "/images/new/markers-48-01.jpg",
  "BG-PACK-01": "/images/new/bag-oslo-01.jpg",
  "BG-CASE-02": "/images/new/bag-oslo-01.jpg",
  "BG-TRAY-03": "/images/new/organizer-walnut-01.jpg",
  "IT-KEY-01": "/images/new/hero-it-tech-01.jpg",
  "IT-MOUSE-02": "/images/new/hero-it-tech-01.jpg",
  "IT-HUB-03": "/images/new/hub-usbc-01.jpg",
  "INK-TONER-01": "/images/new/toner-01.jpg",
  "INK-CMYK-02": "/images/new/toner-01.jpg",
  "INK-PAPER-03": "/images/new/paper-a4-01.jpg",
  "ART-MARK-01": "/images/new/markers-48-01.jpg",
  "ART-GEOM-02": "/images/new/compass-brass-01.jpg",
  "ART-SKETCH-03": "/images/new/paper-a4-01.jpg",
  "CALC-SCI-01": "/images/new/calculator-desk-01.jpg",
  "CALC-DESK-02": "/images/new/calculator-desk-01.jpg",
  "CALC-LAMP-03": "/images/new/lamp-led-01.jpg",
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  notebooks: "/images/new/notebook-kyoto-01.jpg",
  writing: "/images/new/pen-fountain-01.jpg",
  bags: "/images/new/bag-oslo-01.jpg",
  "it-peripherals": "/images/new/hero-it-tech-01.jpg",
  "ink-consumables": "/images/new/toner-01.jpg",
  "art-drafting": "/images/new/markers-48-01.jpg",
  "calculators-tech": "/images/new/calculator-desk-01.jpg",
};

export function getProductImageFallback(
  product: Pick<Product, "sku" | "categorySlug">
): string {
  return (
    PRODUCT_FALLBACKS[product.sku] ??
    CATEGORY_FALLBACKS[product.categorySlug] ??
    "/images/new/main-storefront-hq.jpg"
  );
}
