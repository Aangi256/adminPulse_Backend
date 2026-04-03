const express = require("express");
const router = express.Router();

const {
  createJob,
  updateStatus,
  getJobs,
} = require("../controllers/jobController");

router.post("/", createJob);
router.get("/", getJobs);
router.put("/:id/status", updateStatus);

module.exports = router;