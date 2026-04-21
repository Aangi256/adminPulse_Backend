const Job = require("../models/Job");
const generateJobId = require("../utils/generateJobId");
const createFolder = require("../utils/createFolder");
const generatePDF = require("../utils/generatePDF");

exports.createJobService = async (data, file) => {
  const jobId = generateJobId();

  // create folder
  createFolder(jobId);

  const job = await Job.create({
    jobId,
    ...data,
    fileUrl: file?.path,
  });

  // generate pdf (optional)
  await generatePDF(job);

  return job;
};

exports.getAllJobsService = () => Job.find().sort({ createdAt: -1 });

exports.getJobByIdService = (id) => Job.findById(id);

exports.updateJobService = (id, data) =>
  Job.findByIdAndUpdate(id, data, { new: true });