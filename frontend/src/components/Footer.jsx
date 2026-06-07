import React from "react";
import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="mall-footer">
      <div className="site-container mall-footer__grid">
        <div className="mall-footer__brand">
          <Link to="/" aria-label="Sjenjak Center početna">
            <img src="/SJENJAK.png" alt="Sjenjak Center" loading="lazy" />
          </Link>
          <p>Sve što vam treba, na jednom mjestu.</p>
          <address>Bulevar 15. Maja, 75000 Tuzla, BiH</address>
        </div>

        <nav className="mall-footer__column" aria-label="Navigacija u podnožju">
          <h2>Navigacija</h2>
          <Link to="/">Početna</Link>
          <Link to="/shopping">Shopping</Link>
          <Link to="/beauty">Ljepota i usluge</Link>
          <Link to="/food">Hrana i piće</Link>
          <Link to="/other">Ostalo</Link>
          <Link to="/oglasavanje">Oglašavanje</Link>
        </nav>

        <section className="mall-footer__column">
          <h2>Radno vrijeme</h2>
          <dl className="mall-footer__hours">
            <div><dt>Pon–Pet</dt><dd>09:00–21:00</dd></div>
            <div><dt>Subota</dt><dd>09:00–20:00</dd></div>
            <div><dt>Nedjelja</dt><dd>10:00–18:00</dd></div>
          </dl>
        </section>

        <section className="mall-footer__column">
          <h2>Kontakt</h2>
          <a href="tel:+38761733681">+387 61 733 681</a>
          <a href="mailto:info@tcsjenjak.ba">info@tcsjenjak.ba</a>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Sjenjak+Center+Tuzla"
            target="_blank"
            rel="noreferrer"
          >
            Otvori lokaciju
          </a>
        </section>
      </div>

      <div className="site-container mall-footer__bottom">
        <span>© {new Date().getFullYear()} Sjenjak Center</span>
        <span>Tuzla, Bosna i Hercegovina</span>
      </div>
    </footer>
  );
}
