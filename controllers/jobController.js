const Job = require("../models/Job");
const User = require("../models/User");
const Customer = require("../models/Customer"); // ✅ NEW: Import Customer model
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const { sendWhatsAppMessage } = require("../services/whatsappService"); // ✅ NEW: Import WhatsApp service
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
    
    // ✅ Filter out empty color rows
    if (data.colorDetails) {
      data.colorDetails = data.colorDetails.filter(c => c.color && c.color.trim() !== "");
    }

    // ✅ Explicitly set new jobs to DRAFT status
    data.status = "DRAFT";
    data.employeeStatus = "Draft";

    const newJob = await createJobService(data, req.file);

    // ✅ NEW: Send WhatsApp notification to customer
    try {
      const customer = await Customer.findOne({ fullName: data.jobDetail.customerName });
      if (customer && customer.phone) {
        const msg = `Hello ${customer.fullName}, your job "${data.jobDetail.jobName}" has been created successfully. Job ID: ${newJob.jobId}. We will update you on the progress. - AdminPulse`;
        sendWhatsAppMessage(customer.phone, msg);
      }
    } catch (waErr) {
      console.error("⚠️ WhatsApp notification failed:", waErr.message);
    }

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
    let filter = {};

    // If not admin, only show jobs assigned to this user
    if (req.user?.role?.name?.toLowerCase() !== "admin") {
      filter = { assignedTo: req.user._id };
    }

    const jobs = await getAllJobsService(filter);

    // ✅ SELF-HEAL: If any job is unassigned but has ASSIGNED status, fix it in the response
    const sanitizedJobs = jobs.map(job => {
      if (!job.assignedTo && (job.status === "ASSIGNED" || job.employeeStatus === "Assigned")) {
        job.status = "DRAFT";
        job.employeeStatus = "Draft";
      }
      return job;
    });

    return res.json(sanitizedJobs);
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

    // ✅ Filter out empty color rows
    if (data.colorDetails) {
      data.colorDetails = data.colorDetails.filter(c => c.color && c.color.trim() !== "");
    }

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
    let { userId, jobRole } = req.body;
    const adminId = req.user._id;

    // Default to "design" if no role is provided
    if (!jobRole) {
      jobRole = "design";
    }

    // Validate required fields
    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId is required" });
    }

    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Find the user (employee)
    const user = await User.findById(userId).populate("role", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the admin (the person assigning) to get their image
    let adminImage = "/default-user.png";
    const admin = await User.findById(adminId);
    if (admin && admin.image) {
      adminImage = admin.image;
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
${jobRole ? `  Your Role : ${jobRole.toUpperCase()}` : ""}

Please log in to the AdminPulse system to view the full job details and begin your work.

Thank you,
AdminPulse Team`,
      });
    } catch (emailErr) {
      // Email failure should not block the API response
      console.error("⚠️  Email send failed:", emailErr.message);
    }

    // ✅ Create in-app notification
    try {
      // Format the admin image path correctly
      let finalAdminImage = "/images/user/user-01.jpg";
      if (adminImage && adminImage !== "/default-user.png") {
        finalAdminImage = adminImage.startsWith("http") 
          ? adminImage 
          : `http://localhost:5000/${adminImage.replace(/\\/g, "/")}`;
      }

      console.log("🔔 Creating notification for employee:", userId);
      const notif = await Notification.create({
        user:    "AdminPulse",
        message: `assigned ${user.fullName} to job "${job.jobDetail?.jobName || job.jobId}"${jobRole ? ` as ${jobRole.toUpperCase()}` : ""}`,
        project: "Job Assignment",
        type:    "job",
        image:   finalAdminImage,
        jobId:   job._id,
        recipientId: userId, // ✅ Targeted to employee
      });
      console.log("✅ Notification created:", notif._id);

      // ✅ Emit real-time notification via Socket.io
      const io = req.app.get("io");
      if (io) {
        console.log(`📡 Job Assignment: Notifying employee ${user.fullName} (${userId})`);
        // 1. Send to the employee specifically
        io.to(userId.toString()).emit("new notification", notif);

        // 2. Also broadcast to others so admin sees it too
        console.log("📡 Broadcasting job assignment to all connected users");
        io.emit("new notification", notif); 
      } else {
        console.warn("⚠️ Socket.io (io) instance not found on req.app");
      }
    } catch (notifErr) {
      console.error("🔥 Job notification creation/emission failed:", notifErr);
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

    const validStatuses = ["Design", "QC", "Production", "Account", "Dispatch", "Completed"];
    if (!validStatuses.includes(employeeStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const updates = { employeeStatus };
    let qcUser = null;
    let pushCommand = null;
    
    // ✅ Sync main status with flow stages
    if (employeeStatus === "Design") {
      updates.status = "DESIGN";
    } else if (employeeStatus === "QC") {
      updates.status = "QC";
      
      // 🔄 Auto-assign to QC user if coming from Design
      const allUsers = await User.find({ status: "active" }).populate("role", "name");
      qcUser = allUsers.find(u => u.role?.name?.toLowerCase() === "qc");
      
      if (qcUser) {
        updates.assignedTo = qcUser._id;
        pushCommand = {
          assignmentHistory: {
            user: qcUser._id,
            jobRole: "QC",
            assignedAt: new Date()
          }
        };
      }
    } else if (employeeStatus === "Production") {
      updates.status = "PRODUCTION";
    } else if (employeeStatus === "Account") {
      updates.status = "ACCOUNT";
    } else if (employeeStatus === "Dispatch") {
      updates.status = "DISPATCH";
    } else if (employeeStatus === "Completed") {
      updates.status = "COMPLETED";
    }

    const updateQuery = { $set: updates };
    if (pushCommand) {
      updateQuery.$push = pushCommand;
    }

    const job = await Job.findByIdAndUpdate(
      id,
      updateQuery,
      { returnDocument: "after" }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ Notify Admins when any status is updated
    try {
      const adminUsers = await User.find({ status: "active" }).populate("role", "name");
      const admins = adminUsers.filter((u) => u.role?.name?.toLowerCase() === "admin");

      const peopleToNotify = [...admins];
      // Also notify the QC user if it's pending QC and they were just assigned
      if (employeeStatus === "Pending QC" && qcUser) {
        peopleToNotify.push(qcUser);
      }

        const notifiedEmails = new Set();

        for (const person of peopleToNotify) {
          if (notifiedEmails.has(person.email)) continue;
          notifiedEmails.add(person.email);

          const isQC = qcUser && person._id.toString() === qcUser._id.toString();

          // Send Email
          await sendEmail({
            email: person.email,
            subject: employeeStatus === "Pending QC" 
              ? (isQC ? `Job Assigned for QC: ${job.jobDetail?.jobName || job.jobId}` : `Job Ready for QC: ${job.jobDetail?.jobName || job.jobId}`)
              : `Job Completed: ${job.jobDetail?.jobName || job.jobId}`,
            message: `Hello ${person.fullName},

A job has been updated to "${employeeStatus}".

  Job ID    : ${job.jobId}
  Job Name  : ${job.jobDetail?.jobName || "N/A"}
  Customer  : ${job.jobDetail?.customerName || "N/A"}

${employeeStatus === "Pending QC" 
  ? (isQC ? "You have been automatically assigned to check this job." : "The job has been automatically assigned to the QC department.") 
  : "The job has been completed."}

Please log in to the AdminPulse system for more details.

Thank you,
AdminPulse Team`,
          }).catch((err) => console.error("⚠️ Email failed:", err.message));

          // In-App Notification
          const notif = await Notification.create({
            user: "AdminPulse",
            message: employeeStatus === "Pending QC" && isQC 
              ? `assigned you to job "${job.jobDetail?.jobName || job.jobId}" for QC.`
              : `Job "${job.jobDetail?.jobName || job.jobId}" is now ${employeeStatus}.`,
            project: "Job Status Update",
            type: "job",
            image: "/images/user/user-01.jpg", // Use a consistent default image
            jobId: job._id,
            recipientId: person._id, // ✅ Targeted to each recipient
          }).catch((err) => console.error("⚠️ Notification failed:", err.message));

          // ✅ Emit real-time notification via Socket.io
          const io = req.app.get("io");
          if (io && notif) {
            console.log(`📡 Status update: ${employeeStatus}. Notifying ${person.fullName} (${person._id})`);
            // Target the specific user's room
            io.to(person._id.toString()).emit("new notification", notif);
          }
        }
      } catch (notifyErr) {
        console.error("⚠️ Failed to notify users:", notifyErr.message);
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

// ✅ NEW: Update job comment (employee can add/edit comments visible to all)
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (comment === undefined || comment === null) {
      return res.status(400).json({ message: "comment field is required" });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { 
        $push: { 
          comments: { 
            user: req.user._id, 
            userName: req.user.fullName, 
            text: comment.trim(),
            createdAt: new Date()
          } 
        } 
      },
      { returnDocument: "after" }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Emit real-time update so admin dashboard refreshes instantly
    const io = req.app.get("io");
    if (io) {
      io.emit("job_comment_updated", {
        jobId: job._id,
        comments: job.comments, // Send whole array
        jobName: job.jobDetail?.jobName,
        jobCode: job.jobId,
      });
    }

    return res.status(200).json({ message: "Comment updated successfully", job });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Get dashboard statistics
exports.getJobStats = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const completedJobs = await Job.countDocuments({ status: "COMPLETED" });
    const draftJobs = await Job.countDocuments({ status: "DRAFT" });
    
    // Ongoing is everything that is assigned but not completed or draft
    const ongoingJobs = await Job.countDocuments({ 
      status: { $in: ["DESIGN", "QC", "PRODUCTION", "ACCOUNT", "DISPATCH", "ASSIGNED", "WORKING_IN_PROGRESS", "PENDING_QC"] } 
    });

    // Weekly stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyJobs = await Job.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        ongoingJobs,
        completedJobs,
        draftJobs,
        weeklyJobs
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Get filtered reports
exports.getJobReports = async (req, res) => {
  try {
    const { customerName, assignedTo, status, startDate, endDate, jobType } = req.query;
    
    let query = {};

    if (customerName) {
      query["jobDetail.customerName"] = { $regex: customerName, $options: "i" };
    }
    
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const jobs = await Job.find(query)
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};