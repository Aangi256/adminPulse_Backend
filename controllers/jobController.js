const {
  getAllJobsService,
  getJobByIdService,
  updateJobService,
} = require("../services/jobService");

const Job = require("../models/Job");

// ✅ CREATE JOB
exports.createJob = async (req, res) => {
  try {
    console.log("RAW BODY:", req.body);

    let data = {};

    // ✅ SAFE PARSE (handles both JSON & form-data)
    try {
      data = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (err) {
      return res.status(400).json({
        message: "Invalid JSON format",
      });
    }

    console.log("PARSED DATA:", data);

    const jobDetail = data.jobDetail || {};
    const contactDetails = data.contactDetails || {};
    const colorDetails = data.colorDetails || [];

    // ✅ CLEAN VALIDATION (trim + safe access)
    if (
      !jobDetail.customerName?.trim() ||
      !jobDetail.jobName?.trim() ||
      !jobDetail.poNumber?.trim()
    ) {
      return res.status(400).json({
        message: "Missing required job details",
      });
    }

    if (
      !contactDetails.preparedBy?.trim() ||
      !contactDetails.mobile?.trim()
    ) {
      return res.status(400).json({
        message: "Missing contact details",
      });
    }

    if (!Array.isArray(colorDetails) || colorDetails.length === 0) {
      return res.status(400).json({
        message: "At least one color required",
      });
    }

    // ✅ FILE HANDLE
    if (req.file) {
      data.file = req.file.filename;
    }

    // ✅ CREATE
    const job = await Job.create(data);

    return res.status(201).json(job);

  } catch (error) {
    console.error("CREATE ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ✅ GET ALL JOBS
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await getAllJobsService();
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ GET JOB BY ID
exports.getJobById = async (req, res) => {
  try {
    const job = await getJobByIdService(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE JOB (FIXED PARSING + FILE)
exports.updateJob = async (req, res) => {
  try {
    let data = {};

    // ✅ SAME SAFE PARSE AS CREATE
    try {
      data = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (err) {
      return res.status(400).json({
        message: "Invalid JSON format",
      });
    }

    // ✅ FILE HANDLE
    if (req.file) {
      data.file = req.file.filename;
    }

    const job = await updateJobService(
      req.params.id,
      data,
      req.file
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};