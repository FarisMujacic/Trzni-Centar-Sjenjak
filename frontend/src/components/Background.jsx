import React from "react";
import { Link } from "react-router-dom";
import "../styles/background.css";

export default function Background() {
  return (
    <section className="mall-hero" aria-labelledby="mall-hero-title">
      <div
        className="mall-hero__image"
        style={{ backgroundImage: 'url("/s1.jpg")' }}
        role="img"
        aria-label="Tržni centar Sjenjak"
      />
      <div className="mall-hero__overlay" />
      <div className="site-container mall-hero__content">
        <p className="mall-hero__eyebrow">Tržni centar Sjenjak, Tuzla</p>
        <h1 id="mall-hero-title">
          Vaše mjesto za <span>kupovinu i svakodnevni život.</span>
        </h1>
        <p>
          Otkrijte prodavnice, usluge, mjesta za predah i aktuelne ponude na
          jednom preglednom mjestu.
        </p>
        <div className="mall-hero__actions">
          <a className="button button--gold" href="#prodavnice">
            Pronađi prodavnicu
          </a>
          <Link className="button button--glass" to="/oglasavanje">
            Oglašavanje u centru
          </Link>
        </div>
      </div>
    </section>
  );
}
