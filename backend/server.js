// app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const eventRoutes = require("./routes/eventRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// 🔥 initialize socket
const io = initSocket(server);
app.use(cors({
  origin: "*", // ⚠️ for development only
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());

// routes
app.use("/api/events", eventRoutes);
app.use("/api/gemini", geminiRoutes);

// DB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// ✅ IMPORTANT: use server.listen (not app.listen)
server.listen(5000, () => {
  console.log("Server + Socket running on port 5000 🚀");
});