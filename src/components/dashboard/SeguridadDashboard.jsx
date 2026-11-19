import "./SeguridadDashboard.css";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiMapPin, FiShield, FiUsers } from "react-icons/fi";

export default function SeguridadDashboard() {
  return (
    <section className="seguridad-section" id="seguridad">
      <header className="seguridad-header">
        <span className="section-eyebrow">Vista de exhibición</span>
        <h2 className="seguridad-title">Un panel que sí cabe en tu pantalla</h2>
        <p className="seguridad-subtitle">
          Dejamos atrás el tablero incrustado. Abre el panel responsive con mapa,
          indicadores y lugares de muestra, sin iniciar sesión.
        </p>
      </header>

      <div className="dashboard-wrapper">
        <div className="dashboard-preview-heading">
          <span className="dashboard-status"><span /> Panel disponible</span>
          <span className="dashboard-demo-note">Datos de muestra</span>
        </div>
        <div className="dashboard-preview-cards">
          <article>
            <span><FiMapPin aria-hidden="true" /> Lugares en el mapa</span>
            <strong>12</strong>
            <small>Experiencias de muestra</small>
          </article>
          <article>
            <span><FiUsers aria-hidden="true" /> Comunidad</span>
            <strong>164</strong>
            <small>Visitas de demostración</small>
          </article>
          <article>
            <span><FiShield aria-hidden="true" /> Acceso</span>
            <strong>Público</strong>
            <small>Sin login ni permisos reales</small>
          </article>
        </div>
        <Link className="dashboard-link" to="/expo">
          Explorar Expo Ingeniería <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}