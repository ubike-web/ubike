const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const { supabaseAuth } = require("../config/supabase");
const supabase = require("../config/supabase");

module.exports.sendVerificationEmail = asyncHandler(async (req, res) => {
  const { email, userType } = req.body;

  if (!email || !userType) {
    return res.status(400).json({ message: "Email and userType are required" });
  }

  const redirectTo = `${process.env.CLIENT_URL}/${userType}/verify-email`;

  const { error } = await supabaseAuth.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(200).json({
    message: "Verification email sent successfully",
    user: { email },
  });
});

module.exports.forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email } = req.body;
  const { userType } = req.params;

  const redirectTo = `${process.env.CLIENT_URL}/${userType}/reset-password`;

  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(200).json({ message: "Reset password email sent successfully" });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json(errors.array());

  const { token, password } = req.body;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (updateError) {
    return res.status(500).json({ message: "Failed to reset password" });
  }

  res.status(200).json({ message: "Password reset successfully" });
});
