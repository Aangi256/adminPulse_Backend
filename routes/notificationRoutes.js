const express = require("express");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  markAllRead,
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.post("/", createNotification);
router.put("/read-all", markAllRead);

module.exports = router;