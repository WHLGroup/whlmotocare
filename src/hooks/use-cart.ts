"use client";

import { useMemo, useSyncExternalStore } from "react";

export type CartLine = { productId: string; quantity: number };
type CartUpdate = CartLine[] | ((current: CartLine[]) => CartLine[]);

const storageKey = "whl-parts-bag";
const changeEvent = "whl:bag-changed";
const emptySnapshot = "[]";
let memorySnapshot = emptySnapshot;
let storageUnavailable = false;

function normalizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: CartLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { productId, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || !productId.trim() || productId.length > 100 || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || seen.has(productId)) continue;
    seen.add(productId);
    result.push({ productId, quantity });
    if (result.length === 30) break;
  }
  return result;
}

function parseCart(snapshot: string): CartLine[] {
  if (snapshot.length > 20000) return [];
  try { return normalizeCart(JSON.parse(snapshot)); }
  catch { return []; }
}

function getSnapshot(): string {
  if (typeof window === "undefined") return emptySnapshot;
  if (!storageUnavailable) {
    try {
      memorySnapshot = window.localStorage.getItem(storageKey) ?? emptySnapshot;
    } catch {
      storageUnavailable = true;
    }
  }
  return memorySnapshot;
}

function getServerSnapshot(): string {
  return emptySnapshot;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch { return; }
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("pageshow", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("pageshow", onChange);
    window.removeEventListener("focus", onChange);
  };
}

function updateCart(update: CartUpdate): void {
  if (typeof window === "undefined") return;
  const current = parseCart(getSnapshot());
  const next = normalizeCart(typeof update === "function" ? update(current) : update);
  memorySnapshot = JSON.stringify(next);
  try {
    window.localStorage.setItem(storageKey, memorySnapshot);
    storageUnavailable = false;
  } catch {
    // Retain a working bag for this visit when browser storage is blocked or full.
    storageUnavailable = true;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cart = useMemo(() => parseCart(snapshot), [snapshot]);
  return [cart, updateCart] as const;
}
