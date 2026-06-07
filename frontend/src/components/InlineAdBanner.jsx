import React, { useEffect, useRef, useState } from "react";
import SponsoredLabel from "./SponsoredLabel";
import "../styles/inline-ad.css";

export default function InlineAdBanner({ ad }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!ad) return null;

  return (
    <section className="inline-ad-section" aria-label="Sponzorisani sadržaj">
      <div className="site-container">
        <article className="inline-ad">
          {ad.imageUrl && (
            <img src={ad.imageUrl} alt={ad.title} loading="lazy" decoding="async" />
          )}
          <div className="inline-ad__shade" />
          <div className="inline-ad__content">
            <SponsoredLabel compact />
            {ad.category && <p>{ad.category}</p>}
            <h2>{ad.title}</h2>
            <button type="button" className="button button--light" onClick={() => setOpen(true)}>
              Saznaj više
            </button>
          </div>
        </article>
      </div>

      {open && (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="content-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="banner-dialog-title"
          >
            <button
              ref={closeRef}
              type="button"
              className="content-dialog__close"
              onClick={() => setOpen(false)}
              aria-label="Zatvori detalje oglasa"
            >
              ×
            </button>
            <SponsoredLabel compact />
            <h2 id="banner-dialog-title">{ad.title}</h2>
            {ad.imageUrl && <img className="content-dialog__image" src={ad.imageUrl} alt={ad.title} />}
            {ad.category && <p className="content-dialog__meta">{ad.category}</p>}
            {ad.description && <p>{ad.description}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
