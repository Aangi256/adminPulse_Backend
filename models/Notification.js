const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: String,
    message: String,
    project: String,
    type: {
      type: String,
      default: "chat",
    },
    image: {
      type: String,
      default: "/default-user.png",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);