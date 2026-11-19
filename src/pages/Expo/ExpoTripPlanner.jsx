import { useEffect, useState } from "react";
import {
  FiActivity,
  FiArrowUpRight,
  FiAward,
  FiBookOpen,
  FiBox,
  FiCamera,
  FiCloud,
  FiCloudRain,
  FiCoffee,
  FiDollarSign,
  FiHeart,
  FiImage,
  FiMap,
  FiMapPin,
  FiMessageCircle,
  FiMoon,
  FiNavigation,
  FiRefreshCw,
  FiSend,
  FiShoppingBag,
  FiStar,
  FiSun,
  FiUmbrella,
  FiUsers,
  FiX,
} from "react-icons/fi";
import plans from "../../data/plans.json";
import MapView from "../../components/map/MapView";

const STORAGE_KEY = "expo-trip-plan-v6";
const AI_SERVICE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || "http://127.0.0.1:8000";
const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:3000"
).replace(/\/+$/, "");

const BUDGET_CATEGORIES = [
  { value: "economico", label: "Económico" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Cómodo" },
];

const COMPANIONS = [
  { value: "solo", label: "Solo" },
  { value: "pareja", label: "En pareja" },
  { value: "amigos", label: "Con amigos" },
  { value: "familia", label: "En familia" },
];

const TRAVEL_TYPES = [
  { value: "cultural", label: "Cultural", icon: FiBookOpen },
  { value: "vida_nocturna", label: "Fiesta y vida nocturna", icon: FiMoon },
  { value: "naturaleza", label: "Naturaleza", icon: FiSun },
  { value: "gastronomia", label: "Gastronomía", icon: FiCoffee },
  { value: "relax", label: "Relajación", icon: FiHeart },
  { value: "compras", label: "Compras", icon: FiShoppingBag },
];
const INITIAL_TRAVEL_TYPES = TRAVEL_TYPES.map(({ value }) => value);

const PRICE_ROWS = [
  { key: "food", label: "Comida" },
  { key: "drink", label: "Bebida" },
  { key: "beer", label: "Cerveza" },
  { key: "transport", label: "Transporte" },
  { key: "daily_total", label: "Total del día" },
];

const ROUTE_MODES = [
  {
    id: "transmilenio",
    label: "TransMilenio",
    icon: FiMap,
    details: "Confirma estaciones, rutas y transbordos disponibles en TransMiApp.",
  },
  {
    id: "bus",
    label: "Bus urbano",
    icon: FiNavigation,
    details: "Revisa las rutas zonales y paraderos cercanos antes de salir.",
  },
  {
    id: "bicycle",
    label: "Bicicleta",
    mode: "bicycling",
    icon: FiMapPin,
    details: "Usa ciclorrutas señalizadas y valida las condiciones del trayecto.",
  },
  {
    id: "walking",
    label: "A pie",
    mode: "walking",
    icon: FiNavigation,
    details: "Sigue los tramos caminables sugeridos entre paradas.",
  },
];

const INITIAL_BUDGET = "medio";

function isRecommendation(item) {
  return (
    item &&
    typeof item.plan_turistico_bogota === "string" &&
    typeof item.tipo_viaje === "string" &&
    Number.isFinite(item.predicted_rating) &&
    Number.isInteger(item.rating_samples)
  );
}

function isModelInfo(model) {
  return (
    model &&
    typeof model.name === "string" &&
    Number.isInteger(model.training_rows) &&
    Number.isInteger(model.dataset_rows) &&
    Number.isFinite(model.validation_mae)
  );
}

function isText(value, maxLength = 500) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isPrice(value) {
  return (
    value &&
    ["min", "average", "max"].every(
      (key) =>
        Number.isFinite(value[key]) &&
        value[key] >= 0 &&
        value[key] <= 5_000_000
    ) &&
    value.min <= value.average &&
    value.average <= value.max
  );
}

function isWeather(value) {
  return (
    value &&
    (value.available === false
      ? isText(value.message, 240)
      : value.available === true &&
        isText(value.date, 20) &&
        isText(value.condition, 80) &&
        Number.isFinite(value.temp_min_c) &&
        Number.isFinite(value.temp_max_c) &&
        Number.isFinite(value.precipitation_probability_percent) &&
        Number.isFinite(value.wind_speed_kmh))
  );
}

function isMapPoint(point) {
  return (
    point &&
    isText(point.id, 100) &&
    isText(point.name, 160) &&
    Number.isFinite(point.lat) &&
    point.lat >= 4.45 &&
    point.lat <= 4.86 &&
    Number.isFinite(point.lng) &&
    point.lng >= -74.23 &&
    point.lng <= -73.9
  );
}

function isTravelPlan(value) {
  return (
    value &&
    isText(value.overview, 600) &&
    isText(value.selection_reason, 400) &&
    value.averages_cop &&
    PRICE_ROWS.every(({ key }) => isPrice(value.averages_cop[key])) &&
    Array.isArray(value.curiosities) &&
    value.curiosities.length >= 2 &&
    value.curiosities.length <= 3 &&
    value.curiosities.every((item) => isText(item, 240)) &&
    Array.isArray(value.restaurants) &&
    value.restaurants.length >= 2 &&
    value.restaurants.length <= 4 &&
    value.restaurants.every(
      (restaurant) =>
        isText(restaurant?.name, 240) &&
        isText(restaurant?.neighborhood, 240) &&
        isText(restaurant?.specialty, 240) &&
        isText(restaurant?.why, 240) &&
        Number.isInteger(restaurant?.price_per_person_cop) &&
        restaurant.price_per_person_cop >= 0 &&
        restaurant.price_per_person_cop <= 5_000_000
    ) &&
    Array.isArray(value.itinerary) &&
    value.itinerary.length >= 3 &&
    value.itinerary.length <= 4 &&
    value.itinerary.every(
      (item) =>
        isText(item?.time, 30) &&
        isText(item?.title, 120) &&
        isText(item?.location, 160) &&
        ["indoor", "outdoor", "mixed"].includes(item?.setting) &&
        isText(item?.description, 300)
    ) &&
    value.transport_advice &&
    ["transmilenio", "bus", "bicycle", "walking"].every((mode) =>
      isText(value.transport_advice[mode], 240)
    ) &&
    Array.isArray(value.practical_tips) &&
    value.practical_tips.length >= 3 &&
    value.practical_tips.length <= 5 &&
    value.practical_tips.every((tip) => isText(tip, 240)) &&
    isText(value.weather_advice, 400) &&
    isText(value.parking_advice, 400) &&
    isText(value.verification_note, 400) &&
    isWeather(value.weather) &&
    Array.isArray(value.route_points) &&
    value.route_points.length <= 4 &&
    value.route_points.every(isMapPoint) &&
    Array.isArray(value.parking_points) &&
    value.parking_points.length <= 8 &&
    value.parking_points.every(isMapPoint) &&
    isText(value.map_note, 240) &&
    isText(value.parking_note, 240) &&
    value.quality_score &&
    Number.isInteger(value.quality_score.total) &&
    value.quality_score.total >= 0 &&
    value.quality_score.total <= 100 &&
    Array.isArray(value.quality_score.components) &&
    value.quality_score.components.length === 4 &&
    value.quality_score.components.every(
      (component) =>
        isText(component?.label, 80) &&
        Number.isInteger(component.score) &&
        component.score >= 0 &&
        component.score <= 100
    ) &&
    isText(value.quality_score.method, 240)
  );
}

function readSavedSearch() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (
      parsed.version !== 6 ||
      !BUDGET_CATEGORIES.some(
        (category) => category.value === parsed.budgetCategory
      ) ||
      !COMPANIONS.some(
        (companion) => companion.value === parsed.companion
      ) ||
      !Array.isArray(parsed.travelTypes) ||
      parsed.travelTypes.length === 0 ||
      !parsed.travelTypes.every((type) =>
        TRAVEL_TYPES.some((option) => option.value === type)
      ) ||
      !Array.isArray(parsed.recommendations) ||
      parsed.recommendations.length === 0 ||
      !parsed.recommendations.every(isRecommendation) ||
      !parsed.recommendations.some(
        (item) =>
          item.plan_turistico_bogota ===
          parsed.selectedRecommendation?.plan_turistico_bogota
      ) ||
      !isModelInfo(parsed.model) ||
      !isTravelPlan(parsed.plan)
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("No se pudo leer el plan guardado.", error);
    return null;
  }
}

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWeatherDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function getLocalPlanContext(plan) {
  return {
    title: plan.title,
    location: plan.location?.name,
    description: plan.experience?.description,
    summary: plan.ai_context?.summary,
    local_insight: plan.ai_context?.local_insight,
    budget: plan.budget,
    routes: plan.routes,
    best_hours: plan.schedule?.best_hours,
    avoid_hours: plan.schedule?.avoid_hours,
    safety_tips: plan.safety?.tips,
    price_alerts: plan.price_alerts,
    highlights: plan.experience?.highlights,
  };
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    throw new Error(
      `El servicio respondió con un formato inesperado (estado ${response.status}).`
    );
  }
}

