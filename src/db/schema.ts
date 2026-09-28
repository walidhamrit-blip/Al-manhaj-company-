import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // en centimes
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});
