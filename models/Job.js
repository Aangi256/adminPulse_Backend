const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  color: String,
  anilox: String,
  volume: String,
});

const jobSchema = new mongoose.Schema(
  {
    jobId: { type: String, unique: true },

    jobDetail: {
      customerName: String,
      date: Date,
      jobName: String,
      poNumber: String,
      sizeAround: Number,
      sizeAcross: Number,
      cylinder: String,
      cylinderMM: Number,
      subWidth: Number,
      noOfAround: Number,
      noOfAcross: Number,
      aroundGap: Number,
      acrossGap: Number,
      totalUps: Number,
    },

    colorDetails: [colorSchema],

    technicalDetails: {
      plateThickness: String,
      screenRuling: String,
      sensorSpot: String,
      bearer: String,
      distortion: String,
      specialInstruction: String,
      oldRefNo: String,
      oldRefDate: Date,
    },

    contactDetails: {
      preparedBy: String,
      mobile: String,
      email: String,
    },

    fileUrl: String,

    status: {
      type: String,
      enum: ["DRAFT", "DESIGN", "QC", "PRODUCTION", "ACCOUNT", "DISPATCH", "ASSIGNED", "WORKING_IN_PROGRESS", "PENDING_QC", "COMPLETED", "HOLD"],
      default: "DRAFT",
    },

    // ✅ NEW: Track which user is assigned to this job
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ Track employee's work progress
    employeeStatus: {
      type: String,
      enum: ["Design", "QC", "Production", "Account", "Dispatch", "Completed", "Assigned", "Draft"],
      default: "Draft",
    },

    // ✅ Multiple comments/notes on the job
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String, // Cache name for easy display
        text: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ✅ Track assignment history
    assignmentHistory: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        jobRole: {
          type: String,
          enum: ["design", "QC", "production", "dispatch"],
        },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);