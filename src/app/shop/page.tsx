import type { Metadata } from "next";
import Storefront from "@/components/storefront";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";
const shopDescription = "Browse motorcycle engine parts, brakes, tyres, chains and oils. Order online for collection at WHL Motocare Supplies, Ndirande Ma Plot, next to COSYS.";

export const metadata: Metadata = {
  title: "Shop Motorcycle Spare Parts",
  description: shopDescription,
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop Motorcycle Spare Parts | WHL Motocare Supplies",
    description: shopDescription,
    url: "/shop",
  },
};

export default async function ShopPage() {
  const products = await getProducts();
  return <Storefront products={products} page="shop" />;
}
