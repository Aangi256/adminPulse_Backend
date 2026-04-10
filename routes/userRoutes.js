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
  searchUsers,
  updateMyProfile,
  changeMyPassword
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* ================= FILE UPLOAD SETUP ================= */

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

/* ================= USER SELF ROUTES (VERY IMPORTANT FIRST) ================= */

// ✅ Update own profile
router.put("/me/update", protect, upload.single("image"), updateMyProfile);

// ✅ Change own password
router.put("/me/change-password", protect, changeMyPassword);


/* ================= OTHER USER ROUTES ================= */

// ✅ Search users
router.get("/search", protect, searchUsers);

// ✅ Get single user by ID
router.get("/:id", protect, getUser);


/* ================= ADMIN ROUTES ================= */

// ✅ Get all users
router.get("/", protect, roleMiddleware("admin"), getUsers);

// ✅ Create user
router.post("/", protect, roleMiddleware("admin"), upload.single("image"), createUser);

// ✅ Update user by ID (admin)
router.put("/:id", protect, roleMiddleware("admin"), upload.single("image"), updateUser);

// ✅ Delete user
router.delete("/:id", protect, roleMiddleware("admin"), deleteUser);

// ✅ Admin change password
router.put("/update-password/:id", protect, roleMiddleware("admin"), updateUserPassword);

module.exports = router;