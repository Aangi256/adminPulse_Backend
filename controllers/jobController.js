const Job = require("../models/Job");
const { createJobService, getAllJobsService, getJobByIdService, updateJobService, deleteJobService } = require("../services/jobService");

console.log("✅ jobController.js loaded"); // remove after confirming

exports.createJob = async (req, res) => {
  try {
    console.log("📥 req.body:", req.body);
    console.log("📥 req.file:", req.file);

    // ✅ Safe parse of stringified form data
    let data;
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      return res.status(400).json({ message: "Invalid JSON — could not parse req.body.data" });
    }

    console.log("📦 Parsed data:", JSON.stringify(data, null, 2));

    const { jobDetail, contactDetails, colorDetails } = data;

    const errors = {};

    if (!jobDetail?.customerName?.trim()) errors.customerName = "Customer Name is required";
    if (!jobDetail?.jobName?.trim())      errors.jobName      = "Job Name is required";
    if (!jobDetail?.poNumber?.trim())     errors.poNumber     = "PO Number is required";
    if (!jobDetail?.date?.trim())         errors.date         = "Date is required";
    if (!contactDetails?.preparedBy?.trim()) errors.preparedBy = "Prepared By is required";
    if (!contactDetails?.mobile?.trim())  errors.mobile       = "Mobile is required";

    if (!colorDetails || colorDetails.length === 0 || !colorDetails.some((c) => c?.color?.trim())) {
      errors.colorDetails = "At least one color is required";
    }

    if (Object.keys(errors).length > 0) {
      console.log("❌ Validation errors:", errors);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Clean up empty strings for date fields to prevent Mongoose CastError
    if (data.technicalDetails && data.technicalDetails.oldRefDate === "") {
      data.technicalDetails.oldRefDate = null;
    }

    const newJob = await createJobService(data, req.file);

    return res.status(201).json({ message: "Job created successfully", job: newJob });

  } catch (error) {
    console.error("🔥 CREATE ERROR:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
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

    if (req.file) data.file = req.file.filename;

    const job = await updateJobService(req.params.id, data, req.file);
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