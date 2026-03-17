const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });
router.get("/", protect, userController.getUsers);
router.get("/:id", protect, userController.getUser);
router.post("/", protect, upload.single("image"), userController.createUser);
router.put("/:id", protect, upload.single("image"), userController.updateUser);
router.delete("/:id", protect, userController.deleteUser);
router.put("/update-password/:id", protect, userController.updateUserPassword);
module.exports = router;