const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    let chat = await Chat.findOne({
      users: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "fullName image" },
      });

    if (chat) {
      return res.json(chat);
    }


    const newChat = await Chat.create({
      chatName: "sender",
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id)
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "fullName image" },
      });

    res.status(201).json(fullChat);
  } catch (error) {
    console.error("accessChat error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChats = async (req, res) => {
  try {

    const allUsers = await User.find({ _id: { $ne: req.user._id } }).select("-password");

    const chats = await Chat.find({
      users: { $in: [req.user._id] },
    })
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "fullName image" },
      })
      .sort({ updatedAt: -1 });
    const chatMap = new Map();
    for (const chat of chats) {
      const otherUser = chat.users.find(
        (u) => u._id.toString() !== req.user._id.toString()
      );
      if (otherUser && !chatMap.has(otherUser._id.toString())) {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          readBy: { $ne: req.user._id },
        });
        chatMap.set(otherUser._id.toString(), {
          ...chat.toObject(),
          unreadCount,
        });
      }
    }
    const userList = allUsers.map((user) => {
      const existingChat = chatMap.get(user._id.toString()) || null;
      return {
        user: user.toObject(),
        chat: existingChat,
      };
    });
    userList.sort((a, b) => {
      const aTime = a.chat?.updatedAt ? new Date(a.chat.updatedAt).getTime() : 0;
      const bTime = b.chat?.updatedAt ? new Date(b.chat.updatedAt).getTime() : 0;
      return bTime - aTime; 
    });

    res.json(userList);
  } catch (error) {
    console.error("getChats error:", error);
    res.status(500).json({ message: error.message });
  }
};
