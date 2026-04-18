// app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");

const eventRoutes = require("./routes/eventRoutes");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// 🔥 initialize socket
const io = initSocket(server);

app.use(express.json());

// routes
app.use("/api/events", eventRoutes);

// DB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// ✅ IMPORTANT: use server.listen (not app.listen)
server.listen(5000, () => {
  console.log("Server + Socket running on port 5000 🚀");
});