const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  assignJob,          // ✅ NEW
  getNonAdminUsers,   // ✅ NEW
  updateEmployeeStatus,
  updateComment,      // ✅ NEW: comment endpoint
  getJobStats,        // ✅ NEW: stats endpoint
  getJobReports,      // ✅ NEW: reports endpoint
} = require("../controllers/jobController");

// ─────────────────────────────────────────────────────────────────
// IMPORTANT: Static routes MUST come BEFORE dynamic /:id routes.
// Otherwise Express treats "assign" as a value for :id.
// ─────────────────────────────────────────────────────────────────

// ✅ Static routes first
router.post("/create", protect, upload.single("file"), createJob);
router.get("/", protect, getAllJobs);

// ✅ NEW: non-admin users — MUST be before GET /:id
router.get("/assign/users", protect, getNonAdminUsers);
router.get("/stats", protect, getJobStats); // ✅ NEW: stats route
router.get("/reports", protect, getJobReports); // ✅ NEW: reports route

// ✅ Dynamic :id routes after
router.get("/:id", protect, getJobById);
router.put("/:id", protect, upload.single("file"), updateJob);
router.delete("/:id", protect, deleteJob);

// ✅ NEW: assign a job to a user
router.post("/:id/assign", protect, assignJob);

// ✅ NEW: update employee status
router.put("/:id/employee-status", protect, updateEmployeeStatus);

// ✅ NEW: update comment
router.put("/:id/comment", protect, updateComment);

module.exports = router;