// components/SocketDebugger.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function SocketDebugger() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const socket = io("https://urbaneye-jepe.onrender.com");

    // ✅ connection
    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
      addLog("connect", { id: socket.id });
    });

    // ❌ error
    socket.on("connect_error", (err) => {
      console.error("❌ Connection Error:", err.message);
      addLog("error", err.message);
    });

    // 🔥 catch ALL events
    socket.onAny((event, ...args) => {
      console.log("📡 Event:", event, args);
      addLog(event, args);
    });

    function addLog(event, data) {
      setLogs((prev) => [
        { event, data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 20) // keep last 20 logs
      ]);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: "10px", fontFamily: "monospace" }}>
      <h3>📡 Socket Debugger</h3>

      {logs.map((log, index) => (
        <div key={index} style={{ marginBottom: "10px" }}>
          <strong>{log.time} - {log.event}</strong>
          <pre style={{ background: "#111", color: "#0f0", padding: "5px" }}>
            {JSON.stringify(log.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}