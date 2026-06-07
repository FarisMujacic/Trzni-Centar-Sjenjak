import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/store-directory.css";

const categories = [
  "Sve",
  "Shopping",
  "Beauty & usluge",
  "Hrana i piće",
  "Ostalo",
];

export default function StoreDirectory({ stores, loading }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Sve");

  const visibleStores = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("bs");

    return stores.filter((store) => {
      const matchesCategory = category === "Sve" || store.category === category;
      const matchesQuery =
        !normalizedQuery ||
        String(store.name || "")
          .toLocaleLowerCase("bs")
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query, stores]);

  return (
    <section className="store-directory" id="prodavnice" aria-labelledby="stores-title">
      <div className="site-container">
        <header className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Direktorij centra</p>
            <h2 id="stores-title">Pronađite prodavnicu ili uslugu</h2>
          </div>
          <p>
            Pretražite postojeće lokacije po nazivu ili suzite prikaz prema
            kategoriji.
          </p>
        </header>

        <div className="store-directory__tools">
          <label className="store-search">
            <span className="sr-only">Pretraži prodavnice po nazivu</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m21 20-5.2-5.2a7 7 0 1 0-1 1L20 21l1-1ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pretraži po nazivu..."
            />
          </label>

          <div className="store-filters" aria-label="Filtriraj po kategoriji">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "is-active" : ""}
                onClick={() => setCategory(item)}
              >
                {item === "Beauty & usluge" ? "Ljepota i usluge" : item}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="status-note">Učitavanje prodavnica…</p>}
        {!loading && visibleStores.length === 0 && (
          <p className="status-note">Nema prodavnica koje odgovaraju pretrazi.</p>
        )}

        <div className="directory-grid">
          {visibleStores.map((store) => (
            <article className="directory-card" key={store.id}>
              <Link to={`/radnja/${store.id}`} className="directory-card__link">
                <div className="directory-card__media">
                  {store.imageUrl ? (
                    <img
                      src={store.imageUrl}
                      alt={`Prodavnica ${store.name}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="directory-card__placeholder">Bez fotografije</div>
                  )}
                </div>
                <div className="directory-card__body">
                  {store.category && (
                    <p className="directory-card__category">{store.category}</p>
                  )}
                  <h3>{store.name}</h3>
                  {store.description && (
                    <p className="directory-card__description">{store.description}</p>
                  )}
                  <span className="text-link">Pogledaj detalje</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
