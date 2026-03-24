const Message = require("../models/Message");
const Chat = require("../models/Chat");

exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  const message = await Message.create({
    sender: req.user?._id, // safer
    content,
    chat: chatId,
  });

  res.json(message);
};

exports.getMessages = async (req, res) => {
  const messages = await Message.find({
    chat: req.params.chatId,
  });

  res.json(messages);
};