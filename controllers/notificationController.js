const Notification = require("../models/Notification");

// ✅ GET only unread notifications (so dismissed ones never come back)
const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ read: false }).sort({ createdAt: -1 });
  res.json(notifications);
};

// ✅ MARK AS READ
const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  );

  res.json(notification);
};

module.exports = {
  getNotifications,
  markNotificationRead,
};