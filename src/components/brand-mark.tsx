"use client";

import { useState } from "react";

/** Where the real badge artwork lives. Replace this one file to update the whole site. */
const LOGO_SRC = "/images/logo.png";

/**
 * Fallback drawn in code, used only while no artwork file is present.
 *
 * It reproduces the typographic core of the badge so the site never shows a
 * broken image. As soon as `public/images/logo.png` exists, the real artwork
 * is used instead and this is never rendered.
 */
function CodedMark() {
  return (
    <>
      <svg className="brand-badge" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="27.5" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="5.6 3.9" />
        <circle cx="32" cy="32" r="23.5" fill="currentColor" />
        <circle cx="32" cy="32" r="20.5" fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeDasharray="60 38" transform="rotate(-38 32 32)" />
        <g fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="23" cy="37" r="5.4" />
          <circle cx="43" cy="37" r="5.4" />
          <path d="m23 37 5.5-8.5M28.5 28.5h9l5.5 8.5" />
          <path d="M26 28.5h6M36 24h4l3 8" stroke="var(--brand)" />
        </g>
      </svg>
      <span className="brand-type">
        <span className="brand-name">
          W<span className="brand-h">H</span>L
        </span>
        <span className="brand-motocare">
          MOTO<span>CARE</span>
        </span>
        <span className="brand-supplies">SUPPLIES</span>
      </span>
    </>
  );
}

/**
 * The WHL Motocare logo.
 *
 * Renders the artwork at `public/images/logo.png` exactly as supplied. If that
 * file is missing the coded mark above is shown instead, so a fresh checkout
 * never displays a broken image.
 *
 * `light` marks placements on dark backgrounds (footer, admin sidebar), where
 * the artwork sits on a light plate so it stays legible whether the PNG has a
 * transparent or a white background.
 */
export function BrandMark({ light = false }: { light?: boolean }) {
  const [artworkMissing, setArtworkMissing] = useState(false);

  /**
   * The image is served in the initial HTML, so a 404 can fire before React
   * hydrates and `onError` would never run. Inspecting the node as it mounts
   * catches a request that already failed.
   */
  const detectMissingArtwork = (node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) setArtworkMissing(true);
  };

  return (
    <span className={`brand-mark ${artworkMissing ? "" : "brand-mark-image"} ${light ? "brand-light" : ""}`}>
      {artworkMissing ? (
        <CodedMark />
      ) : (
        // Plain <img>: next/image cannot fall back when the file is absent,
        // and this asset is a fixed-height logo, not a responsive photo.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={detectMissingArtwork}
          className="brand-logo-img"
          src={LOGO_SRC}
          alt="WHL Motocare Supplies — quality parts, smooth rides"
          onError={() => setArtworkMissing(true)}
          draggable={false}
        />
      )}
    </span>
  );
}
