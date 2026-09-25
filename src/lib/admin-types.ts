import type { Product } from "@/lib/catalog";

export type AdminProduct = Product & {
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = { id: string; name: string; email: string };
