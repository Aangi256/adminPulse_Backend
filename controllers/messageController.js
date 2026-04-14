const Message = require("../models/Message");
const Chat = require("../models/Chat");

// ─────────────────────────────────────────────
// POST /api/message
// Send a new message
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ message: "content and chatId are required" });
    }

    // Create message — sender is the logged-in user
    const message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      readBy: [req.user._id], // sender has already "read" their own message
    });

    // Populate sender info for immediate use in frontend
    const populated = await Message.findById(message._id)
      .populate("sender", "fullName image")
      .populate("chat");

    // ✅ Update latestMessage on the Chat document
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(populated);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/message/:chatId
// Get all messages in a chat (also marks them as read)
// ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "fullName image")
      .sort({ createdAt: 1 }); // oldest first

    // ✅ Mark all messages in this chat as read by current user
    await Message.updateMany(
      {
        chat: req.params.chatId,
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/message/read/:chatId
// Mark all messages in a chat as read
// ─────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        chat: req.params.chatId,
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("markAsRead error:", error);
    res.status(500).json({ message: error.message });
  }
};
