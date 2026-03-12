const User = require("../models/User");

exports.getUsers = async (req, res) => {
  const users = await User.find().populate("role");
  res.json(users);
};

exports.createUser = async (req, res) => {
  const { fullName, age, email, country, password, role, status } = req.body;

  const user = new User({
    fullName,
    age,
    email,
    country,
    password,
    role,
    status,
    image: req.file ? req.file.filename : ""
  });

  await user.save();

  res.status(201).json(user);
};

exports.updateUser = async (req, res) => {

  try {

    const { fullName, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email },
      { new: true }
    );

    res.json({
      message: "User updated",
      user: updatedUser,
    });

  } catch (error) {

    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });

  }

};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

// const User = require("../models/User");
// const bcrypt = require("bcrypt");

// exports.getUsers = async (req, res) => {
//   const users = await User.find().populate("role");
//   res.json(users);
// };

// exports.createUser = async (req, res) => {
//   try {
//     const { fullName, age, email, country, password, role, status } = req.body;

//     const user = new User({
//       fullName,
//       age,
//       email,
//       country,
//       password, 
//       role,
//       status,
//       image: req.file ? req.file.filename : ""
//     });

//     await user.save();

//     res.status(201).json(user);

//   } catch (error) {
//     console.error("CREATE USER ERROR:", error);  
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = { ...req.body };

    
//     if (updateData.password) {
//       updateData.password = await bcrypt.hash(updateData.password, 10);
//     }

//     if (req.file) {
//       updateData.image = req.file.filename;
//     }

//     const updatedUser = await User.findByIdAndUpdate(id, updateData, {
//       new: true
//     });

//     res.json(updatedUser);

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.deleteUser = async (req, res) => {
//   await User.findByIdAndDelete(req.params.id);
//   res.json({ message: "User deleted" });
// };