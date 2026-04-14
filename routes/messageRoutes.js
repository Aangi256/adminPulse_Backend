const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  sendMessage,
  getMessages,
  markAsRead,
} = require("../controllers/messageController");

// All message routes are protected
router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/read/:chatId", protect, markAsRead); // ✅ New: mark messages as read

module.exports = router;
