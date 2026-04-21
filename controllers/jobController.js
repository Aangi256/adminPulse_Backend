const {
  createJobService,
  getAllJobsService,
  getJobByIdService,
  updateJobService,
} = require("../services/jobService");

exports.createJob = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);

    const job = await createJobService(data, req.file);

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllJobs = async (req, res) => {
  const jobs = await getAllJobsService();
  res.json(jobs);
};

exports.getJobById = async (req, res) => {
  const job = await getJobByIdService(req.params.id);
  res.json(job);
};

exports.updateJob = async (req, res) => {
  const data = JSON.parse(req.body.data);
  const job = await updateJobService(req.params.id, data);
  res.json(job);
};