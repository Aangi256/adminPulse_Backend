const User = require("../models/User");
const bcrypt = require("bcryptjs");


// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {

    const users = await User.find()
      .select("-password")
      .populate("role", "name");

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {

    console.error("GET USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// GET ALL USERS
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

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { fullName, age, email, country, password, role, status } = req.body;

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      fullName,
      age,
      email,
      country,
      password: hashedPassword,
      role,
      status,
      image: req.file ? req.file.filename : ""
    });

    await user.save();

    res.status(201).json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// UPDATE USER
// UPDATE USER
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

    // Update password only if provided
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Update image if uploaded
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

exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          fullName: { $regex: req.query.search, $options: "i" },
        }
      : {};

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user._id } })
      .select("-password");

    res.json(users); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE USER
exports.deleteUser = async (req, res) => {
  try {

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "User deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};