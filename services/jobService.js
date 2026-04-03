exports.createJob = async (data, user) => {

  if (!user) {
    throw new Error("User not authenticated");
  }

  const jobId = "JOB-" + Date.now();

  const job = await Job.create({
    ...data,
    jobId,

    history: [
      {
        status: "DESIGN",
        updatedBy: user._id,
      },
    ],
  });

  return job;
};