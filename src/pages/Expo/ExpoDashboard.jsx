import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowUpRight,
  FiCompass,
  FiMapPin,
  FiSearch,
  FiStar,
} from "react-icons/fi";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import MapView from "../../components/map/MapView";
import plans from "../../data/plans.json";
import ExpoTripPlanner from "./ExpoTripPlanner";
import "./Expo.css";

const AI_SERVICE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || "http://127.0.0.1:8000";

const MAP_AREAS = [
  {
    id: "monserrate",
    name: "Monserrate",
    coordinates: { lat: 4.6059, lng: -74.0556 },
    keywords: ["monserrate"],
  },
  {
    id: "usaquen",
    name: "Usaquén",
    coordinates: { lat: 4.695, lng: -74.031 },
    keywords: ["usaquen"],
  },
  {
    id: "sabana",
    name: "La Sabana",
    coordinates: { lat: 4.83, lng: -74.045 },
    keywords: ["sabana", "thomas van der hammen"],
  },
  {
    id: "humedal",
    name: "Humedales y parques",
    coordinates: { lat: 4.69, lng: -74.091 },
    keywords: ["humedal", "virgilio barco", "jardin botanico", "simon bolivar", "parque de los novios", "ciclovia", "bicicleta"],
  },
  {
    id: "paloquemao",
    name: "Paloquemao",
    coordinates: { lat: 4.6157, lng: -74.085 },
    keywords: ["paloquemao"],
  },
  {
    id: "zona-t",
    name: "Zona T y El Chicó",
    coordinates: { lat: 4.667, lng: -74.053 },
    keywords: ["zona t", "andino", "andres dc"],
  },
  {
    id: "chapinero",
    name: "Chapinero y Zona G",
    coordinates: { lat: 4.648, lng: -74.063 },
    keywords: ["chapinero", "zona g", "rooftops", "bares", "cerveza artesanal", "spa urbano", "escape rooms"],
  },
  {
    id: "centro",
    name: "Centro y La Candelaria",
    coordinates: { lat: 4.598, lng: -74.073 },
    keywords: ["candelaria", "centro historico", "museo", "teatro colon", "san victorino", "grafitis", "tour universitario"],
  },
  {
    id: "americas",
    name: "Las Américas",
    coordinates: { lat: 4.628, lng: -74.126 },
    keywords: ["las americas"],
  },
  {
    id: "bogota",
    name: "Bogotá · zona por confirmar",
    coordinates: { lat: 4.648, lng: -74.085 },
    keywords: [],
  },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getMapArea(planName) {
  const normalizedName = normalizeText(planName);
  return (
    MAP_AREAS.find((area) =>
      area.keywords.some((keyword) => normalizedName.includes(keyword))
    ) || MAP_AREAS[MAP_AREAS.length - 1]
  );
}

function createFeaturedPoints() {
  return plans.flatMap((plan) => {
    const position = plan.location?.coordinates;
    if (!position) return [];

    const budget = plan.budget?.estimated_total;
    const routeTypes = (plan.routes || []).map((route) => route.type).join(", ");
    const details = [
      budget ? `Presupuesto estimado: ${budget.toLocaleString("es-CO")} COP` : null,
      plan.schedule?.best_hours?.length
        ? `Mejores horarios: ${plan.schedule.best_hours.join(", ")}`
        : null,
      routeTypes ? `Cómo llegar: ${routeTypes}` : null,
      plan.safety?.level ? `Nivel de seguridad: ${plan.safety.level}` : null,
    ].filter(Boolean);

    const destination = {
      id: `${plan.id}-destination`,
      name: plan.location.name,
      description: plan.experience?.description,
      lat: position.lat,
      lng: position.lng,
      details,
      approximate: false,
    };
    const mapPoints = (plan.map_points || [])
      .filter(
        (point) =>
          Math.abs(point.lat - position.lat) > 0.0001 ||
          Math.abs(point.lng - position.lng) > 0.0001
      )
      .map((point, index) => ({
        ...point,
        id: `${plan.id}-stop-${index}`,
        description: plan.title,
        details,
        approximate: false,
      }));

    return [destination, ...mapPoints];
  });
}

function createFeaturedRoutes() {
  return plans
    .filter((plan) => (plan.map_points || []).length > 1)
    .map((plan) => ({
      id: plan.id,
      name: plan.title,
      color: "#b79aff",
      positions: plan.map_points.map((point) => [point.lat, point.lng]),
    }));
}

const FEATURED_POINTS = createFeaturedPoints();
const FEATURED_ROUTES = createFeaturedRoutes();

function readDemoProfile() {
  try {
    const stored = localStorage.getItem("expo-demo-profile");
    if (!stored) return null;

    const profile = JSON.parse(stored);
    return typeof profile?.name === "string" ? profile : null;
  } catch (error) {
    console.error("No se pudo leer el perfil de muestra.", error);
    return null;
  }
}

export default function ExpoDashboard() {
  const [profile] = useState(readDemoProfile);
  const [catalog, setCatalog] = useState([]);
  const [catalogSummary, setCatalogSummary] = useState(null);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [catalogError, setCatalogError] = useState("");
  const [activeArea, setActiveArea] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const displayName = profile?.name?.trim().split(/\s+/)[0] || "Visitante";

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const response = await fetch(`${AI_SERVICE_URL}/catalog`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`El servicio respondió con estado ${response.status}.`);
        }

        const result = await response.json();
        if (
          !Array.isArray(result.catalog) ||
          !result.summary ||
          !result.catalog.every(
            (item) =>
              typeof item.name === "string" &&
              Array.isArray(item.travel_types) &&
              Number.isFinite(item.rating_average)
          )
        ) {
          throw new Error("El catálogo del servicio está incompleto.");
        }

        setCatalog(result.catalog);
        setCatalogSummary(result.summary);
        setCatalogStatus("ready");
        setCatalogError("");
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("No se pudo cargar el catálogo de experiencias.", error);
        setCatalogStatus("error");
        setCatalogError(
          "No se pudo cargar el catálogo ML local. Verifica que ai-service esté ejecutándose."
        );
      }
    }

    loadCatalog();
    return () => controller.abort();
  }, []);

  const areaFilters = useMemo(() => {
    const availableAreaIds = new Set(
      catalog.map((item) => getMapArea(item.name).id)
    );
    return [
      { id: "all", name: "Todas" },
      ...MAP_AREAS.filter((area) => availableAreaIds.has(area.id)),
    ];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());
    return catalog
      .filter(
        (item) =>
          activeArea === "all" || getMapArea(item.name).id === activeArea
      )
      .filter((item) => {
        if (!normalizedSearch) return true;
        const area = getMapArea(item.name);
        return normalizeText(`${item.name} ${area.name}`).includes(
          normalizedSearch
        );
      })
      .sort((first, second) => second.rating_average - first.rating_average);
  }, [activeArea, catalog, search]);

  const mapGroups = useMemo(() => {
    const grouped = new Map();
    filteredCatalog.forEach((item) => {
      const area = getMapArea(item.name);
      if (!grouped.has(area.id)) {
        grouped.set(area.id, { ...area, plans: [] });
      }
      grouped.get(area.id).plans.push(item);
    });

    return Array.from(grouped.values())
      .sort((first, second) => second.plans.length - first.plans.length)
      .map((area) => ({
        id: `area-${area.id}`,
        name: area.name,
        description: "Zona aproximada inferida por el nombre del plan.",
        lat: area.coordinates.lat,
        lng: area.coordinates.lng,
        count: area.plans.length,
        plans: area.plans,
        approximate: true,
        kind: "cluster",
      }));
  }, [filteredCatalog]);

  const mapPoints = useMemo(
    () => [...FEATURED_POINTS, ...mapGroups],
    [mapGroups]
  );
  const selectedArea = useMemo(
    () => (selectedPlan ? getMapArea(selectedPlan) : null),
    [selectedPlan]
  );
  const focusPoint = selectedArea
    ? { ...selectedArea.coordinates, zoom: 14 }
    : null;
  const metrics = [
    {
      label: "Planes del catálogo",
      value: catalogSummary?.plan_count ?? "—",
      detail: "Del dataset turístico",
      icon: FiCompass,
    },
    {
      label: "Calificaciones",
      value: catalogSummary
        ? Number(catalogSummary.dataset_rows).toLocaleString("es-CO")
        : "—",
      detail: "Registros de entrenamiento",
      icon: FiStar,
    },
    {
      label: "Zonas visibles",
      value: mapGroups.length,
      detail: "Ubicaciones orientativas",
      icon: FiMapPin,
    },
    {
      label: "Error de validación",
      value: catalogSummary
        ? Number(catalogSummary.validation_mae).toFixed(2)
        : "—",
      detail: "MAE del modelo (escala 1–5)",
      icon: FiActivity,
    },
  ];

  return (
    <div className="expo-page">
      <Navbar expoMode />
      <main className="expo-main">
        <section className="expo-heading">
          <div>
            <span className="expo-eyebrow">VERSIÓN EXPO · INGENIERÍA</span>
            <h1>Planea Bogotá con IA</h1>
            <p>
              Hola, {displayName}. Elige presupuesto, compañía y tipo de plan;
              ML te propone tres experiencias y DeepSeek arma un itinerario para
              la que elijas.
            </p>
          </div>
          <div className="expo-mode-notice">
            <span className="expo-live-dot" />
            Leaflet · datos locales de turismo
          </div>
        </section>

        <ExpoTripPlanner />

        <section className="expo-map-overview" aria-label="Mapa de experiencias">
          <article className="expo-panel expo-map-panel" id="mapa">
            <header className="expo-panel-heading expo-map-panel-heading">
              <div>
                <span className="expo-panel-kicker">BOGOTÁ, COLOMBIA</span>
                <h2>Experiencias y recorridos</h2>
                <p>
                  {catalogStatus === "ready"
                    ? `${catalog.length} planes del modelo · ${mapGroups.length} zonas`
                    : "Lugares destacados y catálogo del modelo"}
                </p>
              </div>
              <span className="expo-map-count">
                <FiMapPin aria-hidden="true" /> {mapPoints.length} puntos
              </span>
            </header>

            <MapView
              center={{ lat: 4.63, lng: -74.06 }}
              points={mapPoints}
              routes={FEATURED_ROUTES}
              focusPoint={focusPoint}
            />

            <div className="expo-map-legend" aria-label="Leyenda del mapa">
              <span>
                <i className="expo-legend-dot featured" /> Lugares destacados
              </span>
              <span>
                <i className="expo-legend-dot zone" /> Zonas y planes ML
              </span>
              {FEATURED_ROUTES.length > 0 && (
                <span>
                  <i className="expo-legend-line" /> Ruta diseñada
                </span>
              )}
            </div>
            <p className="expo-map-caption">
              Los círculos del catálogo indican zonas aproximadas inferidas por
              el nombre; no son direcciones exactas ni navegación en tiempo real.
              Los puntos destacados usan coordenadas del plan local.
            </p>
          </article>

          <aside className="expo-panel expo-activity-panel expo-map-explorer">
            <header className="expo-panel-heading">
              <div>
                <span className="expo-panel-kicker">CATÁLOGO TURÍSTICO</span>
                <h2>Lo que tenemos planteado</h2>
              </div>
              <span className="expo-map-count">
                {filteredCatalog.length} planes
              </span>
            </header>

            <label className="expo-map-search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar experiencia o zona"
                aria-label="Buscar experiencia o zona"
              />
            </label>

            <div className="expo-map-filters" aria-label="Filtrar por zona">
              {areaFilters.map((area) => (
                <button
                  type="button"
                  key={area.id}
                  className={activeArea === area.id ? "active" : undefined}
                  aria-pressed={activeArea === area.id}
                  onClick={() => setActiveArea(area.id)}
                >
                  {area.name}
                </button>
              ))}
            </div>

            {catalogStatus === "loading" && (
              <p className="expo-catalog-status" role="status">
                Cargando las experiencias y calificaciones del modelo...
              </p>
            )}
            {catalogStatus === "error" && (
              <p className="expo-catalog-status error" role="alert">
                {catalogError}
              </p>
            )}
            {catalogStatus === "ready" && filteredCatalog.length === 0 && (
              <p className="expo-catalog-status">
                No hay experiencias que coincidan con esa búsqueda.
              </p>
            )}

            <ol className="expo-map-plan-list">
              {filteredCatalog.map((item, index) => {
                const area = getMapArea(item.name);
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      className={
                        selectedPlan === item.name ? "selected" : undefined
                      }
                      aria-pressed={selectedPlan === item.name}
                      onClick={() => setSelectedPlan(item.name)}
                    >
                      <span className="expo-place-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="expo-map-plan-copy">
                        <strong>{item.name}</strong>
                        <small>
                          {area.name} ·{" "}
                          {Number(item.rating_samples).toLocaleString("es-CO")}{" "}
                          valoraciones
                        </small>
                      </span>
                      <span className="expo-map-rating">
                        <FiStar aria-hidden="true" />{" "}
                        {Number(item.rating_average).toFixed(1)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <details className="expo-featured-routes">
              <summary>Rutas diseñadas ({plans.length})</summary>
              {plans.map((plan) => (
                <article key={plan.id}>
                  <strong>{plan.title}</strong>
                  <p>{plan.ai_context?.summary || plan.experience?.description}</p>
                  <small>
                    {plan.budget?.estimated_total?.toLocaleString("es-CO")} COP
                    {" · "}
                    {(plan.routes || []).map((route) => route.type).join(", ")}
                  </small>
                </article>
              ))}
            </details>

            <div className="expo-panel-note">
              <FiActivity aria-hidden="true" />
              <p>
                {catalogSummary
                  ? `Modelo entrenado con ${Number(catalogSummary.dataset_rows).toLocaleString("es-CO")} calificaciones.`
                  : "El catálogo se carga desde el servicio local de IA."}
                {" "}Las búsquedas del panel se guardan en este dispositivo.
              </p>
            </div>
            <Link className="expo-register-link" to="/expo/registro">
              Crear perfil de muestra <FiArrowUpRight aria-hidden="true" />
            </Link>
          </aside>
        </section>

        <section className="expo-metrics" aria-label="Datos del modelo">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article className="expo-metric" key={label}>
              <div className="expo-metric-label">
                <span>{label}</span>
                <Icon aria-hidden="true" />
              </div>
              <strong>{value}</strong>
              <small>{detail}</small>
            </article>
          ))}
        </section>

      </main>
      <Footer expoMode />
    </div>
  );
}
