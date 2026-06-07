// src/pages/StoreDetails.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchStoreById } from "../api/storesApi";
import "../styles/store-details.css";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
const BACKEND_BASE = "";

export default function StoreDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // === Učitavanje radnje ===
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setState({ loading: true, error: "" });
        const data = await fetchStoreById(id);

        if (!isMounted) return;
        setStore(data);
        setActiveImageIndex(0);
        setState({ loading: false, error: "" });
      } catch (err) {
        console.error("StoreDetails fetch error:", err);
        if (!isMounted) return;
        setState({
          loading: false,
          error: "Greška pri učitavanju detalja radnje.",
        });
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // === Stanja učitavanja / greške ===
  if (state.loading) {
    return (
      <main className="store-page">
        <div className="store-shell">
          <p className="store-note">Učitavanje radnje…</p>
        </div>
      </main>
    );
  }

  if (state.error || !store) {
    return (
      <main className="store-page">
        <div className="store-shell">
          <p className="store-note">
            {state.error || "Radnja nije pronađena."}
          </p>
          <button
            type="button"
            className="store-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Nazad
          </button>
        </div>
      </main>
    );
  }

  // === Slike (cover + galerija) ===
  const baseCover = store.imageUrl
    ? `${BACKEND_BASE}${store.imageUrl}`
    : null;

  const gallery = [
    ...(baseCover ? [baseCover] : []),
    ...(Array.isArray(store.galleryUrls)
      ? store.galleryUrls.map((u) =>
          u.startsWith("http") ? u : `${BACKEND_BASE}${u}`
        )
      : []),
  ];

  const activeSrc =
    gallery.length > 0 ? gallery[Math.min(activeImageIndex, gallery.length - 1)] : null;

  const category = store.category || "Radnja";

  // === Radno vrijeme – logika Pon–Sub / Pon–Pet / Subota / Nedjelja ===
  const rawWeekdays = (store.workHoursWeekdays || "").trim();
  const rawSaturday = (store.workHoursSaturday || "").trim();
  const rawSunday = (store.workHoursSunday || "").trim();

  const hoursRows = [];

  if (rawWeekdays || rawSaturday || rawSunday) {
    if (rawWeekdays && rawSaturday && rawWeekdays === rawSaturday) {
      hoursRows.push({ label: "Pon–Sub", value: rawWeekdays });
    } else {
      if (rawWeekdays) hoursRows.push({ label: "Pon–Pet", value: rawWeekdays });
      if (rawSaturday) hoursRows.push({ label: "Subota", value: rawSaturday });
    }
    if (rawSunday) hoursRows.push({ label: "Nedjelja", value: rawSunday });
  }

  // fallback na staro jedinstveno polje
  if (!hoursRows.length && store.workHours) {
    hoursRows.push({ label: "Radno vrijeme", value: store.workHours });
  }

  return (
    <main className="store-page">
      <div className="store-shell">
        {/* Back dugme / breadcrumb */}
        <button
          type="button"
          className="store-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Nazad na listu
        </button>

        {/* Header */}
        <header className="store-header">
          <p className="store-category">{category}</p>
          <h1 className="store-title">{store.name}</h1>
          {store.floor && (
            <p className="store-floor">Sprat: {store.floor}</p>
          )}
        </header>

        {/* Glavni layout: slike + info */}
        <section className="store-layout">
          {/* Lijevo – slike */}
          <div className="store-gallery">
            {activeSrc ? (
              <>
                <div className="store-cover">
  {isVideoUrl(activeSrc) ? (
  <video
    key={activeSrc}
    className="store-media"
    src={activeSrc}
    controls
    playsInline
    preload="metadata"
    onError={(e) => console.log("DETAILS VIDEO ERROR:", activeSrc, e)}
  />
) : (
  <img
    className="store-media"
    src={activeSrc}
    alt={`Prodavnica ${store.name}`}
    decoding="async"
  />
)}


</div>


                {gallery.length > 1 && (
                  <div className="store-thumbs">
                    {gallery.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={
                          "store-thumb-btn" +
                          (idx === activeImageIndex ? " store-thumb-btn--active" : "")
                        }
                        onClick={() => setActiveImageIndex(idx)}
                      >
                        {isVideoUrl(src) ? (
  <video
    key={src}
    className="store-thumb-media"
    src={src}
    muted
    playsInline
    preload="none"
  />
) : (
  <img
    className="store-thumb-media"
    src={src}
    alt={`${store.name}, fotografija ${idx + 1}`}
    loading="lazy"
    decoding="async"
  />
)}



                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="store-cover store-cover--empty">
                Bez fotografije
              </div>
            )}
          </div>

          {/* Desno – kartice sa info */}
          <aside className="store-info">
            {/* Radno vrijeme */}
            <section className="store-info-card">
              <h2>Radno vrijeme</h2>

              {hoursRows.length ? (
                <ul className="store-hours">
                  {hoursRows.map((row, idx) => (
                    <li key={idx}>
                      <span>{row.label}</span>
                      <span>{row.value || "—"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="store-hours-empty">
                  Radno vrijeme nije navedeno.
                </p>
              )}

              {store.workHours && (
                <p className="store-hours-note">
                  Prikazano i kao: <strong>{store.workHours}</strong>
                </p>
              )}
            </section>

            {/* Kontakt */}
            <section className="store-info-card">
              <h2>Kontakt</h2>
              {store.contactPhone ? (
                <p className="store-contact">
                  Telefon:{" "}
                  <a href={`tel:${store.contactPhone}`}>
                    {store.contactPhone}
                  </a>
                </p>
              ) : (
                <p className="store-contact store-contact--muted">
                  Kontakt telefon nije naveden.
                </p>
              )}
            </section>
          </aside>
        </section>

        {/* Opis ispod */}
        {store.description && (
          <section className="store-detail-description">
            <h2>O radnji</h2>
            <p>{store.description}</p>
          </section>
        )}
      </div>
    </main>
  );
}
