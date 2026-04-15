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

    // ─────────────────────────────────────────────
    // SOCKET.IO SETUP (PRODUCTION-GRADE)
    // ─────────────────────────────────────────────
    const { Server } = require("socket.io");
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
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
        console.log(`👤 User online: ${userId}`);
      });


      socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log(`🏠 Joined chat room: ${chatId}`);
      });

      // ── 3. NEW MESSAGE (Real-time delivery)
      // Frontend: socket.emit("new message", populatedMessage)
      socket.on("new message", (newMessage) => {
        const chat = newMessage?.chat;
        if (!chat?.users) return;

        chat.users.forEach((user) => {
          const uid = (user._id || user).toString();
          const senderId = newMessage.sender?._id?.toString();
          if (uid === senderId) return; // don't send back to sender
          // Emit to the recipient's personal room
          socket.to(uid).emit("message received", newMessage);
        });
      });

      // ── 4. TYPING INDICATORS
      // Frontend: socket.emit("typing", { chatId, userId, userName })
      socket.on("typing", ({ chatId, userId, userName }) => {
        socket.to(chatId).emit("typing", { chatId, userId, userName });
      });

      socket.on("stop typing", (chatId) => {
        socket.to(chatId).emit("stop typing", chatId);
      });

      // ── 5. MESSAGE SEEN
      // Frontend: socket.emit("message seen", { chatId, userId })
      socket.on("message seen", ({ chatId, userId }) => {
        socket.to(chatId).emit("message seen", { chatId, userId });
      });

      // ── 6. DISCONNECT
      socket.on("disconnect", () => {
        onlineUsers.forEach((socketId, userId) => {
          if (socketId === socket.id) {
            onlineUsers.delete(userId);
            console.log(`👤 User offline: ${userId}`);
          }
        });
        io.emit("online users", Array.from(onlineUsers.keys()));
        console.log("❌ Socket disconnected:", socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
