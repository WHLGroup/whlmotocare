import Link from "next/link";
import { BrandMark, Icon } from "@/components/icons";

export default function NotFound() {
  return <main className="standalone-page"><Link href="/" aria-label="WHL Motocare home"><BrandMark /></Link><p className="eyebrow">404 · A WRONG TURN</p><h1>Let’s get you back on track.</h1><p>That page isn’t here, but your next ride is waiting. Head back to our shop for parts, repairs and a little expert advice.</p><Link className="button button-dark" href="/shop">Explore spare parts <Icon name="arrow-right" size={18} /></Link><Link className="text-link" href="/">Back to home</Link></main>;
}
