const express = require("express");
const router = express.Router();

const { accessChat, getChats } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, accessChat);
router.get("/", protect, getChats);

module.exports = router;