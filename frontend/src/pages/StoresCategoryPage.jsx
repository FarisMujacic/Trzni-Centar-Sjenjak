import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStores } from "../api/storesApi";
import "../styles/store-list.css";

export default function StoresCategoryPage({ category, title, subtitle }) {
  const [stores, setStores] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let active = true;

    fetchStores(category)
      .then((data) => {
        if (!active) return;
        setStores(Array.isArray(data) ? data : []);
        setState({ loading: false, error: "" });
      })
      .catch((error) => {
        console.error("Category stores fetch error:", error);
        if (!active) return;
        setState({
          loading: false,
          error: "Greška pri učitavanju prodavnica.",
        });
      });

    return () => {
      active = false;
    };
  }, [category]);

  return (
    <main className="store-list-page">
      <header className="store-list-page__hero">
        <div className="site-container">
          <p className="eyebrow">Sjenjak Center</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <section className="site-container store-list-page__content">
        {state.loading && <p className="status-note">Učitavanje prodavnica…</p>}
        {state.error && <p className="status-note status-note--error">{state.error}</p>}
        {!state.loading && !state.error && stores.length === 0 && (
          <p className="status-note">
            Trenutno nema unesenih prodavnica u ovoj kategoriji.
          </p>
        )}

        <div className="store-list-grid">
          {stores.map((store) => (
            <article key={store.id} className="store-list-card">
              <Link
                to={`/radnja/${store.id}`}
                className="store-list-card__link"
                aria-label={`Otvori detalje prodavnice ${store.name}`}
              >
                <div className="store-list-card__media">
                  {store.imageUrl ? (
                    <img
                      src={store.imageUrl}
                      alt={`Prodavnica ${store.name}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="store-list-card__placeholder">Bez fotografije</div>
                  )}
                </div>
                <div className="store-list-card__body">
                  <p className="store-list-card__category">{store.category}</p>
                  <h2>{store.name}</h2>
                  {store.description && <p>{store.description}</p>}
                  <span className="text-link">Pogledaj detalje</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
