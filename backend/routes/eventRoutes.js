// routes/eventRoutes.js
const express = require("express");
const { registerEvent } = require("../controllers/eventController");

const router = express.Router();

router.post("/register", registerEvent);

module.exports = router;