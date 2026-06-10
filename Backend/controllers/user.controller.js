const asyncHandler = require("express-async-handler");
const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const supabase = require("../config/supabase");

module.exports.registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone } = req.body;

  const alreadyExists = await userModel.findOne({ email });
  if (alreadyExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  await userService.createUser(fullname.firstname, fullname.lastname, email, password, phone);

  res.status(201).json({
    message: "Registration successful! Please check your email to verify your account before logging in.",
  });
});

module.exports.verifyEmail = asyncHandler(async (req, res) => {
  // Verification is handled by Supabase when the user clicks the email link.
  // This endpoint just confirms the current verified status for the frontend.
  const token = req.cookies.token || req.headers.token;
  if (!token) return res.status(400).json({ message: "Token required" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(400).json({ message: "Invalid token" });

  res.status(200).json({
    message: user.email_confirmed_at
      ? "Email verified successfully"
      : "Email not yet verified",
    emailVerified: !!user.email_confirmed_at,
  });
});

module.exports.loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  let authData;
  try {
    authData = await userModel.signIn(email, password);
  } catch (err) {
    const msg = err.message.includes("Email not confirmed")
      ? "Please verify your email before logging in. Check your inbox for the verification link."
      : "Invalid email or password";
    return res.status(401).json({ message: msg });
  }

  // Verify it is a user account (not captain)
  if (authData.user.user_metadata?.userType !== 'user') {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const profile = await userModel.findOne({ _id: authData.user.id });
  if (!profile) return res.status(404).json({ message: "User profile not found" });

  const token = authData.session.access_token;
  res.cookie("token", token);
  res.json({
    message: "Logged in successfully",
    token,
    user: {
      _id: profile._id,
      fullname: profile.fullname,
      email: profile.email,
      phone: profile.phone,
      rides: profile.rides,
      socketId: profile.socketId,
      emailVerified: !!authData.user.email_confirmed_at,
    },
  });
});

module.exports.userProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports.updateUserProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, phone } = req.body;
  const updatedUser = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    { fullname, phone }
  );

  res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
});

module.exports.logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies.token || req.headers.token;
  res.clearCookie("token");

  if (token) {
    await blacklistTokenModel.create({ token });
    await supabase.auth.admin.signOut(token);
  }

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token, password } = req.body;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(400).json({
      message: "This password reset link is invalid or has expired. Please request a new one.",
    });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (updateError) {
    return res.status(500).json({ message: "Failed to reset password. Please try again." });
  }

  res.status(200).json({
    message: "Your password has been successfully reset. You can now log in with your new credentials.",
  });
});
