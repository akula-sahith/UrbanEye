// socket.js
const { Server } = require("socket.io");
const { fetchPollutionGrid } = require("./utils/pollution");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    // send updates every 10 sec
    const interval = setInterval(async () => {
      const data = await fetchPollutionGrid(16.5062, 80.6480);
      socket.emit("pollution:update", data);
    }, 10000);

    socket.on("disconnect", () => {
      clearInterval(interval);
    });
  });

  return io;
}

module.exports = initSocket;