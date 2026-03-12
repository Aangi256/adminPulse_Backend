const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    project: {
      type: String,
    },
    type: {
      type: String,
      default: "Project",
    },
    image: {
      type: String,
      default: "/default-user.png",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);