import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "../styles/navbar.css";

const navItems = [
  { to: "/", label: "Početna", end: true },
  { to: "/shopping", label: "Shopping" },
  { to: "/beauty", label: "Ljepota i usluge" },
  { to: "/food", label: "Hrana i piće" },
  { to: "/other", label: "Ostalo" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <aside className="service-bar" aria-label="Informacije centra">
        <div className="site-container service-bar__inner">
          <span>Radno vrijeme: Pon–Pet 09:00–21:00</span>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Sjenjak+Center+Tuzla"
            target="_blank"
            rel="noreferrer"
          >
            Bulevar 15. Maja, Tuzla
          </a>
          <a href="tel:+38761733681">+387 61 733 681</a>
        </div>
      </aside>

      <header className="mall-nav">
        <div className="site-container mall-nav__inner">
          <Link to="/" className="mall-nav__brand" aria-label="Sjenjak Center početna">
            <img src="/SJENJAK.png" alt="Sjenjak Center" />
            <span>Shopping &amp; Lifestyle</span>
          </Link>

          <nav className="mall-nav__links" aria-label="Glavna navigacija">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "mall-nav__link is-active" : "mall-nav__link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/oglasavanje" className="mall-nav__cta">
            Oglašavanje
          </Link>

          <button
            type="button"
            className={`mall-nav__toggle ${open ? "is-open" : ""}`}
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Zatvori meni" : "Otvori meni"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {open && (
          <button
            className="mall-nav__backdrop"
            type="button"
            aria-label="Zatvori meni"
            onClick={() => setOpen(false)}
          />
        )}

        <nav
          id="mobile-navigation"
          className={`mall-nav__mobile ${open ? "is-open" : ""}`}
          aria-label="Mobilna navigacija"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
          <a href="/#aktuelne-ponude">Izdvojene ponude</a>
          <a href="/#prodavnice">Prodavnice</a>
          <a href="/#galerija">Galerija</a>
          <Link to="/oglasavanje">Oglašavanje</Link>
        </nav>
      </header>
    </>
  );
}
