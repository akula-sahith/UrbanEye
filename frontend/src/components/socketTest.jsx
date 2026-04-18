// SocketTest.jsx
import { useEffect } from "react";
import { io } from "socket.io-client";

export default function SocketTest() {
  useEffect(() => {
    const socket = io("http://localhost:5000");

    // ✅ connection check
    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    // ❌ error check
    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    // 🔥 listen to pollution updates
    socket.on("pollution:update", (data) => {
      console.log("🌍 Pollution Data Received:", data);
    });

    // 🔥 listen to event broadcast
    socket.on("event:new", (event) => {
      console.log("📍 New Event Received:", event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Check console for socket data 🔥</div>;
}