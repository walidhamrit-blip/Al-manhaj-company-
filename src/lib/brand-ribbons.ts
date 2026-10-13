import type { Brand, BrandGroup, BrandSection } from "./brand-data";
export function isBrandGroup(group: unknown): group is BrandGroup {
  return group === "it" || group === "stationery";
}
export function ribbonBrands(brands: Brand[], group: unknown): Brand[] {
  if (!isBrandGroup(group)) return [];
  const seen = new Set<string>();
  return [...brands].sort((a, b) => a.sortOrder - b.sortOrder).filter((brand) => {
    const key = (brand.slug ?? "").trim().toLowerCase();
    if (!brand.isActive || brand.group !== group || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function ribbonSections(sections: BrandSection[]): BrandSection[] {
  const seen = new Set<string>();
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder).filter((section) => {
    if (!section.isActive || section.type !== "brands" || !isBrandGroup(section.group) || seen.has(section.group)) return false;
    seen.add(section.group);
    return true;
  });
}
