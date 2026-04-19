import { useEffect, useMemo, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import './WeatherLayer.css';

/* ─── Constants ─────────────────────────────────────── */

const DEFAULT_WEATHER = {
  lat: 0, lon: 0,
  condition: { id: 0, main: 'Unknown', description: 'Unknown', icon: '' },
  main: { temp: 0, feels_like: 0, temp_min: 0, temp_max: 0, pressure: 0, humidity: 0 },
  wind: { speed: 0, deg: 0 },
  clouds: 0
};

const DEFAULT_POLLUTION = {
  co: 0, nh3: 0, no: 0, no2: 0,
  o3: 0, pm2_5: 0, pm10: 0, so2: 0, aqi: 0
};

const WEATHER_SCALES = {
  temp:      { min: 15, max: 50 },
  feels_like:{ min: 15, max: 50 },
  temp_min:  { min: 10, max: 45 },
  temp_max:  { min: 15, max: 50 },
  humidity:  { min: 0,  max: 100 },
  pressure:  { min: 980, max: 1030 },
  wind:      { min: 0,  max: 25 },
  clouds:    { min: 0,  max: 100 }
};

const POLLUTION_SCALES = {
  co: 100, nh3: 20, no: 20, no2: 20,
  o3: 120, pm2_5: 80, pm10: 120, so2: 50
};

/* ─── Helpers ────────────────────────────────────────── */

function normalizeRange(value, min, max) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function normalizeMax(value, max) {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

function getAQIInfo(aqi) {
  if (aqi <= 50)  return { color: '#22c55e', bg: '#dcfce7', label: 'Good' };
  if (aqi <= 100) return { color: '#eab308', bg: '#fef9c3', label: 'Moderate' };
  if (aqi <= 150) return { color: '#f97316', bg: '#ffedd5', label: 'Sensitive' };
  if (aqi <= 200) return { color: '#ef4444', bg: '#fee2e2', label: 'Unhealthy' };
  if (aqi <= 300) return { color: '#8b5cf6', bg: '#ede9fe', label: 'Very Unhealthy' };
  return           { color: '#be123c',  bg: '#ffe4e6', label: 'Hazardous' };
}

function pollutionBarColor(pct) {
  if (pct < 30) return 'linear-gradient(90deg,#22c55e,#16a34a)';
  if (pct < 60) return 'linear-gradient(90deg,#eab308,#ca8a04)';
  if (pct < 80) return 'linear-gradient(90deg,#f97316,#ea580c)';
  return 'linear-gradient(90deg,#ef4444,#b91c1c)';
}

function calculateAverageWeatherData(data) {
  if (!data) return DEFAULT_WEATHER;
  if (Array.isArray(data) && data.length > 0) {
    let sumTemp = 0, sumFeelsLike = 0, sumTempMin = 0, sumTempMax = 0,
        sumPressure = 0, sumHumidity = 0, sumWindSpeed = 0, sumClouds = 0;
    let conditionIcon = '', conditionMain = 'Unknown', conditionDescription = 'Unknown';
    let latSum = 0, lonSum = 0;

    data.forEach((point) => {
      sumTemp       += point.main?.temp       ?? 0;
      sumFeelsLike  += point.main?.feels_like ?? 0;
      sumTempMin    += point.main?.temp_min   ?? 0;
      sumTempMax    += point.main?.temp_max   ?? 0;
      sumPressure   += point.main?.pressure   ?? 0;
      sumHumidity   += point.main?.humidity   ?? 0;
      sumWindSpeed  += point.wind?.speed      ?? 0;
      sumClouds     += point.clouds           ?? 0;
      latSum        += point.lat              ?? 0;
      lonSum        += point.lon              ?? 0;
      if (!conditionIcon && point.condition?.icon) {
        conditionIcon        = point.condition.icon;
        conditionMain        = point.condition.main        || 'Unknown';
        conditionDescription = point.condition.description || 'Unknown';
      }
    });

    const count = data.length;
    return {
      lat: latSum / count, lon: lonSum / count,
      condition: { id: 0, main: conditionMain, description: conditionDescription, icon: conditionIcon },
      main: {
        temp:       sumTemp      / count,
        feels_like: sumFeelsLike / count,
        temp_min:   sumTempMin   / count,
        temp_max:   sumTempMax   / count,
        pressure:   sumPressure  / count,
        humidity:   sumHumidity  / count
      },
      wind:   { speed: sumWindSpeed / count, deg: 0 },
      clouds: sumClouds / count
    };
  }
  return {
    lat: data.lat ?? 0, lon: data.lon ?? 0,
    condition: { ...data.condition },
    main:      { ...data.main },
    wind:      { ...data.wind },
    clouds:    data.clouds ?? 0
  };
}

function buildPollutionValues(data) {
  if (!data) return DEFAULT_POLLUTION;
  if (Array.isArray(data) && data.length > 0) {
    let sumCo = 0, sumNh3 = 0, sumNo = 0, sumNo2 = 0;
    let sumO3 = 0, sumPm25 = 0, sumPm10 = 0, sumSo2 = 0, sumAqi = 0;

    data.forEach((point) => {
      const c = point.components || point;
      sumCo   += c.co    || 0;
      sumNh3  += c.nh3   || 0;
      sumNo   += c.no    || 0;
      sumNo2  += c.no2   || 0;
      sumO3   += c.o3    || 0;
      sumPm25 += c.pm2_5 || 0;
      sumPm10 += c.pm10  || 0;
      sumSo2  += c.so2   || 0;
      sumAqi  += point.aqi || 0;
    });

    const count = data.length;
    return {
      co: sumCo / count, nh3: sumNh3 / count, no: sumNo / count, no2: sumNo2 / count,
      o3: sumO3 / count, pm2_5: sumPm25 / count, pm10: sumPm10 / count, so2: sumSo2 / count,
      aqi: Math.round(sumAqi / count)
    };
  }
  return { ...DEFAULT_POLLUTION, ...data };
}

/* ─── Sub-components ─────────────────────────────────── */

function MetricBar({ label, value, unit, pct, barStyle }) {
  return (
    <div className="metric-row">
      <div className="metric-label">
        <span>{label}</span>
        <strong>{typeof value === 'number' ? value.toFixed(1) : value} {unit}</strong>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: barStyle }} />
      </div>
    </div>
  );
}

