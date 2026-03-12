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


const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

const startServer = async () => {
  try {
    await connectDB();
    await seedRoles();
    await createAdmin();

    const PORT = process.env.NODE_PORT || 5000;
    app.use("/api/v1/roles", roleRoutes);
    app.use("/api/v1/users", userRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();