"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Dialog, ErrorMessage, Quantity, SubmitButton } from "@/components/ui";
import { brands, categoryName, money, priceNotice, services, whatsappUrl, type Product } from "@/lib/catalog";

export type CartItem = { product: Product; quantity: number };
type Receipt = { reference: string; total?: number; preferredDate?: string; preferredTime?: string; service?: string };

async function sendRequest(endpoint: string, payload: unknown) {
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "We couldn’t send your request. Please try again.");
  return data;
}

function rememberRequest(reference: string) {
  try { localStorage.setItem("whl-last-reference", reference); } catch { /* Storage is optional. */ }
}

function Success({ receipt, kind, onClose }: { receipt: Receipt; kind: "order" | "repair"; onClose: () => void }) {
  const isOrder = kind === "order";
  return <div className="request-success">
    <div className="success-symbol"><Icon name="check" size={34} /></div>
    <p className="eyebrow">THANKS FOR CHOOSING WHL</p>
    <h3>{isOrder ? "Your next ride starts here." : "Your bike is in good hands."}</h3>
    <p>{isOrder ? "Your order request has been saved. Our team will call to confirm the parts, availability and final price before payment." : "Your repair request has been saved. Our team will call to confirm your appointment and discuss what your bike needs."}</p>
    <div className="reference-box"><span>{isOrder ? "ORDER" : "BOOKING"} REFERENCE</span><strong>{receipt.reference}</strong><small>Keep this number to track your request.</small></div>
    {isOrder && receipt.total !== undefined && <div className="receipt-detail"><span>Estimated parts total</span><strong>{money(receipt.total)}</strong></div>}
    {!isOrder && <div className="booking-recap"><Icon name="calendar" /><div><strong>{receipt.preferredDate && new Date(`${receipt.preferredDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {receipt.preferredTime}</strong><span>{receipt.service}</span><small>Requested time — awaiting phone confirmation</small></div></div>}
    <button className="button button-dark button-full" onClick={onClose}>Back to the road <Icon name="arrow-right" size={18} /></button>
    <a className="text-link success-contact" href={`${whatsappUrl}?text=${encodeURIComponent(`Hello WHL Motocare, I would like to follow up on my ${kind} request ${receipt.reference}.`)}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> Follow up on WhatsApp</a>
  </div>;
}

export function CartDialog({ items, onChange, onRemove, onClose, onComplete }: { items: CartItem[]; onChange: (id: string, quantity: number) => void; onRemove: (id: string) => void; onClose: () => void; onComplete: () => void }) {
  const [stage, setStage] = useState<"cart" | "checkout" | "success">("cart");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const close = () => { if (!busy) onClose(); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError("");
    try {
      const result = await sendRequest("/api/orders", { ...form, fulfillment, items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) });
      rememberRequest(result.reference);
      setReceipt(result); setStage("success"); onComplete();
    } catch (err) { setError(err instanceof Error ? err.message : "Please check your connection and try again."); }
    finally { setBusy(false); }
  }

  return <Dialog title={stage === "cart" ? "Your parts bag" : stage === "checkout" ? "You’re almost road-ready." : "Request received."} eyebrow={stage === "cart" ? `${count} ${count === 1 ? "PART" : "PARTS"} · BUILT FOR YOUR NEXT RIDE` : stage === "checkout" ? "A FEW DETAILS, THEN WE’LL TAKE IT FROM HERE" : "WE’LL BE IN TOUCH"} onClose={close} drawer>
    {stage === "success" && receipt ? <Success receipt={receipt} kind="order" onClose={onClose} /> : stage === "cart" ? <>
      {!items.length ? <div className="empty-state"><div className="empty-icon"><Icon name="bag" size={36} /></div><h3>Your next ride is waiting.</h3><p>Your bag is empty. Find the right parts to get your bike back in top gear.</p><Link href="/shop" className="button button-dark" onClick={onClose}>Explore spare parts <Icon name="arrow-right" size={18} /></Link></div> : <>
        <div className="cart-items">{items.map(({ product, quantity }) => <div className="cart-item" key={product.id}><div className="cart-item-image"><Image src={product.image} alt={product.name} fill sizes="90px" /></div><div className="cart-item-details"><span className="small-label">{categoryName(product.category)}</span><h3>{product.name}</h3><strong>{money(product.price)}</strong><div className="cart-item-controls"><Quantity value={quantity} name={product.name} onChange={(next) => onChange(product.id, next)} /><button className="remove-link" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}><Icon name="trash" size={15} /> Remove</button></div></div></div>)}</div>
        <div className="cart-totals"><div><span>Estimated subtotal</span><strong>{money(total)}</strong></div><p><Icon name="info" size={16} /> {priceNotice}</p><button className="button button-orange button-full" onClick={() => setStage("checkout")}>Continue to order <Icon name="arrow-right" size={18} /></button><span className="secure-note"><Icon name="shield" size={15} /> No online payment needed</span></div>
        <div className="collection-note"><Icon name="pin" /><p><strong>Collect from our shop</strong><span>Ndirande Ma Plot, next to COSYS</span></p></div>
      </>}
    </> : <form className="customer-form" onSubmit={submit}>
      <button type="button" className="back-link" onClick={() => setStage("cart")}><span>←</span> Back to your bag</button>
      <div className="checkout-summary"><span>{count} {count === 1 ? "part" : "parts"} in your order</span><strong>{money(total)}</strong></div>
      <div className="form-row"><label>Your name <span>*</span><input name="customerName" placeholder="Full name" autoComplete="name" required maxLength={100} /></label><label>Phone number <span>*</span><input name="phone" placeholder="0884 985 461" type="tel" autoComplete="tel" required minLength={9} maxLength={25} /></label></div>
      <label>Email <small>(optional)</small><input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={200} /></label>
      <fieldset className="delivery-options"><legend>How would you like your parts?</legend><label className={fulfillment === "pickup" ? "selected" : ""}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")} /><Icon name="pin" /><span><strong>Shop collection</strong><small>Ndirande Ma Plot · No collection fee</small></span></label><label className={fulfillment === "delivery" ? "selected" : ""}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} /><Icon name="truck" /><span><strong>Request local delivery</strong><small>Availability and delivery fee confirmed by phone</small></span></label></fieldset>
      {fulfillment === "delivery" && <label>Delivery address <span>*</span><textarea name="address" placeholder="Area, street and a nearby landmark" required maxLength={500} rows={2} /><small>Delivery fees are not included in the parts estimate.</small></label>}
      <label>Bike model or order notes <small>(optional)</small><textarea name="notes" placeholder="Tell us your motorcycle make, model, or anything we should know." maxLength={1500} rows={3} /></label>
      <ErrorMessage message={error} />
      <p className="form-note">{priceNotice} We use your contact details to arrange your order.</p>
      <SubmitButton busy={busy}>Place order request <Icon name="arrow-right" size={18} /></SubmitButton>
      <span className="secure-note"><Icon name="phone" size={14} /> We’ll call you before any payment is due</span>
    </form>}
  </Dialog>;
}

export function BookingDialog({ onClose, initialService = "" }: { onClose: () => void; initialService?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Blantyre", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError("");
    try {
      const result = await sendRequest("/api/bookings", form);
      rememberRequest(result.reference); setReceipt(result);
    } catch (err) { setError(err instanceof Error ? err.message : "Please check your connection and try again."); }
    finally { setBusy(false); }
  }

  return <Dialog title={receipt ? "You’re one step closer." : "Let’s get your bike sorted."} eyebrow="THE WHL WORKSHOP" onClose={() => { if (!busy) onClose(); }}>
    {receipt ? <Success receipt={receipt} kind="repair" onClose={onClose} /> : <>
      <div className="booking-intro"><span className="service-icon"><Icon name="wrench" size={24} /></span><p>A tune-up or a little more TLC? Tell us what you need and request a convenient time. We’ll call to confirm.</p></div>
      <form className="customer-form" onSubmit={submit}>
        <div className="form-row"><label>Your name <span>*</span><input name="customerName" placeholder="Full name" autoComplete="name" required maxLength={100} /></label><label>Phone number <span>*</span><input name="phone" type="tel" placeholder="0884 985 461" autoComplete="tel" required minLength={9} maxLength={25} /></label></div>
        <div className="form-row"><label>Motorcycle make <span>*</span><select name="brand" defaultValue="" required><option value="" disabled>Select your make</option>{[...brands, "Other"].map((brand) => <option key={brand}>{brand}</option>)}</select></label><label>Model <small>(optional)</small><input name="model" placeholder="e.g. YBR 125" maxLength={100} /></label></div>
        <label>What does your bike need? <span>*</span><select name="service" defaultValue={initialService} required><option value="" disabled>Select a service</option>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
        <div className="form-row"><label>Preferred date <span>*</span><input name="preferredDate" type="date" min={today} required /></label><label>Preferred time <span>*</span><select name="preferredTime" defaultValue="" required><option value="" disabled>Select a time</option><option>Morning</option><option>Afternoon</option><option>Any time</option></select></label></div>
        <label>Tell us a little more <small>(optional)</small><textarea name="notes" placeholder="Any unusual sounds, recent issues, or specific work you need?" rows={3} maxLength={1500} /></label>
        <ErrorMessage message={error} />
        <div className="form-callout"><Icon name="info" size={17} /><p>This is an appointment request, not a confirmed booking. We’ll confirm your time and quote before starting any work.</p></div>
        <SubmitButton busy={busy}>Request my repair booking <Icon name="arrow-right" size={18} /></SubmitButton>
        <span className="secure-note"><Icon name="pin" size={14} /> Ndirande Ma Plot, next to COSYS</span>
      </form>
    </>}
  </Dialog>;
}

export function ProductDialog({ product, onAdd, onClose, onBook }: { product: Product; onAdd: (product: Product, quantity?: number) => void; onClose: () => void; onBook: () => void }) {
  const [quantity, setQuantity] = useState(1);
  return <Dialog title={product.name} eyebrow={categoryName(product.category)} onClose={onClose} wide>
    <div className="product-detail"><div className="product-detail-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 80vw, 360px" /></div><div className="product-detail-info"><span className="availability"><span /> Available to order</span><div className="detail-price">{money(product.price)}<small>Indicative price · MWK</small></div><p>{product.description}</p><h4>For selected models from</h4><div className="compatibility-tags">{product.compatibility.map((brand) => <span key={brand}>{brand}</span>)}</div><p className="fit-note"><Icon name="info" size={16} /> Not every part fits every model. We’ll check yours before confirming your order.</p><div className="detail-purchase"><Quantity value={quantity} onChange={setQuantity} name={product.name} /><button className="button button-orange" onClick={() => { onAdd(product, quantity); onClose(); }}><Icon name="bag" size={18} /> Add to bag <Icon name="arrow-right" size={18} /></button></div><button className="text-link fitting-link" onClick={onBook}><Icon name="wrench" size={16} /> Need fitting? Book our workshop <Icon name="arrow-up-right" size={16} /></button></div></div>
  </Dialog>;
}

export function SearchDialog({ products, onClose, onSelect, onAdd }: { products: Product[]; onClose: () => void; onSelect: (product: Product) => void; onAdd: (product: Product) => void }) {
  const [query, setQuery] = useState("");
  const results = products.filter((product) => `${product.name} ${categoryName(product.category)} ${product.compatibility.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <Dialog title="Find your next part." eyebrow="LET’S GET YOU MOVING" onClose={onClose}>
    <div className="search-field dialog-search"><Icon name="search" /><input placeholder="Search parts, categories or bike makes…" aria-label="Search spare parts" value={query} onChange={(event) => setQuery(event.target.value)} /><span className="keyboard-hint">ESC</span></div>
    <p className="search-results-label">{query ? `${results.length} ${results.length === 1 ? "part" : "parts"} found` : "A FEW RIDER ESSENTIALS"}</p>
    {results.length ? <div className="search-results">{results.map((product) => <div className="search-result" key={product.id}><button className="search-result-main" onClick={() => onSelect(product)}><span className="search-result-image"><Image src={product.image} alt="" fill sizes="64px" /></span><span><small>{categoryName(product.category)}</small><strong>{product.name}</strong><span>{money(product.price)}</span></span></button><button className="icon-button add-search-result" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to bag`}><Icon name="plus" size={18} /></button></div>)}</div> : <div className="empty-state search-empty"><Icon name="search" size={30} /><h3>No matching parts just yet.</h3><p>Try “brakes”, “oil” or your bike’s make. Need something specific? Give us a call.</p><a className="text-link" href="tel:+265884985461"><Icon name="phone" size={16} /> 0884 985 461</a></div>}
    <Link className="button button-outline button-full" href="/shop" onClick={onClose}>Explore the whole catalogue <Icon name="arrow-right" size={18} /></Link>
  </Dialog>;
}