function QuickStat({ icon, value, sub, accent }) {
  return (
    <div className="quick-stat" style={{ borderColor: accent }}>
      <span className="qs-icon">{icon}</span>
      <p className="qs-value" style={{ color: accent }}>{value}</p>
      <p className="qs-sub">{sub}</p>
    </div>
  );
}

function ToggleBtn({ icon, label, active, onToggle }) {
  return (
    <button
      className={`toggle-btn ${active ? 'toggle-on' : 'toggle-off'}`}
      onClick={onToggle}
    >
      <span className="toggle-icon">{icon}</span>
      <span className="toggle-label">{label}</span>
      <span className={`toggle-pill ${active ? 'pill-on' : 'pill-off'}`}>
        {active ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────── */

function WeatherLayer() {
  const [weather,    setWeather]    = useState(DEFAULT_WEATHER);
  const [pollution,  setPollution]  = useState(DEFAULT_POLLUTION);
  const [connected,  setConnected]  = useState(false);
  const [eventCount, setEventCount] = useState(0);

  // Layer visibility
  const [weatherOn,   setWeatherOn]   = useState(true);
  const [pollutionOn, setPollutionOn] = useState(true);
  const [eventsOn,    setEventsOn]    = useState(true);

  const dispatch = (layer, visible) =>
    window.dispatchEvent(new CustomEvent('citymap:toggle', { detail: { layer, visible } }));

  const toggleWeather   = useCallback(() => { const v = !weatherOn;   setWeatherOn(v);   dispatch('weather',   v); }, [weatherOn]);
  const togglePollution = useCallback(() => { const v = !pollutionOn; setPollutionOn(v); dispatch('pollution', v); }, [pollutionOn]);
  const toggleEvents    = useCallback(() => { const v = !eventsOn;    setEventsOn(v);    dispatch('events',    v); }, [eventsOn]);

  useEffect(() => {
    // Weather + Pollution socket
    const sock = io('https://urbaneye-jepe.onrender.com');
    sock.on('connect',    () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    sock.on('weather:update',   (data) => setWeather(calculateAverageWeatherData(data)));
    sock.on('pollution:update', (data) => setPollution(buildPollutionValues(data)));

    // Events socket — count only
    const evtSock = io('https://urbaneye-jepe.onrender.com');
    evtSock.on('event:all',  (evts) => setEventCount(evts.length));
    evtSock.on('event:sync', (evts) => setEventCount(evts.length));

    return () => { sock.disconnect(); evtSock.disconnect(); };
  }, []);

  /* Derived */
  const aqiInfo = getAQIInfo(pollution.aqi);
  const weatherIconUrl = weather.condition.icon
    ? `https://openweathermap.org/img/wn/${weather.condition.icon}@2x.png`
    : null;

  const weatherItems = useMemo(() => [
    { label: 'Temperature', value: weather.main.temp,       unit: '°C',  pct: normalizeRange(weather.main.temp,       WEATHER_SCALES.temp.min,     WEATHER_SCALES.temp.max),      bar: 'linear-gradient(90deg,#f97316,#ef4444)' },
    { label: 'Feels Like',  value: weather.main.feels_like, unit: '°C',  pct: normalizeRange(weather.main.feels_like, WEATHER_SCALES.feels_like.min,WEATHER_SCALES.feels_like.max),bar: 'linear-gradient(90deg,#fb923c,#f97316)' },
    { label: 'Humidity',    value: weather.main.humidity,   unit: '%',   pct: normalizeMax(weather.main.humidity,   WEATHER_SCALES.humidity.max),                                   bar: 'linear-gradient(90deg,#38bdf8,#0ea5e9)' },
    { label: 'Pressure',    value: weather.main.pressure,   unit: 'hPa', pct: normalizeRange(weather.main.pressure,   WEATHER_SCALES.pressure.min,  WEATHER_SCALES.pressure.max),  bar: 'linear-gradient(90deg,#818cf8,#6366f1)' },
    { label: 'Wind Speed',  value: weather.wind.speed,      unit: 'm/s', pct: normalizeMax(weather.wind.speed,      WEATHER_SCALES.wind.max),                                      bar: 'linear-gradient(90deg,#34d399,#10b981)' },
    { label: 'Cloud Cover', value: weather.clouds,          unit: '%',   pct: normalizeMax(weather.clouds,          WEATHER_SCALES.clouds.max),                                    bar: 'linear-gradient(90deg,#94a3b8,#64748b)' },
    { label: 'Low Temp',    value: weather.main.temp_min,   unit: '°C',  pct: normalizeRange(weather.main.temp_min,   WEATHER_SCALES.temp_min.min,  WEATHER_SCALES.temp_min.max),  bar: 'linear-gradient(90deg,#60a5fa,#3b82f6)' },
    { label: 'High Temp',   value: weather.main.temp_max,   unit: '°C',  pct: normalizeRange(weather.main.temp_max,   WEATHER_SCALES.temp_max.min,  WEATHER_SCALES.temp_max.max),  bar: 'linear-gradient(90deg,#f87171,#dc2626)' },
  ], [weather]);

  const pollutionItems = useMemo(() => [
    { label: 'PM2.5', value: pollution.pm2_5, unit: 'µg/m³', pct: normalizeMax(pollution.pm2_5, POLLUTION_SCALES.pm2_5) },
    { label: 'PM10',  value: pollution.pm10,  unit: 'µg/m³', pct: normalizeMax(pollution.pm10,  POLLUTION_SCALES.pm10)  },
    { label: 'CO',    value: pollution.co,    unit: 'ppm',   pct: normalizeMax(pollution.co,    POLLUTION_SCALES.co)    },
    { label: 'NO₂',   value: pollution.no2,   unit: 'ppb',   pct: normalizeMax(pollution.no2,   POLLUTION_SCALES.no2)   },
    { label: 'O₃',    value: pollution.o3,    unit: 'ppb',   pct: normalizeMax(pollution.o3,    POLLUTION_SCALES.o3)    },
    { label: 'SO₂',   value: pollution.so2,   unit: 'ppb',   pct: normalizeMax(pollution.so2,   POLLUTION_SCALES.so2)   },
    { label: 'NH₃',   value: pollution.nh3,   unit: 'ppm',   pct: normalizeMax(pollution.nh3,   POLLUTION_SCALES.nh3)   },
    { label: 'NO',    value: pollution.no,    unit: 'ppm',   pct: normalizeMax(pollution.no,    POLLUTION_SCALES.no)    },
  ], [pollution]);

  return (
    <aside className="dashboard-panel">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="panel-header">
        <div>
          <p className="panel-subtitle">SMART CITY OVERVIEW</p>
          <h2 className="panel-title">Vijayawada, AP</h2>
        </div>
        <span className={`status-chip ${connected ? 'online' : 'offline'}`}>
          <span className={`status-dot ${connected ? 'dot-on' : 'dot-off'}`} />
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </header>

      {/* ── Quick Stats ─────────────────────────────────── */}
      <div className="quick-stats-row">
        <QuickStat icon="🌡️" value={`${weather.main.temp.toFixed(1)}°`} sub="Avg Temp"    accent="#f97316" />
        <QuickStat icon="💨" value={`${pollution.aqi}`}                  sub={aqiInfo.label} accent={aqiInfo.color} />
        <QuickStat icon="📍" value={eventCount}                          sub="Events"     accent="#6366f1" />
      </div>

      {/* ── Weather Card ─────────────────────────────────── */}
      <section className="dashboard-card weather-card">
        <div className="card-top">
          <div>
            <p className="card-title">🌤 Weather Conditions</p>
            <p className="card-note">{weather.condition.main} · {weather.condition.description}</p>
          </div>
          {weatherIconUrl
            ? <img className="weather-icon" src={weatherIconUrl} alt={weather.condition.main} />
            : <div className="weather-icon placeholder">?</div>}
        </div>

        <div className="weather-summary">
          <div className="summary-cell">
            <p className="summary-value temp-val">{weather.main.temp.toFixed(1)}°C</p>
            <p className="summary-label">TEMP</p>
          </div>
          <div className="summary-cell">
            <p className="summary-value">{weather.main.humidity}%</p>
            <p className="summary-label">HUMIDITY</p>
          </div>
          <div className="summary-cell">
            <p className="summary-value">{weather.wind.speed.toFixed(1)}<span className="unit-sm">m/s</span></p>
            <p className="summary-label">WIND</p>
          </div>
        </div>

        <div className="section-label">AVG METRICS</div>
        <div className="metric-grid">
          {weatherItems.map((item) => (
            <MetricBar
              key={item.label}
              label={item.label}
              value={item.value}
              unit={item.unit}
              pct={item.pct}
              barStyle={item.bar}
            />
          ))}
        </div>
      </section>

      {/* ── Pollution Card ───────────────────────────────── */}
      <section className="dashboard-card pollution-card">
        <div className="card-top">
          <div>
            <p className="card-title">💨 Air Quality</p>
            <p className="card-note">Live component averages</p>
          </div>
          <div className="aqi-badge" style={{ background: aqiInfo.bg, color: aqiInfo.color, borderColor: aqiInfo.color }}>
            <span className="aqi-num">{pollution.aqi}</span>
            <span className="aqi-lbl">AQI</span>
            <span className="aqi-status">{aqiInfo.label}</span>
          </div>
        </div>

        <div className="section-label">POLLUTANT LEVELS</div>
        <div className="metric-grid">
          {pollutionItems.map((item) => (
            <MetricBar
              key={item.label}
              label={item.label}
              value={item.value}
              unit={item.unit}
              pct={item.pct}
              barStyle={pollutionBarColor(item.pct)}
            />
          ))}
        </div>
      </section>

      {/* ── Layer Toggles ────────────────────────────────── */}
      <section className="dashboard-card toggle-card">
        <p className="card-title">🗺 Map Layers</p>
        <p className="card-note">Toggle visibility on the map</p>
        <div className="toggle-list">
          <ToggleBtn icon="🌤️" label="Weather"   active={weatherOn}   onToggle={toggleWeather}   />
          <ToggleBtn icon="💨" label="Pollution"  active={pollutionOn} onToggle={togglePollution} />
          <ToggleBtn icon="📍" label="Events"     active={eventsOn}    onToggle={toggleEvents}    />
        </div>
      </section>

    </aside>
  );
}

export default WeatherLayer;