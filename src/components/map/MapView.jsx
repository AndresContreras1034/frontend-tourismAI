import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

// 🔧 Fix iconos Leaflet (obligatorio en React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const DEFAULT_MARKER_ICON = new L.Icon.Default();

/**
 * 📍 Ajusta el mapa automáticamente a los puntos
 */
function FitBounds({ points, routes }) {
  const map = useMap();

  useEffect(() => {
    const bounds = points.map((point) => [point.lat, point.lng]);
    routes.forEach((route) => bounds.push(...route.positions));

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13, animate: false });
    }
  }, [points, routes, map]);

  return null;
}

function FocusPoint({ point }) {
  const map = useMap();

  useEffect(() => {
    if (point) {
      map.flyTo([point.lat, point.lng], point.zoom || 14, { duration: 0.8 });
    }
  }, [map, point]);

  return null;
}

function PointPopup({ point }) {
  return (
    <div className="map-popup">
      <h4>{point.name}</h4>
      {point.description && <p>{point.description}</p>}
      {point.plans?.length > 0 && (
        <ul className="map-popup-plan-list">
          {point.plans.map((plan) => (
            <li key={plan.name}>
              <span>{plan.name}</span>
              <small>
                ★ {Number(plan.rating_average).toFixed(1)} ·{" "}
                {Number(plan.rating_samples).toLocaleString("es-CO")} ratings
              </small>
            </li>
          ))}
        </ul>
      )}
      {point.details?.length > 0 && (
        <ul className="map-popup-details">
          {point.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {point.approximate && (
        <p className="map-popup-note">Zona aproximada; no es una dirección exacta.</p>
      )}
    </div>
  );
}

export default function MapView({
  center,
  points = [],
  routes = [],
  focusPoint = null,
  showFallback = true,
}) {
  const validPoints = useMemo(() => {
    return points.filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng)
    );
  }, [points]);
  const validRoutes = useMemo(
    () =>
      routes.filter(
        (route) =>
          Array.isArray(route.positions) &&
          route.positions.length > 1 &&
          route.positions.every(
            (position) =>
              Array.isArray(position) &&
              position.length === 2 &&
              position.every(Number.isFinite)
          )
      ),
    [routes]
  );

  const defaultCenter = center
    ? [center.lat, center.lng]
    : [4.711, -74.0721]; // Bogotá fallback

  return (
    <div className="map-wrapper">

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="map"
      >
        <FitBounds points={validPoints} routes={validRoutes} />
        <FocusPoint point={focusPoint} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.positions}
            pathOptions={{
              color: route.color || "#8b5cf6",
              weight: 5,
              opacity: 0.82,
              dashArray: "8 8",
            }}
          >
            <Tooltip sticky>{route.name}</Tooltip>
          </Polyline>
        ))}

        {validPoints.map((point, index) =>
          point.kind === "cluster" ? (
            <CircleMarker
              key={point.id || index}
              center={[point.lat, point.lng]}
              radius={Math.min(25, 12 + point.count)}
              pathOptions={{
                color: "#b79aff",
                fillColor: "#7854cc",
                fillOpacity: 0.83,
                weight: 2,
              }}
            >
              <Tooltip permanent direction="center" className="map-cluster-tooltip">
                {point.count}
              </Tooltip>
              <Popup>
                <PointPopup point={point} />
              </Popup>
            </CircleMarker>
          ) : (
            <Marker
              key={point.id || index}
              position={[point.lat, point.lng]}
              icon={
                point.kind === "parking"
                  ? L.divIcon({
                      className: "map-parking-marker",
                      html: "<span>P</span>",
                      iconSize: [28, 28],
                      iconAnchor: [14, 14],
                    })
                  : point.approximate
                    ? DEFAULT_MARKER_ICON
                    : L.divIcon({
                      className: "map-featured-marker",
                      html: "<span></span>",
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })
              }
            >
              <Popup>
                <PointPopup point={point} />
              </Popup>
            </Marker>
          )
        )}

        {showFallback && validPoints.length === 0 && (
          <Marker position={defaultCenter}>
            <Popup>Punto principal del plan</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}