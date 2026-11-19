import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiMapPin,
  FiMessageCircle,
} from "react-icons/fi";
import "./Hero.css";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__left">
          <div className="hero__eyebrow">
            <span />
            Expo Ingeniería · Tourism AI
          </div>
          <h1 className="hero__title">
            Turismo con datos <span>y experiencias.</span>
          </h1>
          <p className="hero__subtitle">
            Explora un panel interactivo de Bogotá, conoce experiencias en el
            mapa y prueba la versión de exhibición sin iniciar sesión.
          </p>
          <div className="hero__actions">
            <button className="hero__cta" onClick={() => navigate("/expo")}>
              Abrir panel Expo <FiArrowRight aria-hidden="true" />
            </button>
            <button
              className="hero__secondary"
              onClick={() => navigate("/expo/registro")}
            >
              <FiMessageCircle aria-hidden="true" />
              Crear perfil de muestra
            </button>
          </div>
          <div className="hero__trust" aria-label="Beneficios">
            <span><FiCheck aria-hidden="true" /> Ideas para ti</span>
            <span><FiCheck aria-hidden="true" /> Planes flexibles</span>
            <span><FiCheck aria-hidden="true" /> Bogotá</span>
          </div>
        </div>
        <div className="hero__right">
          <div className="hero__orbit" aria-hidden="true" />
          <article className="hero__preview">
            <div className="hero__art">
              <span className="hero__art-label">Una idea para hoy</span>
              <span className="hero__pin"><FiMapPin size={24} /></span>
            </div>
            <div className="hero__place-info">
              <span className="hero__place-kicker">Bogotá · cultura y café</span>
              <h2>Una tarde para perderse por La Candelaria</h2>
              <div className="hero__place-meta">
                <span><FiClock aria-hidden="true" /> 3–4 horas</span>
                <span><FiMapPin aria-hidden="true" /> Centro histórico</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}