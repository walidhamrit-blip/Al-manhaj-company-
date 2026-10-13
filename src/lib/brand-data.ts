export type BrandGroup = "it" | "stationery";
export interface Brand {
  slug: string;
  nameEn: string;
  nameAr: string;
  group: string | null;
  logoUrl: string;
  searchQuery: string;
  isActive: boolean;
  sortOrder: number;
}
export interface BrandSection {
  slug: string;
  type: string;
  group: string | null;
  isActive: boolean;
  sortOrder: number;
}
export const INITIAL_BRANDS: Brand[] = [
  ["hp", "HP", "إتش بي", "it"],
  ["canon", "Canon", "كانون", "it"],
  ["epson", "Epson", "إبسون", "it"],
  ["brother", "Brother", "براذر", "it"],
  ["logitech", "Logitech", "لوجيتك", "it"],
  ["dell", "Dell", "ديل", "it"],
  ["bic", "BIC", "بيك", "stationery"],
  ["faber-castell", "Faber-Castell", "فابر كاستل", "stationery"],
  ["staedtler", "Staedtler", "ستيدلر", "stationery"],
  ["maped", "Maped", "مابيد", "stationery"],
  ["pilot", "Pilot", "بايلوت", "stationery"],
  ["stabilo", "Stabilo", "ستابيلو", "stationery"],
].map(([slug, nameEn, nameAr, group], sortOrder) => ({
  slug, nameEn, nameAr, group, sortOrder,
  logoUrl: `/brands/${slug}.svg`, searchQuery: nameEn, isActive: true,
}));
export const INITIAL_BRAND_SECTIONS: BrandSection[] = [
  { slug: "it-brands", type: "brands", group: "it", isActive: true, sortOrder: 0 },
  { slug: "stationery-brands", type: "brands", group: "stationery", isActive: true, sortOrder: 1 },
];