type TrackingResult = {
  type: "order" | "repair";
  reference: string;
  status: string;
  total?: number;
  fulfillment?: string;
  items?: { name: string; quantity: number; price: number }[];
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
};

export function TrackingDialog({ onClose }: { onClose: () => void }) {
  const [reference, setReference] = useState(() => { try { return localStorage.getItem("whl-last-reference") ?? ""; } catch { return ""; } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError(""); setResult(null);
    try { setResult(await sendRequest("/api/track", form)); }
    catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <Dialog title="Check in on your request." eyebrow="PARTS OR REPAIRS. WE’VE GOT YOU." onClose={onClose}>
    <p className="dialog-intro">Enter the reference you received and the phone number you used to order or book.</p>
    <form className="customer-form" onSubmit={submit}><label>Order or booking reference <span>*</span><input name="reference" placeholder="e.g. WHL-O-1234ABCD" value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} required maxLength={40} /></label><label>Phone number <span>*</span><input name="phone" type="tel" placeholder="Your order or booking phone number" required minLength={9} maxLength={25} autoComplete="tel" /></label><ErrorMessage message={error} /><SubmitButton busy={busy}>Find my request <Icon name="arrow-right" size={18} /></SubmitButton></form>
    {result && <div className="tracking-result" aria-live="polite"><div className="tracking-heading"><Icon name="check-circle" size={24} /><div><span>{result.type === "order" ? "ORDER" : "REPAIR REQUEST"} FOUND</span><strong>{result.reference}</strong></div><span className="status-badge">{result.status}</span></div><p>Your request is safely with us. We’ll contact you to confirm the details.</p>{result.type === "order" ? <><ul className="tracking-items">{result.items?.map((item, index) => <li key={index}><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity)}</strong></li>)}</ul><div className="receipt-detail"><span>Estimated total</span><strong>{money(result.total ?? 0)}</strong></div><p className="small-note">{result.fulfillment === "delivery" ? "Local delivery requested. Delivery fee to be confirmed." : "Shop collection · Ndirande Ma Plot, next to COSYS"}</p></> : <div className="booking-recap"><Icon name="calendar" /><div><strong>{result.service}</strong><span>{result.preferredDate} · {result.preferredTime}</span><small>Awaiting appointment confirmation</small></div></div>}<a className="text-link" href={`${whatsappUrl}?text=${encodeURIComponent(`Hello WHL, may I have an update on ${result.reference}?`)}`} target="_blank" rel="noreferrer">Ask our team for an update <Icon name="arrow-up-right" size={16} /></a></div>}
  </Dialog>;
}
