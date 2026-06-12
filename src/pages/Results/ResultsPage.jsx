import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ResultsPage.css";

import { useRecommendations } from "../../hooks/useRecommendations";
import PlanCard from "../../components/marketplace/PlanCard";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({});
  const [tokens] = useState(2);

  useEffect(() => {
    if (location.state?.filters) {
      setFilters(location.state.filters);
    }
  }, [location.state]);

  const { recommendations, bestMatch } = useRecommendations(filters);

  const handleLockedAccess = () => {
    alert("Necesitas más tokens o membresía para explorar más planes");
  };

  return (
    <div className="results-container">

      {/* =========================
          🏆 HERO (DECISIÓN PRINCIPAL)
      ========================= */}
      <div className="results-hero">

        <h2>Tu plan perfecto</h2>

        <p className="subtitle">
          Basado en tu perfil, este es el viaje que más te conviene
        </p>

        {bestMatch ? (
          <div
            className="hero-card"
            onClick={() =>
              navigate(`/plans/${bestMatch.id}`, {
                state: { plan: bestMatch }
              })
            }
          >
            <PlanCard plan={bestMatch} highlight />
          </div>
        ) : (
          <p className="loading">Generando recomendación...</p>
        )}
      </div>

      {/* =========================
          🔒 EXPLORAR MÁS (CONTROLADO)
      ========================= */}
      <div className="results-section">

        <div className="section-header">
          <h3>Otras opciones para ti</h3>

          {tokens > 0 ? (
            <span className="tokens-info">
              🪙 {tokens} tokens disponibles
            </span>
          ) : (
            <span className="tokens-warning">
              🔒 Sin tokens
            </span>
          )}
        </div>

        {/* 🔒 overlay cuando no hay tokens */}
        {tokens <= 0 && (
          <div className="locked-overlay">
            <div className="locked-box">
              <p>🔒 Acceso limitado</p>
              <button onClick={handleLockedAccess}>
                Obtener membresía
              </button>
            </div>
          </div>
        )}

        <div className={`results-grid ${tokens <= 0 ? "blurred" : ""}`}>

          {recommendations?.map((plan) => (
            <div
              key={plan.id}
              className="result-wrapper"
              onClick={() =>
                tokens > 0
                  ? navigate(`/plans/${plan.id}`, {
                      state: { plan }
                    })
                  : handleLockedAccess()
              }
            >
              <PlanCard plan={plan} />
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}