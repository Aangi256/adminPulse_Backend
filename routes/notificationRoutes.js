const express = require("express");
const router = express.Router();

// ✅ IMPORT CORRECTLY
const {
  getNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");

// ✅ ROUTES
router.get("/", getNotifications);

// 🔥 IMPORTANT FIX HERE
router.put("/:id", markNotificationRead);

module.exports = router;