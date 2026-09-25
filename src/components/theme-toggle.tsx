"use client";

import { useHydrated, useTheme } from "@/hooks/use-theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.3M12 19.1v2.3M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.6 12h2.3M19.1 12h2.3M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

/**
 * Light/dark switch.
 *
 * Renders a stable placeholder until mounted: the server cannot know the
 * visitor's preference, so committing to an icon too early would hydrate wrong.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useTheme();
  const mounted = useHydrated();

  const isDark = theme === "dark";
  const label = !mounted ? "Switch colour theme" : isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      role="switch"
      aria-checked={mounted ? isDark : false}
      suppressHydrationWarning
    >
      <span className="theme-toggle-icons" aria-hidden="true">
        <span className="theme-icon theme-icon-sun"><SunIcon /></span>
        <span className="theme-icon theme-icon-moon"><MoonIcon /></span>
      </span>
    </button>
  );
}

/** Labelled variant for the mobile menu, where a bare icon reads as ambiguous. */
export function ThemeToggleRow() {
  const [theme, setTheme] = useTheme();
  const mounted = useHydrated();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle-row"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="switch"
      aria-checked={mounted ? isDark : false}
      suppressHydrationWarning
    >
      <span className="theme-row-label">
        <span className="theme-row-icon" aria-hidden="true">{isDark ? <MoonIcon /> : <SunIcon />}</span>
        {mounted && isDark ? "Dark mode" : "Light mode"}
      </span>
      <span className="theme-row-switch" aria-hidden="true"><span /></span>
    </button>
  );
}
