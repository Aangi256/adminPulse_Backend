const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobId: { type: String, unique: true },

    customerName: { type: String, required: true },
    mobile: { type: String },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["DESIGN", "QC", "PRODUCTION", "ACCOUNT", "DISPATCH"],
      default: "DESIGN",
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    history: [
      {
        status: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);