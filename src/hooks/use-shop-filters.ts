"use client";

import { useSearchParams } from "next/navigation";
import { brands, categories } from "@/lib/catalog";

type FilterKey = "category" | "brand" | "query" | "sort";
const defaults = { category: "all", brand: "all", query: "", sort: "featured" };
const parameterNames = { category: "category", brand: "brand", query: "q", sort: "sort" };
const sortOptions = ["featured", "price-low", "price-high", "name"];

function updateFilters(values: Partial<Record<FilterKey, string>>, replace = false): void {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values) as [FilterKey, string][]) {
    const parameter = parameterNames[key];
    if (!value || value === defaults[key]) url.searchParams.delete(parameter);
    else url.searchParams.set(parameter, key === "query" ? value.slice(0, 200) : value);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
  // Next.js synchronizes its search-parameter hook with native history updates.
  if (replace) window.history.replaceState(null, "", next);
  else window.history.pushState(null, "", next);
}

export function useShopFilters() {
  const params = useSearchParams();
  const rawCategory = params.get("category") ?? "all";
  const rawBrand = params.get("brand") ?? "all";
  const rawSort = params.get("sort") ?? "featured";
  return {
    category: categories.some((category) => category.id === rawCategory) ? rawCategory : "all",
    brand: brands.includes(rawBrand) ? rawBrand : "all",
    query: (params.get("q") ?? "").slice(0, 200),
    sort: sortOptions.includes(rawSort) ? rawSort : "featured",
    setCategory: (category: string) => updateFilters({ category }),
    setBrand: (brand: string) => updateFilters({ brand }),
    setQuery: (query: string) => updateFilters({ query }, true),
    setSort: (sort: string) => updateFilters({ sort }),
    reset: () => updateFilters(defaults),
  };
}
