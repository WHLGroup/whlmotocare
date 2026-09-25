"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { AdminIcon } from "@/components/admin/admin-icons";
import { Dialog, ErrorMessage } from "@/components/ui";
import { brands, categories, money } from "@/lib/catalog";
import { AdminRequestError, adminRequest, jsonRequest } from "@/lib/admin-client";
import type { AdminProduct } from "@/lib/admin-types";

export function ProductEditor({ product, onClose, onSave }: { product: AdminProduct | null; onClose: () => void; onSave: (product: AdminProduct) => void }) {
  const [category, setCategory] = useState(product?.category ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [compatibility, setCompatibility] = useState<string[]>(product?.compatibility ?? []);
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const effectiveImage = image || categories.find((item) => item.id === category)?.image || "";
  const allMakes = [...brands, "Other"];
  const disabled = busy || uploading;

  function report(err: unknown) {
    setError(err instanceof Error ? err.message : "Please try again.");
    if (err instanceof AdminRequestError && err.status === 401) setSessionExpired(true);
  }

  async function upload(file?: File) {
    if (!file || disabled) return;
    setError(""); setUploadMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG or WebP photo."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("Your photo must be 3 MB or smaller."); return; }
    setUploading(true);
    try {
      const data = new FormData(); data.append("file", file);
      const result = await adminRequest<{ image: string }>("/api/admin/uploads", { method: "POST", body: data });
      setImage(result.image); setUploadMessage("Photo uploaded and ready to save.");
    } catch (err) { report(err); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    setError("");
    if (!compatibility.length) { setError("Select at least one motorcycle make, or choose Other."); return; }
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const price = Number(values.price);
    if (!Number.isInteger(price) || price < 1 || price > 10_000_000) { setError("Enter a whole-kwacha price between MK 1 and MK 10,000,000."); return; }
    setBusy(true);
    try {
      const result = await adminRequest<{ product: AdminProduct }>(product ? `/api/admin/products/${product.id}` : "/api/admin/products", jsonRequest(product ? "PATCH" : "POST", {
        name: values.name, description: values.description, price, category, image: effectiveImage, compatibility, active, featured, ...(product ? { version: product.version } : {}),
      }));
      onSave(result.product);
    } catch (err) { report(err); }
    finally { setBusy(false); }
  }

  return <Dialog title={product ? "Fine-tune your product." : "Add your next rider essential."} eyebrow={product ? "EDIT PRODUCT" : "NEW CATALOGUE PRODUCT"} onClose={() => { if (!disabled) onClose(); }} wide>
    <form className="customer-form admin-product-form" onSubmit={submit}>
      <div className="admin-editor-grid">
        <div className="admin-editor-fields">
          <div className="admin-form-section-title"><span>01</span><h3>The part details</h3></div>
          <label>Product name <span>*</span><input name="name" defaultValue={product?.name ?? ""} placeholder="e.g. Yamaha YBR 125 Air Filter" minLength={2} maxLength={120} required disabled={disabled} /></label>
          <div className="form-row"><label>Category <span>*</span><select value={category} onChange={(event) => setCategory(event.target.value)} required disabled={disabled}><option value="" disabled>Choose a category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Price <span>*</span><div className="admin-price-input"><span>MK</span><input name="price" type="number" inputMode="numeric" defaultValue={product?.price ?? ""} placeholder="0" min={1} max={10000000} step={1} required disabled={disabled} /></div><small>Malawi kwacha · whole amounts</small></label></div>
          <label>Description <span>*</span><textarea name="description" defaultValue={product?.description ?? ""} placeholder="Describe the part, specifications and any fitment details riders should know." rows={4} maxLength={3000} required disabled={disabled} /></label>
          <fieldset className="admin-makes"><legend>Compatible motorcycle makes <span>*</span></legend><div className="admin-makes-heading"><p>Choose makes with compatible models.</p><button type="button" disabled={disabled} onClick={() => setCompatibility(compatibility.length === allMakes.length ? [] : allMakes)}>{compatibility.length === allMakes.length ? "Clear all" : "Select all"}</button></div><div className="admin-make-options">{allMakes.map((make) => <label key={make} className={compatibility.includes(make) ? "checked" : ""}><input type="checkbox" checked={compatibility.includes(make)} onChange={(event) => setCompatibility((current) => event.target.checked ? [...current, make] : current.filter((item) => item !== make))} disabled={disabled} />{make}</label>)}</div></fieldset>
        </div>
        <div className="admin-editor-publishing">
          <div className="admin-form-section-title"><span>02</span><h3>Make it shop-ready</h3></div>
          <span className="admin-field-label">Product photo</span>
          <div className={`admin-photo-preview ${effectiveImage.startsWith("/images/") ? "admin-example-photo" : ""}`}>{effectiveImage ? <Image src={effectiveImage} alt="Product photo preview" fill sizes="300px" unoptimized={effectiveImage.startsWith("/api/")} /> : <div><AdminIcon name="image" size={34} /><span>A good photo goes a long way.</span></div>}{uploading && <div className="admin-upload-overlay"><span className="spinner" /> Optimizing your photo…</div>}</div>
          <input className="admin-file-input" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload product photo" onChange={(event) => upload(event.target.files?.[0])} disabled={disabled} />
          <button className="button button-outline button-full admin-upload-button" type="button" onClick={() => fileInput.current?.click()} disabled={disabled}><AdminIcon name="upload" size={16} /> {effectiveImage ? "Upload a different photo" : "Upload product photo"}</button>
          <p className="admin-upload-help">JPG, PNG or WebP · Up to 3 MB</p>
          {category && <button type="button" className="admin-use-example" onClick={() => { setImage(""); setUploadMessage(""); }} disabled={disabled}>Use the category illustration instead</button>}
          {uploadMessage && <p className="admin-upload-success" role="status"><Icon name="check-circle" size={14} /> {uploadMessage}</p>}
          <div className="admin-publish-options"><label className="admin-setting"><span><strong>Visible in your shop</strong><small>{active ? "Customers can find and order this part." : "Hidden from customers. You can publish it later."}</small></span><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} role="switch" aria-label="Visible in your shop" disabled={disabled} /></label><label className="admin-setting"><span><strong>Feature on the homepage</strong><small>Showcase this part in rider essentials.</small></span><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} role="switch" aria-label="Feature on the homepage" disabled={disabled} /></label><p>The four most recently updated, visible featured parts appear on the homepage.</p></div>
        </div>
      </div>
      <ErrorMessage message={error} />
      {sessionExpired && <a className="text-link" href="/admin">Sign in again to continue <Icon name="arrow-right" size={16} /></a>}
      <div className="admin-editor-footer"><span><Icon name="shield" size={15} /> Saved securely to your catalogue</span><div><button type="button" className="button button-outline" onClick={onClose} disabled={disabled}>Cancel</button><button type="submit" className="button button-orange" disabled={disabled}>{busy ? <><span className="spinner" /> Saving…</> : uploading ? "Uploading…" : <>{product ? "Save changes" : "Add product"}<Icon name="check" size={17} /></>}</button></div></div>
    </form>
  </Dialog>;
}

