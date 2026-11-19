import { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCompass } from "react-icons/fi";
import "./Navbar.css";

import tokenImg from "../../assets/token.png";

import { AuthContext } from "../../context/AuthContext";

export default function Navbar({ expoMode = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const firstName = user?.name?.split(" ")[0] || "Usuario";

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
              <li><NavLink to="/plans" onClick={() => setMenuOpen(false)}>Explorar</NavLink></li>
              <li><a href="/#seguridad" onClick={() => setMenuOpen(false)}>Seguridad</a></li>
              <li><a href="/#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a></li>
              {user && <li><NavLink to="/profile" onClick={() => setMenuOpen(false)}>Perfil</NavLink></li>}
            </>
          )}
        </ul>

        <div className="navbar-auth">
          {expoMode ? (
            <>
              <span
                className="navbar-tokens navbar-demo-tokens"
                aria-label="Tokens ilimitados en la demostración"
                title="Tokens ilimitados en la demostración"
              >
                <span className="token-infinity" aria-hidden="true">∞</span>
                <span className="navbar-token-label">Ilimitados</span>
              </span>
              <button
                className="btn-register"
                onClick={() => handleNavigate("/expo/registro")}
              >
                <span className="navbar-register-long">Crear perfil</span>
                <span className="navbar-register-short">Registro</span>
              </button>
            </>
          ) : user ? (
            <>
              <div className="navbar-tokens">
                <img src={tokenImg} alt="" className="token-icon" />
                <span className="token-count">{user?.tokens ?? 2}</span>
              </div>
              <div className="navbar-user">
                <span className="user-name">👋 Hola, {firstName}</span>
                <button className="btn-logout" onClick={logout}>Salir</button>
              </div>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate("/login")}>
                Iniciar sesión
              </button>
              <button className="btn-register" onClick={() => navigate("/register")}>
                Registrarme
              </button>
            </>
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