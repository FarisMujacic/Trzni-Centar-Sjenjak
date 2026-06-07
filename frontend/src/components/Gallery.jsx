import React, { useEffect, useRef, useState } from "react";
import "../styles/gallery.css";

const images = [
  "https://photos.wikimapia.org/p/00/00/62/93/06_big.jpg",
  "/s1.jpg",
  "https://tuzlanski.ba/wp-content/uploads/2013/03/sjenjak-trzni.JPG",
  "/s2.jpg",
  "/s3.jpg",
  "/s4.jpg",
];

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (activeIndex === null) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeIndex]);

  return (
    <section className="mall-gallery" id="galerija" aria-labelledby="gallery-title">
      <div className="site-container">
        <header className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Doživite prostor</p>
            <h2 id="gallery-title">Galerija centra</h2>
          </div>
          <p>Pogled na Tržni centar Sjenjak i njegovu neposrednu okolinu.</p>
        </header>

        <div className="mall-gallery__grid">
          {images.map((src, index) => (
            <button
              type="button"
              className={`mall-gallery__item mall-gallery__item--${index + 1}`}
              key={src}
              onClick={() => setActiveIndex(index)}
              aria-label={`Otvori fotografiju centra ${index + 1}`}
            >
              <img
                src={src}
                alt={`Tržni centar Sjenjak, fotografija ${index + 1}`}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <div
          className="gallery-dialog__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null);
          }}
        >
          <section
            className="gallery-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Uvećana fotografija centra"
          >
            <button
              ref={closeRef}
              type="button"
              className="gallery-dialog__close"
              onClick={() => setActiveIndex(null)}
              aria-label="Zatvori galeriju"
            >
              ×
            </button>
            <button
              type="button"
              className="gallery-dialog__nav gallery-dialog__nav--left"
              onClick={() =>
                setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1))
              }
              aria-label="Prethodna fotografija"
            >
              ‹
            </button>
            <img
              src={images[activeIndex]}
              alt={`Tržni centar Sjenjak, fotografija ${activeIndex + 1}`}
            />
            <button
              type="button"
              className="gallery-dialog__nav gallery-dialog__nav--right"
              onClick={() =>
                setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1))
              }
              aria-label="Sljedeća fotografija"
            >
              ›
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
