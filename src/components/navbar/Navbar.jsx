import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCompass } from "react-icons/fi";
import "./Navbar.css";

export default function Navbar({ expoMode = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar${expoMode ? " navbar--expo" : ""}`}>
      <div className="navbar-container">
        <button
          className="navbar-logo"
          type="button"
          onClick={() => handleNavigate("/")}
          aria-label="Ir al inicio de Tourism AI"
        >
          <span className="navbar-mark" aria-hidden="true">
            <FiCompass />
          </span>
          <span className="navbar-brand-copy">
            <span className="navbar-brand-name">Tourism AI</span>
            {expoMode && <small>Expo Ingeniería</small>}
          </span>
        </button>

        <ul
          className={`navbar-links ${menuOpen ? "open" : ""}`}
          id="primary-navigation"
        >
          {expoMode ? (
            <>
              <li><NavLink to="/expo" onClick={() => setMenuOpen(false)}>Panel demo</NavLink></li>
              <li><a href="/expo#mapa" onClick={() => setMenuOpen(false)}>Mapa</a></li>
              <li><a href="/#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a></li>
            </>
          ) : (
            <>
              <li><NavLink to="/" end onClick={() => setMenuOpen(false)}>Inicio</NavLink></li>
              <li><NavLink to="/expo" onClick={() => setMenuOpen(false)}>Planear un viaje</NavLink></li>
              <li><a href="/#seguridad" onClick={() => setMenuOpen(false)}>Seguridad</a></li>
              <li><a href="/#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a></li>
            </>
          )}
        </ul>

        <div className="navbar-auth">
          {expoMode && (
            <span
              className="navbar-tokens navbar-demo-tokens"
              aria-label="Uso sin cuenta"
              title="La beta no requiere cuenta"
            >
              <span className="navbar-token-label">Beta pública</span>
            </span>
          )}
        </div>

        <button
          className="navbar-toggle"
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>
    </nav>
  );
}