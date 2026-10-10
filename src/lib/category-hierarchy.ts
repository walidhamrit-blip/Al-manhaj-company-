import type { Category, Product } from "@/db/schema";

/**
 * Resolve a product's top-level category even when older/admin data stores a
 * subcategory slug directly in `categorySlug` instead of using
 * `subcategorySlug`.
 */
export function getProductParentSlug(
  product: Product,
  categoriesBySlug: ReadonlyMap<string, Category>
): string {
  const assignedCategory = categoriesBySlug.get(product.categorySlug);
  return assignedCategory?.parentSlug || product.categorySlug;
}

/** Resolve the product's child category across both supported data shapes. */
export function getProductSubcategorySlug(
  product: Product,
  categoriesBySlug: ReadonlyMap<string, Category>
): string | null {
  if (product.subcategorySlug) return product.subcategorySlug;

  const assignedCategory = categoriesBySlug.get(product.categorySlug);
  return assignedCategory?.parentSlug ? assignedCategory.slug : null;
}
