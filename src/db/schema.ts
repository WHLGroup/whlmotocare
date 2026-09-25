import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  compatibility: jsonb("compatibility").$type<string[]>().notNull(),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OrderItem = { productId: string; name: string; price: number; quantity: number };

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: text("reference").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  fulfillment: text("fulfillment").notNull(),
  address: text("address"),
  notes: text("notes"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("received"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: text("reference").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  brand: text("brand").notNull(),
  model: text("model"),
  service: text("service").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("requested"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminAccounts = pgTable("admin_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  adminId: text("admin_id").notNull().references(() => adminAccounts.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminRateLimits = pgTable("admin_rate_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const catalogueImages = pgTable("catalogue_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentType: text("content_type").notNull(),
  data: text("data").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
