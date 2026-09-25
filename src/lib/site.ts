/**
 * Canonical public address of the site.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL — set this once you have a custom domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the stable production domain on Vercel.
 *   3. VERCEL_URL — the per-deployment preview domain.
 *   4. Localhost for development.
 *
 * Used for absolute Open Graph URLs, the sitemap and robots.txt. Without it,
 * link previews on WhatsApp and Facebook cannot resolve the preview image.
 */
function normalize(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

export const siteUrl = normalize(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000",
);

export const business = {
  name: "WHL Motocare Supplies",
  tagline: "Quality parts. Smooth rides.",
  street: "Ndirande Ma Plot, next to COSYS",
  locality: "Ndirande",
  region: "Blantyre",
  country: "MW",
  phones: ["+265884985461", "+265993383916"],
  displayPhones: ["0884 985 461", "0993 38 39 16"],
};
