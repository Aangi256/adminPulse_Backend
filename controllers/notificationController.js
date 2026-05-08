const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// ✅ GET only unread notifications for the logged-in user
const getNotifications = async (req, res) => {
  // userId is passed as query param: /api/notifications?userId=xxx
  const { userId } = req.query;

  const filter = { read: false };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const oid = new mongoose.Types.ObjectId(userId);
    // Return notifications where recipientId matches OR recipientId is null (broadcast)
    filter.$or = [
      { recipientId: oid },
      { recipientId: null }, 
    ];
  }

  console.log("🔍 Fetching notifications with filter:", JSON.stringify(filter));

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

// ✅ MARK ALL AS READ
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Notification.updateMany(
      { 
        $or: [{ recipientId: userId }, { recipientId: null }],
        read: false 
      },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAsRead,
};