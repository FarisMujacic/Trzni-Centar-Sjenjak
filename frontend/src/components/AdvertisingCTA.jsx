import React from "react";
import { Link } from "react-router-dom";
import "../styles/advertising.css";

export default function AdvertisingCTA() {
  return (
    <section className="advertising-cta">
      <div className="site-container advertising-cta__inner">
        <div>
          <p className="eyebrow">Za zakupce i brendove</p>
          <h2>Oglašavajte se kod nas</h2>
          <p>
            Predstavite ponudu posjetiocima kroz jasno označene promotivne
            pozicije uklopljene u iskustvo centra.
          </p>
        </div>
        <Link className="button button--gold" to="/oglasavanje">
          Pogledajte mogućnosti
        </Link>
      </div>
    </section>
  );
}
