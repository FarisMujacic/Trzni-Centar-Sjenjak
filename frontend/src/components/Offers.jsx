import React, { useEffect, useRef, useState } from "react";
import SponsoredLabel from "./SponsoredLabel";
import "../styles/offers.css";

function normalizeImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/")) return imageUrl;
  const uploadsIndex = imageUrl.indexOf("/uploads/");
  if (uploadsIndex >= 0) return imageUrl.substring(uploadsIndex);
  return `/${imageUrl.replace(/^\/+/, "")}`;
}

export default function Offers({ offers, loading }) {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!selectedOffer) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedOffer(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedOffer]);

  return (
    <section className="featured-offers" id="aktuelne-ponude">
      <div className="site-container">
        <header className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Aktuelno u centru</p>
            <h2>Izdvojene ponude</h2>
          </div>
          <p>
            Promocije i novosti prikazane direktno iz aktuelnog sadržaja centra.
          </p>
        </header>

        {loading && <p className="status-note">Učitavanje ponuda…</p>}
        {!loading && offers.length === 0 && (
          <p className="status-note">Trenutno nema izdvojenih ponuda.</p>
        )}

        <div className="featured-offers__grid">
          {offers.map((offer) => {
            const imageSrc = normalizeImageUrl(offer.imageUrl);
            return (
              <article className="featured-ad" key={offer.id}>
                <div className="featured-ad__media">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={offer.title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="featured-ad__placeholder">Sjenjak Center</div>
                  )}
                  <SponsoredLabel />
                </div>
                <div className="featured-ad__content">
                  {offer.category && <p className="eyebrow">{offer.category}</p>}
                  <h3>{offer.title}</h3>
                  {offer.description && (
                    <p className="featured-ad__description">{offer.description}</p>
                  )}
                  <button
                    type="button"
                    className="button button--dark"
                    onClick={() => setSelectedOffer(offer)}
                  >
                    Prikaži detalje
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {selectedOffer && (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOffer(null);
          }}
        >
          <section
            className="content-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-dialog-title"
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="content-dialog__close"
              onClick={() => setSelectedOffer(null)}
              aria-label="Zatvori detalje ponude"
            >
              ×
            </button>
            <SponsoredLabel compact />
            <h2 id="offer-dialog-title">{selectedOffer.title}</h2>
            {selectedOffer.imageUrl && (
              <img
                className="content-dialog__image"
                src={normalizeImageUrl(selectedOffer.imageUrl)}
                alt={selectedOffer.title}
              />
            )}
            {selectedOffer.category && (
              <p className="content-dialog__meta">{selectedOffer.category}</p>
            )}
            {selectedOffer.description && <p>{selectedOffer.description}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
