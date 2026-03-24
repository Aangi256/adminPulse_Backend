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

const app = express();

// ✅ Debug (REMOVE after fixing)
console.log({
  roleRoutes,
  userRoutes,
  authRoutes,
  notificationRoutes,
  customerRoutes,
  messageRoutes,
  chatRoutes,
});

app.use(cors());
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

const startServer = async () => {
  try {
    await connectDB();
    await seedRoles();
    await createAdmin();

    const PORT = process.env.NODE_PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const io = require("socket.io")(server, {
      pingTimeout: 60000,
      cors: {
        origin: "http://localhost:3000",
      },
    });

    io.on("connection", (socket) => {
      console.log("Socket connected");

      socket.on("join chat", (room) => {
        socket.join(room);
      });

      socket.on("new message", (newMessage) => {
        socket.to(newMessage.chat).emit("message received", newMessage);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();