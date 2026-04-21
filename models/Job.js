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
      enum: ["DESIGN", "QC", "PRODUCTION", "DISPATCH"],
      default: "DESIGN",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);