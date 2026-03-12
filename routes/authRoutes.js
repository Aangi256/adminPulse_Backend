const express = require("express");
const router = express.Router();

const {
  loginUser,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;