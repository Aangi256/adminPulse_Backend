const Notification = require("../models/Notification");

// GET notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({
      createdAt: -1,
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// CREATE notification (manual)
exports.createNotification = async (req, res) => {
  try {
    const { user, message, project, image } = req.body;

    const notification = await Notification.create({
      user,
      message,
      project,
      image,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};