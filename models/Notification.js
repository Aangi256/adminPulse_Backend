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

    // ✅ Who should receive this notification (employee userId)
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Reference to a job (for job notifications)
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },

    // Reference to a chat (for chat notifications)
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },

    // ✅ Track if this notification has been read
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);