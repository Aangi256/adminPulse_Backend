const Notification = require("../models/Notification");

// ✅ GET only unread notifications for the logged-in user
const getNotifications = async (req, res) => {
  // userId is passed as query param: /api/notifications?userId=xxx
  const { userId } = req.query;

  const filter = { read: false };
  if (userId) {
    // Return notifications where recipientId matches OR recipientId is null (broadcast)
    filter.$or = [
      { recipientId: userId },
      { recipientId: null, type: { $ne: "job" } }, // null-recipient chat notifs are ok
    ];
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
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