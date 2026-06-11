const asyncHandler = require("express-async-handler");
const captainModel = require("../models/captain.model");
const captainService = require("../services/captain.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const supabase = require("../config/supabase");

module.exports.registerCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone, vehicle, documents } = req.body;

  const alreadyExists = await captainModel.findOne({ email });
  if (alreadyExists) {
    return res.status(400).json({ message: "Captain already exists" });
  }

  const captain = await captainService.createCaptain(
    fullname.firstname, fullname.lastname, email, password, phone,
    vehicle.color, vehicle.number, vehicle.capacity, vehicle.type,
    vehicle.make, vehicle.model, vehicle.year,
    documents?.nationalIdNumber, documents?.licenseNumber,
  );

  // Save KYC record to shared kyc_documents table for admin review
  if (captain && (documents?.nationalIdNumber || documents?.licenseNumber)) {
    await supabase.from('kyc_documents').upsert({
      user_id: captain._id,
      plate_number: vehicle.number,
      national_id_url: documents?.nationalIdNumber || '',
      license_url: documents?.licenseNumber || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }).catch(() => {}); // non-fatal if kyc_documents table doesn't exist yet
  }

  res.status(201).json({
    message: "Registration successful! Please check your email to verify your account before logging in.",
  });
});

module.exports.verifyEmail = asyncHandler(async (req, res) => {
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

module.exports.loginCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  let authData;
  try {
    authData = await captainModel.signIn(email, password);
  } catch (err) {
    const msg = err.message.includes("Email not confirmed")
      ? "Please verify your email before logging in. Check your inbox for the verification link."
      : "Invalid email or password";
    return res.status(401).json({ message: msg });
  }

  if (authData.user.user_metadata?.userType !== 'captain') {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const profile = await captainModel.findOne({ _id: authData.user.id });
  if (!profile) return res.status(404).json({ message: "Captain profile not found" });

  const token = authData.session.access_token;
  res.cookie("token", token);
  res.json({ message: "Logged in successfully", token, captain: profile });
});

module.exports.captainProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ captain: req.captain });
});

module.exports.updateCaptainProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { captainData } = req.body;
  const updatedCaptain = await captainModel.findOneAndUpdate(
    { email: req.captain.email },
    captainData,
    { new: true }
  );

  res.status(200).json({ message: "Profile updated successfully", user: updatedCaptain });
});

module.exports.logoutCaptain = asyncHandler(async (req, res) => {
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
