import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function SocketDebugger() {
  const [events, setEvents] = useState([]);
  const [pollution, setPollution] = useState([]);
  const [weather, setWeather] = useState([]);

  useEffect(() => {
    const socket = io("http://13.53.182.223");

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection Error:", err.message);
    });

    // 📍 EVENTS
    socket.on("event:all", (data) => {
      console.log("📍 All Events:", data);
      setEvents(data);
    });

    socket.on("event:new", (event) => {
      console.log("📍 New Event:", event);
      setEvents((prev) => [event, ...prev]);
    });

    socket.on("event:sync", (data) => {
      console.log("📍 Synced Events:", data);
      setEvents(data);
    });

    // 🌫️ POLLUTION
    socket.on("pollution:update", (data) => {
      console.log("🌫️ Pollution:", data);
      setPollution(data);
    });

    // 🌤️ WEATHER
    socket.on("weather:update", (data) => {
      console.log("🌤️ Weather:", data);
      setWeather(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: "10px", fontFamily: "monospace" }}>
      <h2>📡 Socket Debugger</h2>

      {/* 📍 EVENTS */}
      <section>
        <h3>📍 Events ({events.length})</h3>
        {events.map((e, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <strong>{e.name}</strong>
            <div>{e.location_name}</div>
          </div>
        ))}
      </section>

      {/* 🌫️ POLLUTION */}
      <section>
        <h3>🌫️ Pollution ({pollution.length})</h3>
        {pollution.map((p, i) => (
          <div key={i}>
            AQI: {p.aqi} | PM2.5: {p.components?.pm2_5}
          </div>
        ))}
      </section>

      {/* 🌤️ WEATHER */}
      <section>
        <h3>🌤️ Weather ({weather.length})</h3>
        {weather.map((w, i) => (
          <div key={i}>
            {w.condition?.main} | Temp: {w.main?.temp}°C | Humidity: {w.main?.humidity}%
          </div>
        ))}
      </section>
    </div>
  );
}