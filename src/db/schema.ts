import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;
  ctaAr: string;
  targetCategory: string;
}

export interface LandscapeBannerConfig {
  imageUrl: string;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;
  ctaAr: string;
}

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  imageUrl: text("image_url").notNull(),
  badgeEn: text("badge_en").notNull().default("Collection"),
  badgeAr: text("badge_ar").notNull().default("مجموعة"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull(),
  categorySlug: text("category_slug").notNull(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  price: doublePrecision("price").notNull(),
  originalPrice: doublePrecision("original_price"),
  wholesalePrice: doublePrecision("wholesale_price").notNull(),
  wholesaleMinQty: integer("wholesale_min_qty").notNull().default(10),
  stock: integer("stock").notNull().default(50),
  images: jsonb("images").$type<string[]>().notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPromotion: boolean("is_promotion").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  specsEn: text("specs_en").notNull().default(""),
  specsAr: text("specs_ar").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeNameEn: text("store_name_en").notNull(),
  storeNameAr: text("store_name_ar").notNull(),
  taglineEn: text("tagline_en").notNull(),
  taglineAr: text("tagline_ar").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  addressEn: text("address_en").notNull(),
  addressAr: text("address_ar").notNull(),
  workingHoursEn: text("working_hours_en").notNull(),
  workingHoursAr: text("working_hours_ar").notNull(),
  currencyEn: text("currency_en").notNull().default("LYD"),
  currencyAr: text("currency_ar").notNull().default("د.ل"),
  wholesaleDiscountTier1Pct: integer("wholesale_discount_tier1_pct").notNull().default(15),
  wholesaleDiscountTier2Pct: integer("wholesale_discount_tier2_pct").notNull().default(22),
  wholesaleDiscountTier3Pct: integer("wholesale_discount_tier3_pct").notNull().default(30),
  wholesaleConditionsEn: text("wholesale_conditions_en").notNull(),
  wholesaleConditionsAr: text("wholesale_conditions_ar").notNull(),
  heroSlides: jsonb("hero_slides").$type<HeroSlide[]>().notNull(),
  landscapeBanner: jsonb("landscape_banner").$type<LandscapeBannerConfig>().notNull(),
  defaultTheme: text("default_theme").notNull().default("atelier"),
});

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderLineItem {
  productId: number;
  sku: string;
  titleEn: string;
  titleAr: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
}

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerPhoneNormalized: text("customer_phone_normalized").notNull(),
  customerNotes: text("customer_notes").notNull().default(""),
  items: jsonb("items").$type<OrderLineItem[]>().notNull(),
  total: doublePrecision("total").notNull(),
  currency: text("currency").notNull().default("LYD"),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  statusHistory: jsonb("status_history")
    .$type<OrderStatusEvent[]>()
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const uploadedImages = pgTable("uploaded_images", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull().default("image"),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  dataBase64: text("data_base64").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UploadedImage = typeof uploadedImages.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type StoreSettings = typeof storeSettings.$inferSelect;
export type NewStoreSettings = typeof storeSettings.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
