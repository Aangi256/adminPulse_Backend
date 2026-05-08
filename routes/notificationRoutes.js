const express = require("express");
const router = express.Router();

// ✅ IMPORT CORRECTLY
const { protect } = require("../middleware/authMiddleware");
const { getNotifications, markAsRead, markNotificationRead } = require("../controllers/notificationController");

// ✅ ROUTES
router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAsRead);

// 🔥 IMPORTANT FIX HERE
router.put("/:id", markNotificationRead);

module.exports = router;