const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // USER ONLINE
  socket.on("setup", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    socket.emit("connected");
  });

  // JOIN CHAT
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
  });

  // SEND MESSAGE
  socket.on("send message", (message) => {
    socket.to(message.chat).emit("receive message", message);
  });

  // TYPING
  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });

  socket.on("stop typing", (chatId) => {
    socket.to(chatId).emit("stop typing");
  });

  // SEEN MESSAGE
  socket.on("message seen", ({ chatId }) => {
    socket.to(chatId).emit("message seen");
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) onlineUsers.delete(key);
    });
  });
});