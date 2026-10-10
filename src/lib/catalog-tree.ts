/** Department tree modelled on Lyreco / Office Depot / Bureau Vallée / Mytek bureautique. */
export type CatalogDepartment = {
  slug: string;
  nameEn: string;
  nameAr: string;
  children: string[];
};

export const CATALOG_DEPARTMENTS: CatalogDepartment[] = [
  {
    slug: "paper",
    nameEn: "Paper & notebooks",
    nameAr: "الورق والدفاتر",
    children: ["notebooks", "files-folders"],
  },
  {
    slug: "write",
    nameEn: "Writing",
    nameAr: "الكتابة",
    children: ["writing"],
  },
  {
    slug: "school",
    nameEn: "School & bags",
    nameAr: "المدرسة والحقائب",
    children: ["bags", "school-essentials"],
  },
  {
    slug: "office",
    nameEn: "Office supplies",
    nameAr: "مستلزمات المكتب",
    children: ["office-supplies"],
  },
  {
    slug: "print",
    nameEn: "Print & ink",
    nameAr: "الطباعة والأحبار",
    children: ["ink-consumables"],
  },
  {
    slug: "it",
    nameEn: "IT & calculators",
    nameAr: "الحاسوب والحاسبات",
    children: ["it-peripherals", "calculators-tech"],
  },
  {
    slug: "art",
    nameEn: "Art & drafting",
    nameAr: "الفنون والرسم",
    children: ["art-drafting"],
  },
];
