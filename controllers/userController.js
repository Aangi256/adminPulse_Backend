const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* ================= GET ALL USERS ================= */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("role", "name");

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET SINGLE USER ================= */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE USER ================= */
exports.createUser = async (req, res) => {
  try {
    const { fullName, age, email, country, role, status } = req.body;

    const user = new User({
      fullName,
      age,
      email,
      country,
      role,
      status,
      password: "123456", // default password
      image: req.file ? req.file.filename : ""
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created with default password (123456)",
      user
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= ADMIN UPDATE USER ================= */
exports.updateUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      age,
      country,
      status,
      role,
      password
    } = req.body;

    const updateData = {
      fullName,
      email,
      age,
      country,
      status,
      role
    };

    // ✅ Password update (admin case)
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // ✅ Image update
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("role", "name");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};

/* ================= ADMIN CHANGE PASSWORD ================= */
exports.updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password update failed",
      error: error.message
    });
  }
};

/* ================= ✅ USER: UPDATE OWN PROFILE ================= */
exports.updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = req.body.fullName || user.fullName;
    user.age = req.body.age || user.age;
    user.country = req.body.country || user.country;

    if (req.file) {
      user.image = req.file.filename;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: "Profile updated",
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        age: updatedUser.age,
        country: updatedUser.country,
        image: updatedUser.image,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ✅ USER: CHANGE OWN PASSWORD ================= */
exports.changeMyPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Both old and new password are required"
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect"
      });
    }

    user.password = newPassword; // ✅ auto hash via schema
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= SEARCH USERS ================= */
exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          fullName: {
            $regex: req.query.search,
            $options: "i",
          },
        }
      : {};

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user._id } })
      .select("-password");

    res.json({ users });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};