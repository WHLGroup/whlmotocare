"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

export function Dialog({ title, eyebrow, children, onClose, drawer = false, wide = false }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; drawer?: boolean; wide?: boolean }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("input, select, textarea, [data-initial-focus]");
      (first ?? panel.current)?.focus();
    }, 50);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !panel.current) return;
      const elements = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter((element) => element.offsetParent !== null);
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { window.clearTimeout(timeout); document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(<div className={`dialog-backdrop ${drawer ? "drawer-backdrop" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} className={`dialog ${drawer ? "dialog-drawer" : ""} ${wide ? "dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
      <div className="dialog-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={id}>{title}</h2></div><button type="button" className="icon-button close-dialog" onClick={onClose} aria-label="Close dialog"><Icon name="x" /></button></div>
      <div className="dialog-body">{children}</div>
    </div>
  </div>, document.body);
}

export function Quantity({ value, onChange, name = "part" }: { value: number; onChange: (quantity: number) => void; name?: string }) {
  return <div className="quantity"><button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease ${name} quantity`}><Icon name="minus" size={14} /></button><span aria-live="polite">{value}</span><button type="button" onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label={`Increase ${name} quantity`}><Icon name="plus" size={14} /></button></div>;
}

export function ErrorMessage({ message }: { message: string }) {
  return message ? <div className="form-error" role="alert"><Icon name="info" size={18} /><span>{message}</span></div> : null;
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return <button type="submit" disabled={busy} className="button button-orange button-full">{busy ? <><span className="spinner" /> Sending your request…</> : children}</button>;
}
