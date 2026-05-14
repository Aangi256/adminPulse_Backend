const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/staticDataController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Public read (used in job forms by all roles)
router.get("/", protect, ctrl.getAll);
router.get("/:id", protect, ctrl.getById);

// Admin-only write operations
router.post("/", protect, roleMiddleware("admin"), ctrl.create);
router.put("/:id", protect, roleMiddleware("admin"), ctrl.update);
router.delete("/:id", protect, roleMiddleware("admin"), ctrl.remove);

module.exports = router;
