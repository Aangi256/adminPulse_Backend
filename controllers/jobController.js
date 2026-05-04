const Job = require("../models/Job");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const {
  createJobService,
  getAllJobsService,
  getJobByIdService,
  updateJobService,
  deleteJobService,
} = require("../services/jobService");

console.log("✅ jobController.js loaded");

exports.createJob = async (req, res) => {
  try {
    console.log("📥 req.body:", req.body);
    console.log("📥 req.file:", req.file);

    let data;
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      return res
        .status(400)
        .json({ message: "Invalid JSON — could not parse req.body.data" });
    }

    console.log("📦 Parsed data:", JSON.stringify(data, null, 2));

    const { jobDetail, contactDetails, colorDetails } = data;

    const errors = {};

    if (!jobDetail?.customerName?.trim())
      errors.customerName = "Customer Name is required";
    if (!jobDetail?.jobName?.trim()) errors.jobName = "Job Name is required";
    if (!jobDetail?.poNumber?.trim()) errors.poNumber = "PO Number is required";
    if (!jobDetail?.date?.trim()) errors.date = "Date is required";
    if (!contactDetails?.preparedBy?.trim())
      errors.preparedBy = "Prepared By is required";
    if (!contactDetails?.mobile?.trim()) errors.mobile = "Mobile is required";

    if (
      !colorDetails ||
      colorDetails.length === 0 ||
      !colorDetails.some((c) => c?.color?.trim())
    ) {
      errors.colorDetails = "At least one color is required";
    }

    if (Object.keys(errors).length > 0) {
      console.log("❌ Validation errors:", errors);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    if (
      data.technicalDetails &&
      data.technicalDetails.oldRefDate === ""
    ) {
      data.technicalDetails.oldRefDate = null;
    }

    // ✅ Strip any status sent from the frontend — new jobs always start at DESIGN
    delete data.status;

    const newJob = await createJobService(data, req.file);

    return res
      .status(201)
      .json({ message: "Job created successfully", job: newJob });
  } catch (error) {
    console.error("🔥 CREATE ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await getAllJobsService();
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await getJobByIdService(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    let data = {};
    try {
      data = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (err) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    if (req.file) {
      data.fileUrl = req.file.path || req.file.filename;
    } else if (data.removeExistingFile) {
      data.fileUrl = "";
    }

    // Clean up internal frontend field before saving
    delete data.removeExistingFile;

    const job = await updateJobService(req.params.id, data);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json(job);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await deleteJobService(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Assign a job to a non-admin user + send email notification
exports.assignJob = async (req, res) => {
  try {
    const { id } = req.params; // job ID
    const { userId, jobRole } = req.body;

    // Validate required fields
    if (!userId || !jobRole) {
      return res
        .status(400)
        .json({ message: "userId and jobRole are required" });
    }

    // Validate jobRole value
    const validRoles = ["design", "QC", "production", "dispatch"];
    if (!validRoles.includes(jobRole)) {
      return res.status(400).json({
        message: `jobRole must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Find the user and confirm they are NOT admin
    const user = await User.findById(userId).populate("role", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role?.name?.toLowerCase() === "admin") {
      return res
        .status(400)
        .json({ message: "Cannot assign a job to an admin user" });
    }

    // Use findByIdAndUpdate with $set/$push so this works even if
    // Job.js model was not yet updated with the new schema fields.
    await Job.findByIdAndUpdate(
      id,
      {
        $set: { 
          assignedTo: userId,
          employeeStatus: "Assigned",
          status: "ASSIGNED"
        },
        $push: {
          assignmentHistory: {
            user: userId,
            jobRole,
            assignedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    // Send email to the assigned user
    try {
      await sendEmail({
        email: user.email,
        subject: `Job Assigned: ${job.jobDetail?.jobName || job.jobId}`,
        message: `Hello ${user.fullName},

You have been assigned to the following job:

  Job ID    : ${job.jobId}
  Job Name  : ${job.jobDetail?.jobName || "N/A"}
  Customer  : ${job.jobDetail?.customerName || "N/A"}
  PO Number : ${job.jobDetail?.poNumber || "N/A"}
  Your Role : ${jobRole.toUpperCase()}

Please log in to the AdminPulse system to view the full job details and begin your work.

Thank you,
AdminPulse Team`,
      });
    } catch (emailErr) {
      // Email failure should not block the API response
      console.error("⚠️  Email send failed:", emailErr.message);
    }

    // ✅ Create in-app notification for the assigned user
    try {
      await Notification.create({
        user:    "AdminPulse",
        message: `assigned you to job "${job.jobDetail?.jobName || job.jobId}" as ${jobRole.toUpperCase()}`,
        project: "Job Assignment",
        type:    "job",
        image:   "/default-user.png",
        jobId:   job._id,
      });
      // Note: Socket emit for job notifications can be added here when io is available
    } catch (notifErr) {
      console.error("⚠️  Job notification create failed:", notifErr.message);
    }

    return res.status(200).json({
      message: `Job successfully assigned to ${user.fullName}`,
      job,
    });
  } catch (err) {
    console.error("ASSIGN JOB ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Get all non-admin users (for the assignment dropdown)
exports.getNonAdminUsers = async (req, res) => {
  try {
    // Populate role so we can filter by name
    const users = await User.find({ status: "active" })
      .select("-password")
      .populate("role", "name");

    // Filter out admin users
    const nonAdminUsers = users.filter(
      (u) => u.role?.name?.toLowerCase() !== "admin"
    );

    return res.status(200).json({ success: true, users: nonAdminUsers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Update Employee Status
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeStatus } = req.body;

    const validStatuses = ["Assigned", "Draft", "Working in Progress", "Completed"];
    if (!validStatuses.includes(employeeStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const updates = { employeeStatus };
    
    // ✅ Sync main status with employee progress
    if (employeeStatus === "Working in Progress") {
      updates.status = "WORKING_IN_PROGRESS";
    } else if (employeeStatus === "Completed") {
      updates.status = "COMPLETED";
    } else if (employeeStatus === "Assigned") {
      updates.status = "ASSIGNED";
    } else if (employeeStatus === "Draft") {
      updates.status = "DRAFT";
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ Emit real-time update to all clients so admin dashboard + job list refresh instantly
    const io = req.app.get("io");
    if (io) {
      io.emit("employee_status_updated", {
        jobId: job._id,
        employeeStatus,
        jobName: job.jobDetail?.jobName,
        jobCode: job.jobId,
      });
    }

    return res.status(200).json({ message: "Employee status updated successfully", job });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};