export function PriceEditor({ product, onClose, onSave }: { product: AdminProduct; onClose: () => void; onSave: (product: AdminProduct) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const price = Number(new FormData(event.currentTarget).get("price"));
    setBusy(true); setError("");
    try {
      const result = await adminRequest<{ product: AdminProduct }>(`/api/admin/products/${product.id}`, jsonRequest("PATCH", { price, version: product.version }));
      onSave(result.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      if (err instanceof AdminRequestError && err.status === 401) setSessionExpired(true);
    } finally { setBusy(false); }
  }
  return <Dialog title="A new price. Just like that." eyebrow="QUICK PRICE UPDATE" onClose={() => { if (!busy) onClose(); }}><form className="customer-form admin-price-form" onSubmit={submit}><div className="admin-price-product"><div><Image src={product.image} alt="" width={60} height={65} unoptimized={product.image.startsWith("/api/")} /></div><p><strong>{product.name}</strong><span>Current price: {money(product.price)}</span></p></div><label>New price in Malawi kwacha <span>*</span><div className="admin-price-input"><span>MK</span><input name="price" aria-label="New price in Malawi kwacha" type="number" defaultValue={product.price} min={1} max={10000000} step={1} inputMode="numeric" required disabled={busy} /></div></label><p className="admin-price-explainer"><Icon name="info" size={16} /> The new price will appear in the shop after saving. Existing order records keep their original prices.</p><ErrorMessage message={error} />{sessionExpired && <a className="text-link" href="/admin">Sign in again to continue</a>}<button className="button button-orange button-full" type="submit" disabled={busy}>{busy ? <><span className="spinner" /> Updating price…</> : <>Update price <Icon name="check" size={17} /></>}</button></form></Dialog>;
}
