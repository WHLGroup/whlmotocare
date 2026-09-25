"use client";

import Link from "next/link";
import { BrandMark, Icon } from "@/components/icons";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="standalone-page"><Link href="/" aria-label="WHL Motocare home"><BrandMark /></Link><p className="eyebrow">A QUICK PIT STOP</p><h1>We’ve hit a small bump.</h1><p>We couldn’t load the shop just now. Please try again, or call our team — we’re still here to help.</p><button className="button button-orange" onClick={reset}>Try again <Icon name="arrow-right" size={18} /></button><a className="text-link" href="tel:+265884985461"><Icon name="phone" size={17} /> 0884 985 461</a></main>;
}
