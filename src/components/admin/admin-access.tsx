"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandMark, Icon } from "@/components/icons";
import { AdminIcon } from "@/components/admin/admin-icons";
import { ErrorMessage } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminRequest, jsonRequest } from "@/lib/admin-client";

export default function AdminAccess({ needsSetup, setupConfigured }: { needsSetup: boolean; setupConfigured: boolean }) {
  const keyInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const key = new URLSearchParams(window.location.hash.slice(1)).get("setup");
    if (key && keyInput.current) keyInput.current.value = key;
    if (key) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    if (needsSetup && values.password !== values.confirmPassword) { setError("Your passwords don’t match."); return; }
    setBusy(true);
    try {
      await adminRequest(needsSetup ? "/api/admin/setup" : "/api/admin/login", jsonRequest("POST", values));
      window.location.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setBusy(false);
    }
  }

  return <main className="admin-access">
    <section className="admin-access-story">
      <Image src="/images/motorcycle-hero.png" alt="" fill sizes="(max-width: 850px) 100vw, 45vw" priority />
      <div className="admin-story-overlay" />
      <Link className="admin-story-brand" href="/" aria-label="WHL Motocare home"><BrandMark light /></Link>
      <div className="admin-story-copy"><p className="eyebrow"><span className="eyebrow-line" /> BEHIND EVERY GREAT RIDE</p><h1>YOUR SHOP.<br />YOUR PARTS.<br /><span>YOUR CONTROL.</span></h1><p>Keep the parts coming and your shop up to date.<br />A simple space to manage everything riders see.</p></div>
      <div className="admin-story-bottom"><Icon name="pin" size={15} /> Ndirande Ma Plot, next to COSYS <span>WHL ADMIN</span></div>
    </section>
    <section className="admin-access-panel">
      <div className="admin-access-topbar"><Link href="/" className="admin-back-link"><span>←</span> Back to the storefront</Link><ThemeToggle /></div>
      <div className="admin-access-card">
        <div className="admin-access-icon"><AdminIcon name="lock" size={25} /></div>
        <p className="eyebrow">WHL CONTROL ROOM</p>
        <h2>{needsSetup ? "Make it your own." : "Welcome back."}</h2>
        <p className="admin-access-description">{needsSetup ? "Create your owner account to start adding parts and setting prices. Setup is private and only happens once." : "Sign in to manage your catalogue, update prices and keep your shop moving."}</p>
        {needsSetup && !setupConfigured ? <div className="admin-setup-note"><Icon name="shield" size={23} /><div><strong>Owner setup is locked</strong><p>A private ADMIN_SETUP_KEY must be configured on the server before an owner account can be created. No public sign-up is available.</p></div></div> : <form className="customer-form admin-auth-form" onSubmit={submit}>
          {needsSetup && <><label>Your name <span>*</span><input name="name" autoComplete="name" placeholder="Shop owner’s name" maxLength={80} required /></label><label>Private setup key <span>*</span><input ref={keyInput} name="setupKey" type="password" autoComplete="off" placeholder="From your private owner setup link" maxLength={256} required /><small>Your private setup link fills this in automatically.</small></label></>}
          <label>Email address <span>*</span><input name="email" type="email" autoComplete="username" placeholder="Your admin email address" maxLength={200} required /></label>
          <label>{needsSetup ? "Choose a password" : "Password"} <span>*</span><div className="admin-password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={needsSetup ? "new-password" : "current-password"} placeholder={needsSetup ? "At least 12 characters" : "Enter your password"} minLength={needsSetup ? 12 : 1} maxLength={128} required /><button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><AdminIcon name={showPassword ? "eye-off" : "eye"} size={18} /></button></div>{needsSetup && <small>Use a strong password or a memorable, long passphrase.</small>}</label>
          {needsSetup && <label>Confirm password <span>*</span><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" minLength={12} maxLength={128} required /></label>}
          <ErrorMessage message={error} />
          <button type="submit" className="button button-orange button-full" disabled={busy}>{busy ? <><span className="spinner" /> {needsSetup ? "Creating your account…" : "Signing in…"}</> : <>{needsSetup ? "Create owner account" : "Sign in to your shop"}<Icon name="arrow-right" size={18} /></>}</button>
          <p className="admin-secure-note"><Icon name="shield" size={15} /> {needsSetup ? "Your setup link stops working once your account is created." : "Private owner access. Your session expires after 12 hours."}</p>
        </form>}
      </div>
      <p className="admin-access-footer">WHL MOTOCARE SUPPLIES <span>Quality parts. Smooth rides.</span></p>
    </section>
  </main>;
}
