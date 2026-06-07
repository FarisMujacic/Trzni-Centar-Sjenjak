import React from "react";
import { Link } from "react-router-dom";
import "../styles/advertising.css";

const options = [
  {
    title: "Premium pozicija",
    text: "Najistaknutiji format za kampanje kojima je potrebna snažna vidljivost na javnoj stranici.",
  },
  {
    title: "Izdvojena ponuda",
    text: "Vizuelno bogata kartica za promociju aktuelne ponude, novosti ili usluge.",
  },
  {
    title: "Standardni banner",
    text: "Horizontalni format uklopljen između sadržajnih sekcija bez narušavanja iskustva posjetilaca.",
  },
];

export default function AdvertisingPage() {
  return (
    <main className="advertising-page">
      <section className="advertising-page__hero">
        <div className="site-container advertising-page__hero-inner">
          <div>
            <p className="eyebrow">Veća vidljivost u centru</p>
            <h1>Oglašavajte se kod nas</h1>
            <p>
              Predstavite ponudu posjetiocima Sjenjak Centra kroz jasno
              označene i estetski uklopljene promotivne formate.
            </p>
            <a className="button button--gold" href="mailto:info@tcsjenjak.ba">
              Pošaljite upit
            </a>
          </div>
          <img src="/SJENJAK.png" alt="Sjenjak Center" />
        </div>
      </section>

      <section className="site-container advertising-page__options">
        <header className="section-heading">
          <p className="eyebrow">Mogućnosti oglašavanja</p>
          <h2>Format prema cilju kampanje</h2>
          <p>Cijene i detalji pozicija dogovaraju se putem kontakta.</p>
        </header>

        <div className="advertising-options">
          {options.map((option, index) => (
            <article className="advertising-option" key={option.title}>
              <span>0{index + 1}</span>
              <h3>{option.title}</h3>
              <p>{option.text}</p>
            </article>
          ))}
        </div>

        <Link className="text-link" to="/">
          Povratak na početnu
        </Link>
      </section>
    </main>
  );
}
