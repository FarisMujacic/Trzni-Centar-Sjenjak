import React from "react";
import { Link } from "react-router-dom";
import "../styles/whatweoffer.css";

const categories = [
  {
    name: "Shopping",
    link: "/shopping",
    icon: "bag",
    description: "Moda, nakit i prodavnice za svakodnevnu kupovinu.",
  },
  {
    name: "Ljepota i usluge",
    apiName: "Beauty & usluge",
    link: "/beauty",
    icon: "spark",
    description: "Njega, frizerske i druge praktične usluge.",
  },
  {
    name: "Hrana i piće",
    link: "/food",
    icon: "cup",
    description: "Mjesta za kafu, obrok i predah.",
  },
  {
    name: "Ostalo",
    link: "/other",
    icon: "grid",
    description: "Poslovne, fotografske i dodatne usluge.",
  },
];

function CategoryIcon({ type }) {
  const paths = {
    bag: "M6 8V6a6 6 0 0 1 12 0v2h3l-1 13H4L3 8h3Zm3 0h6V6a3 3 0 0 0-6 0v2Z",
    spark: "m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm7 14 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z",
    cup: "M5 4h12v3h2a4 4 0 0 1 0 8h-2v1a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V4Zm12 6v2h2a1 1 0 0 0 0-2h-2Z",
    grid: "M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  );
}

export default function WhatWeOffer({ stores }) {
  return (
    <section className="category-section" aria-labelledby="category-title">
      <div className="site-container">
        <header className="section-heading">
          <p className="eyebrow">Istražite centar</p>
          <h2 id="category-title">Sve što vam treba, na jednom mjestu</h2>
          <p>Odaberite kategoriju i brzo pronađite odgovarajuću prodavnicu.</p>
        </header>

        <div className="category-grid">
          {categories.map((category) => {
            const count = stores.filter(
              (store) => store.category === (category.apiName || category.name)
            ).length;

            return (
              <Link className="category-card" to={category.link} key={category.name}>
                <span className="category-card__icon">
                  <CategoryIcon type={category.icon} />
                </span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
                {count > 0 && (
                  <span className="category-card__count">
                    {count} {count === 1 ? "rezultat" : "rezultata"}
                  </span>
                )}
                <span className="text-link">Otvori kategoriju</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
