import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { io } from "socket.io-client";
import "./MapView.css";
import { addTrafficLayer } from "./TrafficLayer.js";
import { addPollutionLayer } from "./PollutionLayer.js";
import { addEventLayer } from "./EventLayer.js";
import { addWeatherMapLayer } from "./WeatherMapLayer.js";
import WeatherLayer from "./WeatherLayer.jsx";
/* ─── Constants ─────────────────────────────────────── */

const VIJAYAWADA_CENTER = [80.648, 16.5062];
const LOCK_RADIUS_METERS = 17000;
const MAX_BOUNDS = [
  [80.26, 16.1],
  [81.06, 16.92],
];

const DEFAULT_WEATHER = {
  lat: 0,
  lon: 0,
  condition: { id: 0, main: "Unknown", description: "Unknown", icon: "" },
  main: {
    temp: 0,
    feels_like: 0,
    temp_min: 0,
    temp_max: 0,
    pressure: 0,
    humidity: 0,
  },
  wind: { speed: 0, deg: 0 },
  clouds: 0,
};

const DEFAULT_POLLUTION = {
  co: 0,
  nh3: 0,
  no: 0,
  no2: 0,
  o3: 0,
  pm2_5: 0,
  pm10: 0,
  so2: 0,
  aqi: 0,
};

const WEATHER_SCALES = {
  temp: { min: 15, max: 50 },
  humidity: { min: 0, max: 100 },
  wind: { min: 0, max: 25 },
  clouds: { min: 0, max: 100 },
  pressure: { min: 980, max: 1030 },
};

const POLLUTION_SCALES = {
  co: 100,
  nh3: 20,
  no: 20,
  no2: 20,
  o3: 120,
  pm2_5: 80,
  pm10: 120,
  so2: 50,
};

/* ─── Helpers ────────────────────────────────────────── */

function normalizeRange(value, min, max) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function normalizeMax(value, max) {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

function getAQIInfo(aqi) {
  if (aqi <= 50) return { color: "#22c55e", bg: "#dcfce7", label: "Good" };
  if (aqi <= 100) return { color: "#eab308", bg: "#fef9c3", label: "Moderate" };
  if (aqi <= 150)
    return { color: "#f97316", bg: "#ffedd5", label: "Sensitive" };
  if (aqi <= 200)
    return { color: "#ef4444", bg: "#fee2e2", label: "Unhealthy" };
  if (aqi <= 300)
    return { color: "#8b5cf6", bg: "#ede9fe", label: "Very Unhealthy" };
  return { color: "#be123c", bg: "#ffe4e6", label: "Hazardous" };
}

function calculateAverageWeatherData(data) {
  if (!data) return DEFAULT_WEATHER;
  if (Array.isArray(data) && data.length > 0) {
    let sumTemp = 0,
      sumFeelsLike = 0,
      sumTempMin = 0,
      sumTempMax = 0,
      sumPressure = 0,
      sumHumidity = 0,
      sumWindSpeed = 0,
      sumClouds = 0;
    let conditionIcon = "",
      conditionMain = "Unknown",
      conditionDescription = "Unknown";

    data.forEach((point) => {
      sumTemp += point.main?.temp ?? 0;
      sumFeelsLike += point.main?.feels_like ?? 0;
      sumTempMin += point.main?.temp_min ?? 0;
      sumTempMax += point.main?.temp_max ?? 0;
      sumPressure += point.main?.pressure ?? 0;
      sumHumidity += point.main?.humidity ?? 0;
      sumWindSpeed += point.wind?.speed ?? 0;
      sumClouds += point.clouds ?? 0;
      if (!conditionIcon && point.condition?.icon) {
        conditionIcon = point.condition.icon;
        conditionMain = point.condition.main || "Unknown";
        conditionDescription = point.condition.description || "Unknown";
      }
    });

    const count = data.length;
    return {
      lat: 0,
      lon: 0,
      condition: {
        id: 0,
        main: conditionMain,
        description: conditionDescription,
        icon: conditionIcon,
      },
      main: {
        temp: sumTemp / count,
        feels_like: sumFeelsLike / count,
        temp_min: sumTempMin / count,
        temp_max: sumTempMax / count,
        pressure: sumPressure / count,
        humidity: sumHumidity / count,
      },
      wind: { speed: sumWindSpeed / count, deg: 0 },
      clouds: sumClouds / count,
    };
  }
  return { ...DEFAULT_WEATHER };
}

function buildPollutionValues(data) {
  if (!data) return DEFAULT_POLLUTION;
  if (Array.isArray(data) && data.length > 0) {
    let sumCo = 0,
      sumNh3 = 0,
      sumNo = 0,
      sumNo2 = 0;
    let sumO3 = 0,
      sumPm25 = 0,
      sumPm10 = 0,
      sumSo2 = 0,
      sumAqi = 0;

    data.forEach((point) => {
      const c = point.components || point;
      sumCo += c.co || 0;
      sumNh3 += c.nh3 || 0;
      sumNo += c.no || 0;
      sumNo2 += c.no2 || 0;
      sumO3 += c.o3 || 0;
      sumPm25 += c.pm2_5 || 0;
      sumPm10 += c.pm10 || 0;
      sumSo2 += c.so2 || 0;
      sumAqi += point.aqi || 0;
    });

    const count = data.length;
    return {
      co: sumCo / count,
      nh3: sumNh3 / count,
      no: sumNo / count,
      no2: sumNo2 / count,
      o3: sumO3 / count,
      pm2_5: sumPm25 / count,
      pm10: sumPm10 / count,
      so2: sumSo2 / count,
      aqi: Math.round(sumAqi / count),
    };
  }
  return { ...DEFAULT_POLLUTION, ...data };
}

/* ─── Map Geometry Helpers ───────────────────────────── */

function createCircle(center, radiusMeters, steps = 128) {
  const [lng, lat] = center;
  const coordinates = [];
  const earthRadius = 6371000;
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i * Math.PI * 2) / steps;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const deltaLng =
      (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const deltaLat = (dy / earthRadius) * (180 / Math.PI);
    coordinates.push([lng + deltaLng, lat + deltaLat]);
  }
  return coordinates;
}

