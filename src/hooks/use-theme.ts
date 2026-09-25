"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const storageKey = "whl-theme";
const changeEvent = "whl:theme-changed";

/** Kept in sync with the inline script in the root layout. */
function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  const applied = document.documentElement.dataset.theme;
  if (applied === "light" || applied === "dark") return applied;
  return readStored() ?? systemTheme();
}

/** The server has no way to know the visitor's preference, so it renders light. */
function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    // Only follow the operating system while the visitor has no explicit choice.
    if (!readStored()) applyTheme(systemTheme());
    onChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return;
    applyTheme(readStored() ?? systemTheme());
    onChange();
  };
  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Tells the browser to render form controls, scrollbars and caret in kind.
  root.style.colorScheme = theme;
  // Keeps the Android/iOS browser chrome matching the page.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((tag) => tag.setAttribute("content", theme === "dark" ? "#151714" : "#e2131c"));
}

export function setTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // A blocked storage API still allows the choice to apply for this visit.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(changeEvent));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [theme, setTheme] as const;
}

const neverChanges = () => () => {};

/**
 * False during server render and the hydration pass, true afterwards.
 *
 * Lets the switch render a neutral state until the real preference is known,
 * without a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(neverChanges, () => true, () => false);
}
