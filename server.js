const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedRoles = require("./utils/seedRoles");
const createAdmin = require("./utils/createAdmin");

const roleRoutes = require("./routes/roleRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const customerRoutes = require("./routes/customerRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require("./routes/chatRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/jobs", jobRoutes);

const startServer = async () => {
  try {
    await connectDB();
    await seedRoles();
    await createAdmin();

    const PORT = process.env.NODE_PORT || 5000;

    const http = require("http");
    const server = http.createServer(app);

    const { Server } = require("socket.io");
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: "http://localhost:3000",
        credentials: true,
      },
    });

    const onlineUsers = new Map();

    io.on("connection", (socket) => {
      console.log("🔌 Socket connected:", socket.id);

      socket.on("setup", (userId) => {
        if (!userId) return;

        onlineUsers.set(userId.toString(), socket.id);
        socket.join(userId.toString());

        socket.emit("connected");
        io.emit("online users", Array.from(onlineUsers.keys()));
      });

      socket.on("join chat", (chatId) => {
        socket.join(chatId);
      });

      // ✅ UPDATED MESSAGE + NOTIFICATION LOGIC
      socket.on("new message", async (newMessage) => {
        const chat = newMessage?.chat;
        if (!chat?.users) return;

        const Notification = require("./models/Notification");

        for (const user of chat.users) {
          const uid = (user._id || user).toString();
          const senderId = newMessage.sender?._id?.toString();

          if (uid === senderId) continue;

          // ✅ Send message
          socket.to(uid).emit("message received", newMessage);

          try {
            // ✅ Save notification
            const notif = await Notification.create({
              user: newMessage.sender?.name || "User",
              message: newMessage.content,
              project: "Chat Message",
              type: "chat",
              image: newMessage.sender?.avatar || "/default-user.png",
            });

            // ✅ Emit notification
            socket.to(uid).emit("new notification", notif);
          } catch (err) {
            console.error("Notification error:", err.message);
          }
        }
      });

      socket.on("disconnect", () => {
        onlineUsers.forEach((socketId, userId) => {
          if (socketId === socket.id) {
            onlineUsers.delete(userId);
          }
        });

        io.emit("online users", Array.from(onlineUsers.keys()));
      });
    });

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed:", error.message);
    process.exit(1);
  }
};

startServer();