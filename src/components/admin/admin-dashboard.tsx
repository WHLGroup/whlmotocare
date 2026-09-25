"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandMark, Icon } from "@/components/icons";
import { AdminIcon } from "@/components/admin/admin-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProductEditor, PriceEditor } from "@/components/admin/product-editor";
import { Dialog, ErrorMessage } from "@/components/ui";
import { categories, categoryName, money } from "@/lib/catalog";
import { AdminRequestError, adminRequest, jsonRequest } from "@/lib/admin-client";
import type { AdminProduct, AdminUser } from "@/lib/admin-types";

const pageSize = 8;
const sortProducts = (products: AdminProduct[]) => [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));

function DeleteProduct({ product, onClose, onDelete }: { product: AdminProduct; onClose: () => void; onDelete: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await adminRequest(`/api/admin/products/${product.id}`, jsonRequest("DELETE", { version: product.version }));
      onDelete(product.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <Dialog title="Remove this part?" eyebrow="DELETE PRODUCT" onClose={() => { if (!busy) onClose(); }}><form className="customer-form admin-delete-form" onSubmit={submit}><div className="admin-delete-icon"><Icon name="trash" size={26} /></div><p><strong>{product.name}</strong> will be permanently removed from your catalogue and shop. Existing customer order records will not be changed.</p><div className="admin-delete-tip"><Icon name="info" size={17} /><p>Just out of stock? Cancel and switch off its visibility instead. You can publish it again at any time.</p></div><ErrorMessage message={error} /><div className="admin-delete-actions"><button type="button" className="button button-outline" onClick={onClose} disabled={busy}>Keep product</button><button type="submit" className="button admin-button-danger" disabled={busy}>{busy ? <><span className="spinner" /> Deleting…</> : <>Delete product <Icon name="trash" size={16} /></>}</button></div></form></Dialog>;
}

export default function AdminDashboard({ user, initialProducts }: { user: AdminUser; initialProducts: AdminProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined);
  const [pricing, setPricing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [notice]);

  function report(err: unknown) {
    setError(err instanceof Error ? err.message : "Please try again.");
    if (err instanceof AdminRequestError && err.status === 401) setSessionExpired(true);
  }

  function saved(product: AdminProduct, message: string) {
    setProducts((current) => sortProducts([product, ...current.filter((item) => item.id !== product.id)]));
    setEditing(undefined); setPricing(null); setNotice(message); setError("");
  }

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true); setError("");
    try {
      const result = await adminRequest<{ products: AdminProduct[] }>("/api/admin/products");
      setProducts(result.products); setNotice("Your catalogue is up to date.");
    } catch (err) { report(err); }
    finally { setRefreshing(false); }
  }

  async function changeVisibility(product: AdminProduct) {
    if (busyId) return;
    setBusyId(product.id); setError("");
    try {
      const result = await adminRequest<{ product: AdminProduct }>(`/api/admin/products/${product.id}`, jsonRequest("PATCH", { active: !product.active, version: product.version }));
      saved(result.product, result.product.active ? "Product published. Customers can now order it." : "Product hidden from the shop. You can publish it again anytime.");
    } catch (err) { report(err); }
    finally { setBusyId(null); }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true); setError("");
    try {
      await adminRequest("/api/admin/logout", { method: "POST" });
      window.location.replace("/admin");
    } catch (err) { report(err); setSigningOut(false); }
  }

  const published = products.filter((product) => product.active).length;
  const featured = products.filter((product) => product.active && product.featured).length;
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = products.filter((product) => (category === "all" || category === product.category) && (status === "all" || (status === "published" ? product.active : !product.active)) && `${product.name} ${categoryName(product.category)} ${product.compatibility.join(" ")}`.toLowerCase().includes(normalizedQuery));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const initials = user.name.split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase();
  const clearFilters = () => { setQuery(""); setCategory("all"); setStatus("all"); setPage(1); };

  return <div className="admin-frame">
    <a href="#admin-main" className="skip-link">Skip to catalogue</a>
    <aside className="admin-sidebar">
      <Link href="/" className="admin-sidebar-brand" aria-label="WHL Motocare home"><BrandMark light /></Link>
      <span className="admin-area-label"><AdminIcon name="lock" size={11} /> OWNER WORKSPACE</span>
      <div className="admin-side-nav"><span>MANAGE YOUR SHOP</span><a href="#admin-main" className="active" aria-current="page"><AdminIcon name="grid" size={19} />Catalogue & pricing <Icon name="chevron-right" size={15} /></a><Link href="/shop" target="_blank" rel="noreferrer"><AdminIcon name="eye" size={19} />View storefront <Icon name="arrow-up-right" size={15} /></Link></div>
      <div className="admin-sidebar-note"><Icon name="motorcycle" size={32} /><strong>Quality parts.<br />Smooth rides.</strong><p>Your next rider is looking for the right part. Keep your catalogue ready.</p><span>THE WHL WAY <Icon name="arrow-up-right" size={14} /></span></div>
      <div className="admin-sidebar-user"><span className="admin-avatar">{initials}</span><div><strong>{user.name}</strong><span>Shop administrator</span></div><AdminIcon name="lock" size={15} /></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-top-header"><div><span>WHL CONTROL ROOM</span><Icon name="chevron-right" size={12} /><strong>Catalogue</strong></div><div className="admin-top-actions"><ThemeToggle /><Link href="/shop" target="_blank" rel="noreferrer" className="text-link">View shop <Icon name="arrow-up-right" size={16} /></Link><span className="admin-header-divider" /><button onClick={signOut} disabled={signingOut}><AdminIcon name="logout" size={16} />{signingOut ? "Signing out…" : "Sign out"}</button></div></header>
      <main className="admin-main" id="admin-main">
        <div className="admin-page-heading"><div><p className="eyebrow">YOUR PARTS. YOUR PRICES.</p><h1>Catalogue & pricing<span>.</span></h1><p>Keep your shop stocked with the right parts and the latest prices.</p></div><button className="button button-orange" onClick={() => setEditing(null)}><Icon name="plus" size={18} />Add product</button></div>
        <div className="admin-stats"><div><span className="admin-stat-icon"><Icon name="package" size={22} /></span><p><span>Total products</span><strong>{products.length}</strong></p><small>Your complete catalogue</small></div><div><span className="admin-stat-icon green"><AdminIcon name="eye" size={22} /></span><p><span>Published</span><strong>{published}</strong></p><small>Ready for customers to order</small></div><div><span className="admin-stat-icon muted"><AdminIcon name="eye-off" size={22} /></span><p><span>Hidden</span><strong>{products.length - published}</strong></p><small>Only visible to you</small></div><div><span className="admin-stat-icon orange"><Icon name="star" size={22} /></span><p><span>Featured</span><strong>{featured}</strong></p><small>Up to 4 shown on the homepage</small></div></div>
        <ErrorMessage message={error} />{sessionExpired && <a className="text-link admin-signin-link" href="/admin">Sign in again to continue <Icon name="arrow-right" size={16} /></a>}
        <section className="admin-catalogue" aria-label="Manage products">
          <div className="admin-catalogue-heading"><div><h2>Your products</h2><span>{products.length} in your catalogue</span></div><button className="admin-refresh" onClick={refresh} disabled={refreshing || Boolean(busyId)} aria-label="Refresh catalogue"><span className={refreshing ? "admin-spinning" : ""}><AdminIcon name="refresh" size={16} /></span>{refreshing ? "Refreshing…" : "Refresh"}</button></div>
          <div className="admin-catalogue-controls"><div className="admin-status-tabs" aria-label="Filter by visibility">{[{ value: "all", label: "All products", count: products.length }, { value: "published", label: "Published", count: published }, { value: "hidden", label: "Hidden", count: products.length - published }].map((item) => <button key={item.value} aria-pressed={status === item.value} className={status === item.value ? "active" : ""} onClick={() => { setStatus(item.value); setPage(1); }}>{item.label}<span>{item.count}</span></button>)}</div><div className="admin-filter-row"><div className="search-field"><Icon name="search" size={17} /><input aria-label="Search admin catalogue" placeholder="Search parts or motorcycle makes…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />{query && <button className="icon-button" onClick={() => { setQuery(""); setPage(1); }} aria-label="Clear catalogue search"><Icon name="x" size={14} /></button>}</div><label className="admin-category-select"><Icon name="filter" size={17} /><select aria-label="Filter catalogue by category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="all">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div></div>
          {shown.length ? <div className="admin-table-wrap"><table className="admin-product-table"><thead><tr><th scope="col">PRODUCT</th><th scope="col">PRICE / MWK</th><th scope="col">VISIBILITY</th><th scope="col">FEATURED</th><th scope="col" className="admin-actions-heading">ACTIONS</th></tr></thead><tbody>{shown.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><div className={`admin-product-thumb ${product.image.startsWith("/images/") ? "admin-example-photo" : ""}`}><Image src={product.image} alt="" fill sizes="58px" unoptimized={product.image.startsWith("/api/")} /></div><div><button className="admin-product-name" onClick={() => setEditing(product)}>{product.name}</button><span>{categoryName(product.category)}<span className="admin-cell-dot">·</span>{product.compatibility.slice(0, 2).join(", ")}{product.compatibility.length > 2 ? ` +${product.compatibility.length - 2}` : ""}</span><small>Updated {new Date(product.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Blantyre" })}</small></div></div></td><td><span className="admin-mobile-label">PRICE</span><button className="admin-table-price" aria-label={`Edit price for ${product.name}`} onClick={() => setPricing(product)}>{money(product.price)}<AdminIcon name="edit" size={13} /></button></td><td><button className={`admin-visibility ${product.active ? "is-published" : "is-hidden"}`} role="switch" aria-checked={product.active} aria-label={`Visibility of ${product.name}`} onClick={() => changeVisibility(product)} disabled={Boolean(busyId)}><span className="admin-switch-track"><span /></span>{busyId === product.id ? "Saving…" : product.active ? "Published" : "Hidden"}</button></td><td><span className={`admin-featured ${product.featured ? "is-featured" : ""}`}><Icon name="star" size={14} />{product.featured ? "Featured" : "—"}</span></td><td><div className="admin-row-actions"><button className="admin-edit-button" onClick={() => setEditing(product)} disabled={busyId === product.id} aria-label={`Edit ${product.name}`}><AdminIcon name="edit" size={14} />Edit</button><button className="icon-button admin-delete-button" onClick={() => setDeleting(product)} disabled={busyId === product.id} aria-label={`Delete ${product.name}`}><Icon name="trash" size={16} /></button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><div><Icon name={products.length ? "search" : "package"} size={32} /></div><h3>{products.length ? "No parts on this shelf." : "Your catalogue starts here."}</h3><p>{products.length ? "Try another search or clear your filters to see all products." : "Add your first product, set its price and make it available to your riders."}</p>{products.length ? <button className="button button-outline" onClick={clearFilters}>Clear filters <Icon name="x" size={15} /></button> : <button className="button button-orange" onClick={() => setEditing(null)}>Add your first product <Icon name="plus" size={17} /></button>}</div>}
          <div className="admin-table-footer"><span>{filtered.length ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} products` : "0 matching products"}</span>{(query || category !== "all" || status !== "all") && <button className="admin-clear-filters" onClick={clearFilters}>Clear filters <Icon name="x" size={12} /></button>}<div className="admin-pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous products page">←</button><span>{currentPage} / {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next products page">→</button></div></div>
        </section>
        <div className="admin-catalogue-tip"><div className="admin-tip-symbol"><Icon name="bolt" size={20} /></div><div><strong>A little update. A better shopping experience.</strong><p>Click any price for a quick update. Use visibility to hide a part without deleting it.</p></div><Link href="/shop" target="_blank" rel="noreferrer">See your shop <Icon name="arrow-up-right" size={17} /></Link></div>
        <footer className="admin-main-footer"><span><AdminIcon name="lock" size={12} /> Private owner workspace</span><p>WHL MOTOCARE SUPPLIES · Ndirande, Blantyre</p></footer>
      </main>
    </div>
    {editing !== undefined && <ProductEditor product={editing} onClose={() => setEditing(undefined)} onSave={(product) => saved(product, editing === null ? "Product added to your catalogue." : "Product updated. Your shop has the latest details.")} />}
    {pricing && <PriceEditor product={pricing} onClose={() => setPricing(null)} onSave={(product) => saved(product, `Price updated to ${money(product.price)}.`)} />}
    {deleting && <DeleteProduct product={deleting} onClose={() => setDeleting(null)} onDelete={(id) => { setProducts((current) => current.filter((item) => item.id !== id)); setDeleting(null); setNotice("Product deleted. Existing customer orders are unchanged."); }} />}
    {notice && <div className="toast admin-toast" role="status"><span className="toast-check"><Icon name="check" size={16} /></span><span>{notice}</span><button className="toast-close" onClick={() => setNotice("")} aria-label="Dismiss confirmation"><Icon name="x" size={15} /></button></div>}
  </div>;
}
