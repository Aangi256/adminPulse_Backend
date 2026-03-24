const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
  searchUsers
} = require("../controllers/userController");

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

router.get("/", protect, getUsers);

router.get("/search", protect, searchUsers);

router.get("/:id", protect, getUser);
router.post("/", protect, upload.single("image"), createUser);
router.put("/:id", protect, upload.single("image"), updateUser);
router.delete("/:id", protect, deleteUser);
router.put("/update-password/:id", protect, updateUserPassword);

module.exports = router;