function createMaskGeoJSON(center) {
  const outerRing = [
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
    [-180, 90],
  ];
  const innerRing = createCircle(center, LOCK_RADIUS_METERS);
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [outerRing, innerRing] },
  };
}

function createLockPoints(center, radiusMeters, count = 16) {
  const [lng, lat] = center;
  const earthRadius = 6371000;
  const lockRadius = radiusMeters * 1.5;
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i * Math.PI * 2) / count;
    const dx = lockRadius * Math.cos(angle);
    const dy = lockRadius * Math.sin(angle);
    const deltaLng =
      (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const deltaLat = (dy / earthRadius) * (180 / Math.PI);
    points.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lng + deltaLng, lat + deltaLat],
      },
      properties: { icon: "🔒" },
    });
  }
  return { type: "FeatureCollection", features: points };
}

/* ─── Sub-components ─────────────────────────────────── */

function MetricCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  barPct,
  barColor,
  icon,
}) {
  const isPositive = trend >= 0;
  return (
    <div className="mv-metric-card">
      <p className="mv-metric-label">
        {icon} {label}
      </p>
      <div className="mv-metric-row">
        <span className="mv-metric-value">
          {value}
          <span className="mv-metric-unit">{unit}</span>
        </span>
        {trend !== undefined && (
          <span
            className={`mv-metric-trend ${isPositive ? "trend-up" : "trend-down"}`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}
            {trendLabel || ""}
          </span>
        )}
        {trendLabel && trend === undefined && (
          <span className="mv-metric-badge">{trendLabel}</span>
        )}
      </div>
      <div className="mv-bar-track">
        <div
          className="mv-bar-fill"
          style={{ width: `${barPct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

function PollutionChart({ pollution }) {
  const items = [
    { label: "PM2.5", value: pollution.pm2_5, max: POLLUTION_SCALES.pm2_5 },
    { label: "NO₂", value: pollution.no2, max: POLLUTION_SCALES.no2 },
    { label: "O₃", value: pollution.o3, max: POLLUTION_SCALES.o3 },
    { label: "SO₂", value: pollution.so2, max: POLLUTION_SCALES.so2 },
  ];
  const maxH = 100;
  const barW = 36;
  const gap = 16;
  const totalW = items.length * barW + (items.length - 1) * gap;

  return (
    <svg
      className="mv-pollution-svg"
      viewBox={`0 0 ${totalW} ${maxH + 28}`}
      width="100%"
      height={maxH + 28}
    >
      {items.map((item, i) => {
        const h = Math.max(4, Math.min(maxH, (item.value / item.max) * maxH));
        const x = i * (barW + gap);
        const pct = (item.value / item.max) * 100;
        const fill =
          pct < 30
            ? "#22c55e"
            : pct < 60
              ? "#eab308"
              : pct < 80
                ? "#f97316"
                : "#ef4444";
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={maxH - h}
              width={barW}
              height={h}
              fill={fill}
              rx={5}
              opacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={maxH - h - 5}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#475569"
            >
              {item.value.toFixed(1)}
            </text>
            <text
              x={x + barW / 2}
              y={maxH + 14}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#64748b"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ToggleBtn({ icon, label, active, onToggle }) {
  return (
    <button
      className={`mv-toggle-btn ${active ? "mv-on" : "mv-off"}`}
      onClick={onToggle}
    >
      <span className="mv-toggle-icon">{icon}</span>
      <span className="mv-toggle-label">{label}</span>
      <span
        className={`mv-toggle-pill ${active ? "mv-pill-on" : "mv-pill-off"}`}
      >
        {active ? "ON" : "OFF"}
      </span>
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────── */

function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  /* Socket state */
  const [weather, setWeather] = useState(DEFAULT_WEATHER);
  const [pollution, setPollution] = useState(DEFAULT_POLLUTION);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [now, setNow] = useState(new Date());

  /* Panel toggles */
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  /* Layer toggles */
  const [weatherOn, setWeatherOn] = useState(true);
  const [pollutionOn, setPollutionOn] = useState(true);
  const [eventsOn, setEventsOn] = useState(true);
  const [trafficOn, setTrafficOn] = useState(true);

  const dispatch = (layer, visible) =>
    window.dispatchEvent(
      new CustomEvent("citymap:toggle", { detail: { layer, visible } }),
    );

  const toggleWeather = useCallback(() => {
    const v = !weatherOn;
    setWeatherOn(v);
    dispatch("weather", v);
  }, [weatherOn]);
  const togglePollution = useCallback(() => {
    const v = !pollutionOn;
    setPollutionOn(v);
    dispatch("pollution", v);
  }, [pollutionOn]);
  const toggleEvents = useCallback(() => {
    const v = !eventsOn;
    setEventsOn(v);
    dispatch("events", v);
  }, [eventsOn]);
  const toggleTraffic = useCallback(() => {
    const v = !trafficOn;
    setTrafficOn(v);
    dispatch("traffic", v);
  }, [trafficOn]);

  /* Clock tick */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
  if (!map.current) return;

  addEventLayer(map.current, events);

}, [events]);

  /* Socket connections */
  useEffect(() => {
    const socket = io("https://urbaneye-jepe.onrender.com", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🗺️ Socket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🗺️ Socket disconnected");
      setConnected(false);
    });

    // 🌤️ Weather
    socket.on("weather:update", (data) => {
      console.log("weather:", data);
      setWeather(calculateAverageWeatherData(data));
    });

    // 🌫️ Pollution
    socket.on("pollution:update", (data) => {
      console.log("pollution:", data);
      setPollution(buildPollutionValues(data));
    });

    // 📍 Events
    socket.on("event:all", (evts) => {
      console.log("event:all:", evts);
      setEvents(evts || []);
    });

    socket.on("event:sync", (evts) => {
      console.log("event:sync:", evts);
      setEvents(evts || []);
    });

    return () => socket.disconnect();
  }, []);

  /* Map init */
  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: VIJAYAWADA_CENTER,
      zoom: 12,
      maxBounds: MAX_BOUNDS,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      map.current.addSource("lock-mask", {
        type: "geojson",
        data: createMaskGeoJSON(VIJAYAWADA_CENTER),
      });

      map.current.addLayer({
        id: "lock-mask-fill",
        type: "fill",
        source: "lock-mask",
        paint: { "fill-color": "#4b5563", "fill-opacity": 0.55 },
      });

      map.current.addSource("lock-icons", {
        type: "geojson",
        data: createLockPoints(VIJAYAWADA_CENTER, LOCK_RADIUS_METERS),
      });

      map.current.addLayer({
        id: "lock-icons-layer",
        type: "symbol",
        source: "lock-icons",
        layout: {
          "text-field": ["get", "icon"],
          "text-size": 26,
          "text-anchor": "center",
        },
      });

      addTrafficLayer(map.current);
      addPollutionLayer(map.current);
      addEventLayer(map.current, events);
      addWeatherMapLayer(map.current);
    });
  }, []);

  /* Derived values */
  const aqiInfo = getAQIInfo(pollution.aqi);
  const weatherIconUrl = weather.condition.icon
    ? `https://openweathermap.org/img/wn/${weather.condition.icon}@2x.png`
    : null;

  const feelsLikeDelta = weather.main.feels_like - weather.main.temp;
  const formattedDate = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="mv-dashboard">
      {/* ── Center Map Background ──────────────────────── */}
      <div className="mv-map-main">
        <div ref={mapContainer} className="mv-map-container" />
      </div>

      {/* ── Top Navbar ───────────────────────────────────── */}
      <nav className="mv-navbar">
        <div className="mv-nav-brand">
          <span className="mv-brand-text">UrbanEye</span>
        </div>

        <div className="mv-nav-links">
          <a href="/dashboard" className="mv-nav-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" />
            </svg>
            Dashboard
          </a>
          <a href="/map" className="mv-nav-link mv-nav-active">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3l5-2v12l-5 2V3zm6-2l4 2v12l-4-2V1zm5 2l4-2v12l-4 2V3z" />
            </svg>
            Map
          </a>
          <a href="/assistant" className="mv-nav-link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 14V6l3-4h6l3 4v8H2zm2-1h8V7L9.5 3.5h-3L4 7v6z" />
            </svg>
            Talk to Assistant
          </a>
        </div>

        <div className="mv-nav-right">
          <span
            className={`mv-status-chip ${connected ? "mv-online" : "mv-offline"}`}
          >
            <span
              className={`mv-status-dot ${connected ? "mv-dot-on" : "mv-dot-off"}`}
            />
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </nav>

      {/* ── Status Bar ───────────────────────────────────── */}
      <div className="mv-status-bar">
        <div className="mv-status-left">
          <h1 className="mv-status-title">SMART CITY OVERVIEW</h1>
          <span className="mv-status-sep">|</span>
          <span className="mv-status-info">Vijayawada, AP</span>
          <span className="mv-status-sep">|</span>
          <span className="mv-status-info">
            {formattedDate}, {formattedTime}
          </span>
          <span className="mv-status-sep">|</span>
          <span className="mv-status-info">
            Status: <strong className="mv-status-active">ACTIVE</strong>
          </span>
        </div>
      </div>

      {/* ── Main Body ────────────────────────────────────── */}
      <div className="mv-body">
        {/* Left Toggle Button */}
        <button
          className={`mv-panel-toggle mv-toggle-left ${isLeftOpen ? "mv-open" : "mv-closed"}`}
          onClick={() => setIsLeftOpen(!isLeftOpen)}
          title={isLeftOpen ? "Collapse Panel" : "Expand Panel"}
        >
          {isLeftOpen ? "✕" : "❯"}
        </button>

        {/* ── Left Sidebar ───────────────────────────────── */}
        <aside
          className={`mv-left-panel ${isLeftOpen ? "mv-open" : "mv-closed"}`}
        >
          <h3 className="mv-section-title">CITY METRICS</h3>

          <MetricCard
            icon="🌡️"
            label="TEMPERATURE"
            value={weather.main.temp.toFixed(1)}
            unit="°C"
            trend={feelsLikeDelta}
            trendLabel="°C"
            barPct={normalizeRange(
              weather.main.temp,
              WEATHER_SCALES.temp.min,
              WEATHER_SCALES.temp.max,
            )}
            barColor="linear-gradient(90deg,#f97316,#ef4444)"
          />

          <MetricCard
            icon="💨"
            label="AIR QUALITY"
            value={pollution.aqi}
            unit=" AQI"
            trendLabel={aqiInfo.label}
            barPct={normalizeMax(pollution.aqi, 300)}
            barColor={`linear-gradient(90deg,${aqiInfo.color},${aqiInfo.color})`}
          />

          <MetricCard
            icon="💧"
            label="HUMIDITY"
            value={weather.main.humidity.toFixed(0)}
            unit="%"
            barPct={normalizeMax(
              weather.main.humidity,
              WEATHER_SCALES.humidity.max,
            )}
            barColor="linear-gradient(90deg,#38bdf8,#0ea5e9)"
          />

          <MetricCard
            icon="🌀"
            label="WIND SPEED"
            value={weather.wind.speed.toFixed(1)}
            unit=" m/s"
            barPct={normalizeMax(weather.wind.speed, WEATHER_SCALES.wind.max)}
            barColor="linear-gradient(90deg,#34d399,#10b981)"
          />

          <MetricCard
            icon="☁️"
            label="CLOUD COVER"
            value={weather.clouds.toFixed(0)}
            unit="%"
            barPct={normalizeMax(weather.clouds, WEATHER_SCALES.clouds.max)}
            barColor="linear-gradient(90deg,#94a3b8,#64748b)"
          />

          {/* ── Layer Toggles ────────────────────────────── */}
          <div className="mv-toggle-section">
            <h3 className="mv-section-title">MAP LAYERS</h3>
            <ToggleBtn
              icon="🌤️"
              label="Weather"
              active={weatherOn}
              onToggle={toggleWeather}
            />
            <ToggleBtn
              icon="💨"
              label="Pollution"
              active={pollutionOn}
              onToggle={togglePollution}
            />
            <ToggleBtn
              icon="📍"
              label="Events"
              active={eventsOn}
              onToggle={toggleEvents}
            />
            <ToggleBtn
              icon="🚗"
              label="Traffic"
              active={trafficOn}
              onToggle={toggleTraffic}
            />
          </div>
        </aside>

        {/* Right Toggle Button */}
        <button
          className={`mv-panel-toggle mv-toggle-right ${isRightOpen ? "mv-open" : "mv-closed"}`}
          onClick={() => setIsRightOpen(!isRightOpen)}
          title={isRightOpen ? "Collapse Panel" : "Expand Panel"}
        >
          {isRightOpen ? "✕" : "❮"}
        </button>

        {/* ── Right Sidebar ──────────────────────────────── */}
        <aside
          className={`mv-right-panel ${isRightOpen ? "mv-open" : "mv-closed"}`}
        >
          <h3 className="mv-section-title">REAL-TIME ANALYTICS</h3>

          {/* Pollution Levels Chart */}
          <div className="mv-analytics-card">
            <div className="mv-card-header">
              <p className="mv-card-title">POLLUTION LEVELS</p>
              <span className="mv-card-subtitle">µg/m³ · ppb</span>
            </div>
            <PollutionChart pollution={pollution} />
          </div>

          {/* Weather Conditions */}
          <div className="mv-analytics-card">
            <div className="mv-card-header">
              <p className="mv-card-title">WEATHER CONDITIONS</p>
              {weatherIconUrl && (
                <img
                  className="mv-weather-icon"
                  src={weatherIconUrl}
                  alt={weather.condition.main}
                />
              )}
            </div>
            <p className="mv-weather-desc">
              {weather.condition.main} · {weather.condition.description}
            </p>
            <div className="mv-weather-grid">
              <div className="mv-wg-cell">
                <span className="mv-wg-val mv-temp-accent">
                  {weather.main.temp.toFixed(1)}°C
                </span>
                <span className="mv-wg-lbl">TEMP</span>
              </div>
              <div className="mv-wg-cell">
                <span className="mv-wg-val">
                  {weather.main.humidity.toFixed(0)}%
                </span>
                <span className="mv-wg-lbl">HUMIDITY</span>
              </div>
              <div className="mv-wg-cell">
                <span className="mv-wg-val">
                  {weather.wind.speed.toFixed(1)} <small>m/s</small>
                </span>
                <span className="mv-wg-lbl">WIND</span>
              </div>
              <div className="mv-wg-cell">
                <span className="mv-wg-val">
                  {weather.main.pressure.toFixed(0)} <small>hPa</small>
                </span>
                <span className="mv-wg-lbl">PRESSURE</span>
              </div>
            </div>
          </div>

          {/* Event / Alert Log */}
          <div className="mv-analytics-card mv-alert-card">
            <div className="mv-card-header">
              <p className="mv-card-title">EVENT LOG</p>
              <span className="mv-alert-count">{events.length} events</span>
            </div>
            <div className="mv-alert-list">
              {events.length === 0 && (
                <p className="mv-no-events">No active events</p>
              )}
              {events.slice(0, 6).map((evt, i) => (
                <div key={evt._id || i} className="mv-alert-item">
                  <div className="mv-alert-dot-wrap">
                    <span
                      className={`mv-alert-dot ${evt.status === "active" ? "mv-dot-alert" : "mv-dot-info"}`}
                    />
                  </div>
                  <div className="mv-alert-body">
                    <p className="mv-alert-name">{evt.name}</p>
                    <p className="mv-alert-time">
                      {evt.start_at
                        ? new Date(evt.start_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <span
                    className={`mv-alert-status ${evt.status === "active" ? "mv-status-warn" : "mv-status-ok"}`}
                  >
                    {evt.status || "info"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MapView;
