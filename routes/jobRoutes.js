const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  assignJob,          // ✅ NEW
  getNonAdminUsers,   // ✅ NEW
  updateEmployeeStatus,
} = require("../controllers/jobController");

// ─────────────────────────────────────────────────────────────────
// IMPORTANT: Static routes MUST come BEFORE dynamic /:id routes.
// Otherwise Express treats "assign" as a value for :id.
// ─────────────────────────────────────────────────────────────────

// ✅ Static routes first
router.post("/create", upload.single("file"), createJob);
router.get("/", getAllJobs);

// ✅ NEW: non-admin users — MUST be before GET /:id
router.get("/assign/users", getNonAdminUsers);

// ✅ Dynamic :id routes after
router.get("/:id", getJobById);
router.put("/:id", upload.single("file"), updateJob);
router.delete("/:id", deleteJob);

// ✅ NEW: assign a job to a user
router.post("/:id/assign", assignJob);

// ✅ NEW: update employee status
router.put("/:id/employee-status", updateEmployeeStatus);

module.exports = router;