// socket.js
const { Server } = require("socket.io");
const { fetchPollutionGrid } = require("./utils/pollution");
const { fetchWeatherGrid } = require("./utils/weather");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    // 🔥 send immediately on connect (good UX)
    sendAllData(socket);

    // 🔁 periodic updates
    const interval = setInterval(() => {
      sendAllData(socket);
    }, 10000);

    socket.on("disconnect", () => {
      clearInterval(interval);
    });
  });

  async function sendAllData(socket) {
    try {
      const [pollution, weather] = await Promise.all([
        fetchPollutionGrid(16.5062, 80.6480),
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