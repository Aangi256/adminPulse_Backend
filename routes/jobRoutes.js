const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
} = require("../controllers/jobController");

router.post("/create", upload.single("file"), createJob);
router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.put("/:id", upload.single("file"), updateJob);

module.exports = router;