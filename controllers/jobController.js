const jobService = require("../services/jobService");

exports.createJob = async (req, res) => {
  try {
    const job = await jobService.createJob(req.body, req.user);

    res.json(job);

  } catch (err) {
    console.error("CREATE JOB ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const job = await jobService.updateJobStatus(
      req.params.id,
      req.user
    );
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJobs = async (req, res) => {
  const jobs = await require("../models/Job").find();
  res.json(jobs);
};