const User = require("../models/User");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid Email" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role?.name,
        image: user.image
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User with this email does not exist"
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpire =
      Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl =
      `http://localhost:3000/reset-password/${resetToken}`;

    const message =
      `You requested a password reset.Reset your password here:${resetUrl}`;


    await sendEmail({
      email: user.email,
      subject: "Password Reset",
      message: message
    });

    res.json({
      success: true,
      message: "Reset password email sent"
    });

  } catch (error) {

    console.log("ERROR:", error);
    res.status(500).json({
      message: error.message
    });

  }
};

exports.resetPassword = async (req, res) => {

  try {

    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }

};