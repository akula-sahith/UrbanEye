// socket.js
const { Server } = require("socket.io");
const { fetchPollutionGrid } = require("./utils/pollution");
const { fetchWeatherGrid } = require("./utils/weather");
const Event = require("./models/Event");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", async (socket) => {
    console.log("Client connected");

    // 🔥 1. Send all existing events
    try {
      const events = await Event.find();
      socket.emit("event:all", events);
    } catch (err) {
      console.error("Error fetching events:", err);
    }

    // 🔥 2. Send initial pollution + weather
    sendAllData(socket);

    // 🔁 3. Periodic updates
    const interval = setInterval(async () => {
      await sendAllData(socket);

      // 🔁 also sync events (optional)
      try {
        const events = await Event.find();
        socket.emit("event:sync", events);
      } catch (err) {
        console.error("Event sync error:", err);
      }

    }, 10000);

    socket.on("disconnect", () => {
      clearInterval(interval);
    });
  });

  async function sendAllData(socket) {
    try {
      const [pollution, weather] = await Promise.all([
        fetchPollutionGrid(),
        fetchWeatherGrid(16.5062, 80.6480)
      ]);

      socket.emit("pollution:update", pollution);
      socket.emit("weather:update", weather);

    } catch (err) {
      console.error("Socket data error:", err);
    }
  }

  return io;
}

module.exports = initSocket;