export default function ExpoTripPlanner() {
  const [savedSearch] = useState(readSavedSearch);
  const [budgetCategory, setBudgetCategory] = useState(
    () => savedSearch?.budgetCategory || INITIAL_BUDGET
  );
  const [companion, setCompanion] = useState(
    () => savedSearch?.companion || "pareja"
  );
  const [travelTypes, setTravelTypes] = useState(
    () => savedSearch?.travelTypes || INITIAL_TRAVEL_TYPES
  );
  const [recommendations, setRecommendations] = useState(
    () => savedSearch?.recommendations || null
  );
  const [selectedRecommendation, setSelectedRecommendation] = useState(
    () => savedSearch?.selectedRecommendation || null
  );
  const [modelInfo, setModelInfo] = useState(() => savedSearch?.model || null);
  const [plan, setPlan] = useState(() => savedSearch?.plan || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [notice, setNotice] = useState(() =>
    savedSearch ? "Se restauró el plan guardado en este dispositivo." : ""
  );
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatPhoto, setChatPhoto] = useState(null);
  const [chatPhotoPreview, setChatPhotoPreview] = useState("");

  useEffect(() => {
    if (!chatPhotoPreview) return undefined;
    return () => URL.revokeObjectURL(chatPhotoPreview);
  }, [chatPhotoPreview]);

  const clearResults = () => {
    setRecommendations(null);
    setSelectedRecommendation(null);
    setModelInfo(null);
    setPlan(null);
    setChatMessages([]);
    setChatError("");
    setChatPhoto(null);
    setChatPhotoPreview("");
    setError("");
  };

  const handleBudgetChange = (event) => {
    setBudgetCategory(event.target.value);
    clearResults();
    setNotice("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.error("No se pudo actualizar el plan local.", storageError);
      setError("No se pudo actualizar el plan guardado en este dispositivo.");
    }
  };

  const handleCompanionChange = (event) => {
    setCompanion(event.target.value);
    clearResults();
    setNotice("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.error("No se pudo actualizar el plan local.", storageError);
      setError("No se pudo actualizar el plan guardado en este dispositivo.");
    }
  };

  const handleTravelTypeToggle = (type) => {
    setTravelTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) return current;
        return current.filter((value) => value !== type);
      }
      return [...current, type];
    });
    clearResults();
    setNotice("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.error("No se pudo actualizar el plan local.", storageError);
      setError("No se pudo actualizar el plan guardado en este dispositivo.");
    }
  };

  const handleRecommendations = async (event) => {
    event.preventDefault();
    if (travelTypes.length === 0) {
      setError("Selecciona al menos un tipo de plan.");
      return;
    }
    setIsLoading(true);
    setLoadingAction("recommendations");
    setNotice("");
    setError("");
    clearResults();

    try {
      const response = await fetch(`${AI_SERVICE_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_viaje: travelTypes,
          presupuesto: budgetCategory,
          companions: companion,
          top_n: 3,
        }),
      });
      const result = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `El servicio ML respondió con estado ${response.status}.`
        );
      }
      if (
        !Array.isArray(result.recommendations) ||
        !result.recommendations.every(isRecommendation) ||
        !isModelInfo(result.model)
      ) {
        throw new Error("El servicio ML devolvió una respuesta incompleta.");
      }
      if (result.recommendations.length === 0) {
        setRecommendations([]);
        setModelInfo(result.model);
        setNotice("El modelo no encontró experiencias con ese presupuesto.");
        return;
      }

      setRecommendations(result.recommendations);
      setModelInfo(result.model);
      setNotice(
        `El modelo encontró ${result.recommendations.length} experiencias. Elige una para crear tu itinerario de un día.`
      );
    } catch (requestError) {
      console.error("No se pudieron cargar las recomendaciones ML.", requestError);
      setError(
        requestError instanceof TypeError
          ? "No se pudo conectar con el servicio ML. Verifica que esté encendido."
          : requestError.message
      );
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const handleChooseRecommendation = async (recommendation) => {
    if (
      isLoading ||
      (plan &&
        selectedRecommendation?.plan_turistico_bogota ===
          recommendation.plan_turistico_bogota)
    ) {
      return;
    }

    setSelectedRecommendation(recommendation);
    setPlan(null);
    setChatMessages([]);
    setChatError("");
    setIsLoading(true);
    setLoadingAction("plan");
    setNotice("DeepSeek está preparando un itinerario de un día y consultando el clima...");
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/ai/expo-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: recommendation.plan_turistico_bogota,
          predictedRating: recommendation.predicted_rating,
          travelType: recommendation.tipo_viaje,
          budgetCategory,
          companion,
          localPlans: plans.map(getLocalPlanContext),
        }),
      });
      const result = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : `DeepSeek respondió con estado ${response.status}.`
        );
      }
      if (!result.success || !isTravelPlan(result.data)) {
        throw new Error(
          "DeepSeek devolvió un itinerario incompleto. Inténtalo otra vez."
        );
      }

      setPlan(result.data);
      setNotice(
        "Itinerario creado con DeepSeek y pronóstico de Open-Meteo."
      );

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: 6,
            budgetCategory,
            companion,
            travelTypes,
            recommendations,
            selectedRecommendation: recommendation,
            model: modelInfo,
            plan: result.data,
            calculatedAt: new Date().toISOString(),
          })
        );
      } catch (storageError) {
        console.error("No se pudo guardar el plan en este dispositivo.", storageError);
        setNotice("El plan está listo, pero no se pudo guardar localmente.");
      }
    } catch (requestError) {
      console.error("No se pudo crear el itinerario.", requestError);
      setError(
        requestError instanceof TypeError
          ? "No se pudo conectar con el backend. Verifica que esté encendido."
          : requestError.message
      );
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]);
    if (!allowedTypes.has(file.type)) {
      setChatPhoto(null);
      setChatPhotoPreview("");
      setChatError("La foto debe ser JPEG, PNG, GIF o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setChatPhoto(null);
      setChatPhotoPreview("");
      setChatError("La foto no puede superar los 5 MB.");
      return;
    }

    setChatError("");
    setChatPhoto(file);
    setChatPhotoPreview(URL.createObjectURL(file));
  };

  const removeChatPhoto = () => {
    setChatPhoto(null);
    setChatPhotoPreview("");
    setChatError("");
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const photo = chatPhoto;
    const question =
      chatInput.trim() ||
      (photo ? "Analiza esta imagen y dime qué información turística puedes aportar." : "");
    if (!question || !plan || !selectedRecommendation || isChatLoading) return;

    const history = chatMessages
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));
    setChatMessages((current) => [
      ...current,
      { role: "user", content: question, imageAttached: Boolean(photo) },
    ]);
    setChatInput("");
    setChatError("");
    setIsChatLoading(true);

    try {
      const payload = {
        planName: selectedRecommendation.plan_turistico_bogota,
        budgetCategory,
        plan,
        message: question,
        history,
      };
      let body = JSON.stringify(payload);
      const headers = { "Content-Type": "application/json" };
      if (photo) {
        const formData = new FormData();
        formData.append("planName", payload.planName);
        formData.append("budgetCategory", payload.budgetCategory);
        formData.append("plan", JSON.stringify(payload.plan));
        formData.append("message", payload.message);
        formData.append("history", JSON.stringify(payload.history));
        formData.append("photo", photo);
        body = formData;
        delete headers["Content-Type"];
      }

      const response = await fetch(`${BACKEND_URL}/ai/expo-chat`, {
        method: "POST",
        headers,
        body,
      });
      const result = await readJsonResponse(response);
      if (!response.ok || !result.success || !isText(result.reply, 2000)) {
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : `ClaudIA respondió con estado ${response.status}.`
        );
      }
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply.replace(/\*\*/g, "").replace(/`/g, ""),
        },
      ]);
      if (photo) {
        setChatPhoto(null);
        setChatPhotoPreview("");
      }
    } catch (requestError) {
      console.error("ClaudIA no pudo responder.", requestError);
      setChatError(
        requestError instanceof TypeError
          ? "No se pudo conectar con ClaudIA. Verifica que el backend esté encendido."
          : requestError.message
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearSavedSearch = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("expo-trip-plan-v5");
      localStorage.removeItem("expo-trip-plan-v4");
      localStorage.removeItem("expo-trip-search-v3");
      localStorage.removeItem("expo-trip-search");
      setBudgetCategory(INITIAL_BUDGET);
      setCompanion("pareja");
      setTravelTypes(INITIAL_TRAVEL_TYPES);
      clearResults();
      setNotice("Se borró el plan guardado en este dispositivo.");
    } catch (storageError) {
      console.error("No se pudo borrar el plan local.", storageError);
      setError("No se pudo borrar el plan guardado.");
    }
  };

  const weatherIcon =
    plan?.weather?.available &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      plan.weather.weather_code
    )
      ? FiCloudRain
      : FiCloud;
  const mapPoints = plan
    ? [
        ...plan.route_points.map((point) => ({
          ...point,
          name: `${point.time} · ${point.title}`,
          description: `${point.location}. ${point.description}`,
          details: [
            point.source,
            point.approximate ? "Ubicación aproximada" : "Ubicación de OpenStreetMap",
          ],
          kind: "itinerary",
        })),
        ...plan.parking_points,
      ]
    : [];
  const mapRoutes =
    plan?.route_points.length > 1
      ? [
          {
            id: "itinerary-sequence",
            name: "Secuencia geográfica aproximada (no es navegación vial)",
            positions: plan.route_points.map((point) => [point.lat, point.lng]),
            color: "#8be3d3",
          },
        ]
      : [];

  return (
    <section className="expo-trip-panel" aria-labelledby="trip-planner-title">
      <header className="expo-trip-header">
        <div>
          <span className="expo-panel-kicker">
            EL CUBO · MACHINE LEARNING + DEEPSEEK FLASH
          </span>
          <h2 id="trip-planner-title">Elige una experiencia para tu día</h2>
          <p>
            Elige presupuesto, compañía y los tipos de plan que te interesan.
            ML te muestra tres opciones; tú eliges una y DeepSeek crea un
            itinerario de un día con clima, mapa, transporte y consejos.
          </p>
        </div>
        <span className="expo-trip-local-badge">
          La búsqueda se guarda solo en este dispositivo
        </span>
      </header>

      <form className="expo-trip-form" onSubmit={handleRecommendations}>
        <div className="expo-trip-field">
          <label htmlFor="trip-budget">
            <FiDollarSign aria-hidden="true" /> Presupuesto
          </label>
          <select
          id="trip-budget"
          value={budgetCategory}
          onChange={handleBudgetChange}
          disabled={isLoading}
          >
            {BUDGET_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="expo-trip-field">
          <label htmlFor="trip-companion">
          <FiUsers aria-hidden="true" /> Compañía
          </label>
          <select
          id="trip-companion"
          value={companion}
          onChange={handleCompanionChange}
          disabled={isLoading}
          >
          {COMPANIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          </select>
        </div>

        <fieldset className="expo-interest-field">
          <legend>
            <FiActivity aria-hidden="true" /> Tipo de plan
          </legend>
          <div className="expo-interest-options">
            {TRAVEL_TYPES.map(({ value, label, icon: Icon }) => {
              const selected = travelTypes.includes(value);
              return (
                <button
                  className={`expo-interest-chip${selected ? " selected" : ""}`}
                  type="button"
                  key={value}
                  aria-pressed={selected}
                  disabled={
                    isLoading || (selected && travelTypes.length === 1)
                  }
                  onClick={() => handleTravelTypeToggle(value)}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="expo-trip-budget-note">
            Selecciona los estilos que te interesan; el modelo los usa para
            recomendarte tres experiencias.
          </p>
        </fieldset>

        <div className="expo-trip-actions">
          <button
            className="expo-trip-submit"
            type="submit"
            disabled={isLoading}
          >
            <FiBox aria-hidden="true" />
            {loadingAction === "recommendations"
              ? "Buscando opciones..."
              : "Mostrarme 3 experiencias"}
          </button>
          <button
            className="expo-trip-reset"
            type="button"
            onClick={clearSavedSearch}
            disabled={isLoading || isChatLoading}
          >
            <FiRefreshCw aria-hidden="true" />
            Borrar plan guardado
          </button>
        </div>
      </form>

      {notice && (
        <p className="expo-trip-notice" role="status" aria-live="polite">
          {notice}
        </p>
      )}
      {error && (
        <p className="expo-trip-error" role="alert">
          {error}
        </p>
      )}

      {recommendations?.length > 0 && (
        <section
          className="expo-recommendations"
          aria-labelledby="expo-recommendations-title"
        >
          <div className="expo-recommendations-heading">
            <div>
              <span className="expo-panel-kicker">MACHINE LEARNING</span>
              <h3 id="expo-recommendations-title">Elige una de las opciones</h3>
            </div>
            {modelInfo && (
              <p>
                {modelInfo.name} ·{" "}
                {Number(modelInfo.training_rows).toLocaleString("es-CO")} datos
                · MAE {Number(modelInfo.validation_mae).toFixed(2)}
              </p>
            )}
          </div>
          <div className="expo-recommendation-grid">
            {recommendations.map((recommendation, index) => {
              const isSelected =
                selectedRecommendation?.plan_turistico_bogota ===
                recommendation.plan_turistico_bogota;
              return (
                <article
                  className={`expo-recommendation-card${isSelected ? " selected" : ""}`}
                  key={recommendation.plan_turistico_bogota}
                >
                  <span className="expo-recommendation-rank">
                    OPCIÓN {index + 1}
                  </span>
                  <h4>{recommendation.plan_turistico_bogota}</h4>
                  <p>
                    {TRAVEL_TYPES.find(
                      (type) => type.value === recommendation.tipo_viaje
                    )?.label || recommendation.tipo_viaje}
                  </p>
                  <span className="expo-recommendation-rating">
                    <FiStar aria-hidden="true" />{" "}
                    {Number(recommendation.predicted_rating).toFixed(2)} / 5
                    {" · "}
                    {Number(recommendation.rating_samples).toLocaleString(
                      "es-CO"
                    )}{" "}
                    valoraciones
                  </span>
                  <button
                    type="button"
                    className="expo-recommendation-select"
                    onClick={() => handleChooseRecommendation(recommendation)}
                    disabled={isLoading}
                  >
                    {loadingAction === "plan" && isSelected
                      ? "Creando itinerario..."
                      : plan && isSelected
                        ? "Experiencia elegida"
                        : "Elegir y crear itinerario"}
                    <FiArrowUpRight aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {plan && selectedRecommendation && (
        <div className="expo-plan-result" aria-live="polite">
          <header className="expo-plan-heading">
            <div>
              <span className="expo-panel-kicker">ITINERARIO DE UN DÍA</span>
              <h3>{selectedRecommendation.plan_turistico_bogota}</h3>
            </div>
            <strong>
              <FiStar aria-hidden="true" />{" "}
              {Number(selectedRecommendation.predicted_rating).toFixed(2)} / 5 ML
            </strong>
          </header>

          <p className="expo-plan-overview">{plan.overview}</p>
          <section className="expo-quality-card" aria-label="Índice estimado del itinerario">
            <div className="expo-quality-summary">
              <span className="expo-quality-ring" style={{ "--quality-score": `${plan.quality_score.total}%` }}>
                <strong>{plan.quality_score.total}</strong>
                <small>/100</small>
              </span>
              <div>
                <span className="expo-panel-kicker">REVISIÓN DEL PLAN</span>
                <h4><FiAward aria-hidden="true" /> Índice estimado</h4>
                <p>No es una calificación en tiempo real; es una estimación heurística del itinerario.</p>
              </div>
            </div>
            <div className="expo-quality-components">
              {plan.quality_score.components.map((component) => (
                <div className="expo-quality-component" key={component.key}>
                  <div>
                    <span>{component.label}</span>
                    <strong>{component.score}/100</strong>
                  </div>
                  <progress max="100" value={component.score}>
                    {component.score}
                  </progress>
                </div>
              ))}
            </div>
          </section>

          <aside className="expo-selection-reason">
            <FiActivity aria-hidden="true" />
            <p><strong>¿Por qué esta experiencia?</strong> {plan.selection_reason}</p>
          </aside>

          <section className="expo-forecast-card" aria-label="Pronóstico de mañana">
            <div className="expo-forecast-icon">
              {plan.weather.available ? (
                (() => {
                  const Icon = weatherIcon;
                  return <Icon aria-hidden="true" />;
                })()
              ) : (
                <FiCloud aria-hidden="true" />
              )}
            </div>
            <div className="expo-forecast-copy">
              <span className="expo-panel-kicker">
                PRONÓSTICO DE MAÑANA · {plan.weather.source || "CLIMA"}
              </span>
              {plan.weather.available ? (
                <>
                  <h4>
                    {formatWeatherDate(plan.weather.date)} ·{" "}
                    {plan.weather.condition}
                  </h4>
                  <p>
                    {Math.round(plan.weather.temp_min_c)}°–{Math.round(
                      plan.weather.temp_max_c
                    )}°C · Probabilidad de lluvia{" "}
                    {Math.round(
                      plan.weather.precipitation_probability_percent
                    )}% · Viento hasta{" "}
                    {Math.round(plan.weather.wind_speed_kmh)} km/h
                  </p>
                </>
              ) : (
                <h4>El pronóstico no está disponible</h4>
              )}
              <p className="expo-weather-advice">
                {plan.weather_advice}
              </p>
            </div>
            {plan.weather.available &&
              plan.weather.precipitation_probability_percent >= 40 && (
                <FiUmbrella
                  className="expo-forecast-extra-icon"
                  aria-label="Probabilidad de lluvia"
                />
              )}
          </section>

          <section className="expo-plan-section">
            <h4>
              <FiDollarSign aria-hidden="true" /> Presupuesto estimado del día
            </h4>
            <div className="expo-plan-price-list">
              {PRICE_ROWS.map(({ key, label }) => {
                const price = plan.averages_cop[key];
                return (
                  <article key={key}>
                    <span>{label}</span>
                    <strong>{formatCOP(price.average)}</strong>
                    <small>
                      {formatCOP(price.min)}–{formatCOP(price.max)}
                    </small>
                  </article>
                );
              })}
            </div>
            <p className="expo-trip-budget-note">
              Estimaciones por persona en COP; no son precios en tiempo real.
            </p>
          </section>

          <section className="expo-plan-section">
            <h4>
              <FiBookOpen aria-hidden="true" /> Datos curiosos del lugar
            </h4>
            <ul className="expo-curiosity-list">
              {plan.curiosities.map((curiosity, index) => (
                <li key={`${curiosity}-${index}`}>{curiosity}</li>
              ))}
            </ul>
          </section>

          <section className="expo-plan-section">
            <h4><FiMap aria-hidden="true" /> Mapa del itinerario · Leaflet + OpenStreetMap</h4>
            {mapPoints.length > 0 ? (
              <>
                <div className="expo-plan-map">
                  <MapView
                    center={plan.route_points[0] || mapPoints[0]}
                    points={mapPoints}
                    routes={mapRoutes}
                    showFallback={false}
                  />
                </div>
                <div className="expo-map-legend">
                  <span><i className="expo-legend-dot featured" /> Parada del itinerario</span>
                  <span><i className="expo-parking-key">P</i> Parqueadero OSM</span>
                  <span><i className="expo-legend-line" /> Secuencia estimada</span>
                </div>
              </>
            ) : (
              <p className="expo-map-empty">{plan.map_note}</p>
            )}
            <p className="expo-map-caption">
              {plan.map_note} Las líneas conectan paradas en línea recta; no son rutas viales ni de transporte.
              Datos del mapa © OpenStreetMap contributors.
            </p>
          </section>

          <section className="expo-plan-section">
            <h4><FiNavigation aria-hidden="true" /> Cómo moverte</h4>
            <div className="expo-route-grid">
              {ROUTE_MODES.map(({ id, label, icon: Icon, details }) => (
                <article className="expo-route-card" key={id}>
                  <Icon aria-hidden="true" />
                  <div>
                    <strong>{label}</strong>
                    <p>{plan.transport_advice[id] || details}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="expo-plan-section">
            <h4><FiMapPin aria-hidden="true" /> Parqueaderos cercanos</h4>
            <div className="expo-parking-card">
              <p>{plan.parking_advice}</p>
              <p className="expo-trip-budget-note">{plan.parking_note}</p>
              {plan.parking_points.length > 0 && (
                <ul className="expo-parking-list">
                  {plan.parking_points.map((parking) => (
                    <li key={parking.id}>
                      <strong>{parking.name}</strong>
                      {parking.details?.length > 0 && <span>{parking.details.join(" · ")}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="expo-plan-section">
            <h4>
              <FiMap aria-hidden="true" /> Itinerario
            </h4>
            <ol className="expo-plan-itinerary">
              {plan.itinerary.map((step, index) => (
                <li key={`${step.time}-${step.title}-${index}`}>
                  <span className="expo-plan-day">{step.time}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <span className={`expo-setting-tag ${step.setting}`}>
                      {step.setting === "indoor" ? "Bajo techo" : step.setting === "outdoor" ? "Al aire libre" : "Mixto"} · {step.location}
                    </span>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="expo-plan-section">
            <h4>Restaurantes y comida</h4>
            <div className="expo-plan-card-grid">
              {plan.restaurants.map((restaurant) => (
                <article className="expo-plan-card" key={restaurant.name}>
                  <strong>{restaurant.name}</strong>
                  <p>
                    {restaurant.neighborhood} · {restaurant.specialty}
                  </p>
                  <p>
                    Aprox. {formatCOP(restaurant.price_per_person_cop)} por
                    persona
                  </p>
                  <small>{restaurant.why}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="expo-plan-section">
            <h4>Consejos prácticos</h4>
            <ul className="expo-plan-tips">
              {plan.practical_tips.map((tip, index) => (
                <li key={`${tip}-${index}`}>{tip}</li>
              ))}
            </ul>
          </section>

          <p className="expo-trip-budget-note">{plan.verification_note}</p>

          <section
            className="expo-claudia-panel"
            aria-labelledby="expo-claudia-title"
          >
            <header>
              <span className="expo-claudia-icon">
                <FiMessageCircle aria-hidden="true" />
              </span>
              <div>
                <h4 id="expo-claudia-title">ClaudIA</h4>
                <p>Pregúntale sobre este plan, el clima o cómo moverte.</p>
              </div>
            </header>
            <p className="expo-claudia-welcome">
              Hola, soy ClaudIA. Por ejemplo: “¿Qué llevo si mañana llueve?” o
              “¿Cómo llego en TransMilenio?”.
            </p>
            <label className="expo-claudia-photo-button" htmlFor="expo-claudia-photo">
              <FiCamera aria-hidden="true" />
              Adjuntar foto para analizar
              <input
                className="expo-visually-hidden"
                id="expo-claudia-photo"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                disabled={isChatLoading}
              />
            </label>
            <p className="expo-claudia-privacy">
              La imagen se envía a DeepSeek para analizarla y no se guarda en el servidor.
            </p>
            {chatPhotoPreview && chatPhoto && (
              <div className="expo-photo-preview">
                <img src={chatPhotoPreview} alt="Vista previa de la foto adjunta" />
                <span><FiImage aria-hidden="true" /> {chatPhoto.name}</span>
                <button
                  type="button"
                  aria-label="Quitar foto adjunta"
                  onClick={removeChatPhoto}
                  disabled={isChatLoading}
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
            )}
            {chatMessages.length > 0 && (
              <div className="expo-claudia-messages" role="log" aria-live="polite">
                {chatMessages.map((message, index) => (
                  <article
                    className={`expo-claudia-message ${message.role}`}
                    key={`${message.role}-${index}`}
                  >
                    <strong>
                      {message.role === "assistant" ? "ClaudIA" : "Tú"}
                    </strong>
                    {message.imageAttached && (
                      <span className="expo-chat-image-note">
                        <FiImage aria-hidden="true" /> Imagen adjunta
                      </span>
                    )}
                    <p>{message.content}</p>
                  </article>
                ))}
                {isChatLoading && (
                  <p className="expo-claudia-loading" role="status">
                    ClaudIA está pensando...
                  </p>
                )}
              </div>
            )}
            {chatError && (
              <p className="expo-trip-error" role="alert">
                {chatError}
              </p>
            )}
            <form className="expo-claudia-form" onSubmit={handleChatSubmit}>
              <label
                className="expo-visually-hidden"
                htmlFor="expo-claudia-input"
              >
                Pregúntale a ClaudIA
              </label>
              <input
                id="expo-claudia-input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={chatPhoto ? "¿Qué quieres saber de la foto?" : "Escribe tu pregunta"}
                maxLength={600}
                disabled={isChatLoading}
              />
              <button
                type="submit"
                aria-label="Enviar mensaje a ClaudIA"
                disabled={(!chatInput.trim() && !chatPhoto) || isChatLoading}
              >
                <FiSend aria-hidden="true" />
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
