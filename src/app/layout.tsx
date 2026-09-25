import type { Metadata, Viewport } from "next";
import { DM_Sans, Barlow_Condensed } from "next/font/google";
import type { ReactNode } from "react";
import { business, siteUrl } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const description =
  "Motorcycle spare parts, repairs and care in Ndirande Ma Plot, next to COSYS. Shop parts for Yamaha, Kingboss, Kinglion, SanLG, Lifan and LiFO, or book a repair online. Call 0884 985 461.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WHL Motocare Supplies | Keep Your Ride in Top Gear",
    template: "%s | WHL Motocare Supplies",
  },
  description,
  applicationName: business.name,
  keywords: [
    "motorcycle spare parts Malawi",
    "motorcycle repairs Blantyre",
    "Ndirande motorcycle shop",
    "Yamaha spare parts",
    "Kingboss",
    "Kinglion",
    "SanLG",
    "Lifan",
    "LiFO",
    "motorcycle mechanic Blantyre",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: business.name,
    title: "WHL Motocare Supplies | Keep Your Ride in Top Gear",
    description,
    url: "/",
    locale: "en_MW",
    images: [
      {
        url: "/images/social-card.jpg",
        width: 1200,
        height: 630,
        alt: "A motorcycle in the WHL Motocare workshop in Ndirande, Blantyre.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WHL Motocare Supplies | Keep Your Ride in Top Gear",
    description,
    images: ["/images/social-card.jpg"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e2131c" },
    { media: "(prefers-color-scheme: dark)", color: "#151714" },
  ],
  colorScheme: "light dark",
};

/**
 * Applies the saved theme before the first paint.
 *
 * Without this the page renders light and then flips, which is jarring at
 * night. It must stay inline and synchronous in <head>.
 */
const noFlashScript = `(function(){try{var s=localStorage.getItem("whl-theme");var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;}catch(e){}})();`;

/** Helps Google show the shop's address, phone numbers and opening details. */
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  name: business.name,
  description,
  url: siteUrl,
  image: `${siteUrl}/images/social-card.jpg`,
  telephone: business.phones[0],
  currenciesAccepted: "MWK",
  address: {
    "@type": "PostalAddress",
    streetAddress: business.street,
    addressLocality: business.locality,
    addressRegion: business.region,
    addressCountry: business.country,
  },
  areaServed: { "@type": "City", name: "Blantyre" },
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Motorcycle spare parts supply" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Motorcycle repairs and servicing" } },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${barlow.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          // Static, developer-authored data — no user input is interpolated.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </body>
    </html>
  );
}
