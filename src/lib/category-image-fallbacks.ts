const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  notebooks: "/images/category-illustrations/notebooks.webp",
  writing: "/images/category-illustrations/writing.webp",
  bags: "/images/category-illustrations/bags.webp",
  "it-peripherals": "/images/category-illustrations/it-accessories.webp",
  "ink-consumables": "/images/category-illustrations/ink-toner.webp",
  "art-drafting": "/images/category-illustrations/art-drafting.webp",
  "calculators-tech": "/images/category-illustrations/calculators.webp",
  "files-folders": "/images/category-illustrations/notebooks.webp",
  "office-supplies": "/images/category-illustrations/writing.webp",
  "school-essentials": "/images/category-illustrations/bags.webp",
};

export function getCategoryIllustration(slug: string): string {
  return CATEGORY_ILLUSTRATIONS[slug] ?? "/images/category-illustrations/notebooks.webp";
}
