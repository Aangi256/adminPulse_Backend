const Notification = require("../models/Notification");

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const { user, message, project, image } = req.body;

    const notification = new Notification({
      user,
      message,
      project,
      image,
    });

    await notification.save();

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};