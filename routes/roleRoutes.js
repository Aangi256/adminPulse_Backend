const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", protect,roleMiddleware("admin"), roleController.getRoles);
router.post("/", protect,roleMiddleware("admin"),roleController.createRole);
router.put("/:id",protect,roleMiddleware("admin"), roleController.updateRole);
router.delete("/:id",protect,roleMiddleware("admin"), roleController.deleteRole);

module.exports = router;
