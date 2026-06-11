const asyncHandler = require("express-async-handler");
const captainModel = require("../models/captain.model");
const captainService = require("../services/captain.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const supabase = require("../config/supabase");
const axios = require("axios");

const PAYSTACK_BASE = 'https://api.paystack.co';
const REGISTRATION_FEE_KOBO = 200000; // KES 2000

module.exports.registerCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone, vehicle, documents, paymentReference } = req.body;

  // Verify registration payment (skip only in explicit dev mode with env flag)
  if (process.env.SKIP_PAYMENT_CHECK !== 'true') {
    if (!paymentReference) {
      return res.status(400).json({ message: "Payment required to register. Please complete the KES 2,000 registration fee." });
    }
    try {
      const verify = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${paymentReference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const tx = verify.data.data;
      if (tx.status !== 'success') {
        return res.status(400).json({ message: "Payment not successful. Please complete payment before registering." });
      }
      if (tx.amount < REGISTRATION_FEE_KOBO) {
        return res.status(400).json({ message: "Incorrect payment amount. Registration fee is KES 2,000." });
      }
    } catch (payErr) {
      console.error('[Register] Payment verification error:', payErr.message);
      return res.status(400).json({ message: "Could not verify payment. Please try again or contact support." });
    }
  }

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

  // Upload KYC photos to kyc-documents storage bucket and save record
  if (captain) {
    let nationalIdUrl = '';
    let licenseUrl = '';
    let selfieUrl = '';

    const uploadBase64 = async (dataUrl, filename) => {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const ext = dataUrl.match(/^data:image\/(\w+);/)?.[1] || 'jpg';
      const storagePath = `${captain._id}/${filename}.${ext}`;
      await supabase.storage.from('kyc-documents').upload(storagePath, buffer, { contentType: `image/${ext}`, upsert: true });
      return storagePath;
    };

    try {
      if (documents?.nationalIdPhoto) nationalIdUrl = await uploadBase64(documents.nationalIdPhoto, 'national_id');
      if (documents?.licensePhoto)    licenseUrl    = await uploadBase64(documents.licensePhoto,    'license');
      if (documents?.selfiePhoto)     selfieUrl     = await uploadBase64(documents.selfiePhoto,     'selfie');
    } catch (uploadErr) {
      console.error('[KYC] Photo upload error:', uploadErr.message);
    }

    // Save KYC record to kyc_documents table for admin review
    await supabase.from('kyc_documents').upsert({
      user_id: captain._id,
      plate_number: vehicle.number,
      national_id_url: nationalIdUrl,
      license_url: licenseUrl,
      selfie_url: selfieUrl,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }).catch((e) => console.error('[KYC] DB record error:', e.message));

    // Save payment reference on the captain record
    if (paymentReference) {
      await supabase.from('qr_captains').update({
        registration_payment_ref: paymentReference,
        registration_payment_paid: true,
      }).eq('id', captain._id)
        .catch((e) => console.error('[KYC] Payment ref save error:', e.message));
    }
  }

  res.status(201).json({
    message: "Registration successful! Please check your email to verify your account before logging in.",
  });
});

module.exports.verifyFace = asyncHandler(async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ message: "Image required", faceDetected: false });

  try {
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_MAPS_API}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'FACE_DETECTION', maxResults: 5 }],
          }],
        }),
      }
    );

    const visionData = await visionRes.json();
    const faces = visionData.responses?.[0]?.faceAnnotations || [];

    if (faces.length === 0) {
      return res.json({ faceDetected: false, message: "No face detected. Please ensure your face is clearly visible and well-lit." });
    }

    const face = faces[0];
    const blurry = face.blurredLikelihood === 'VERY_LIKELY' || face.blurredLikelihood === 'LIKELY';
    if (blurry) {
      return res.json({ faceDetected: false, message: "Image is blurry. Please take the photo in better lighting." });
    }

    res.json({ faceDetected: true, faceCount: faces.length });
  } catch (err) {
    console.error('[Vision] Face detection error:', err.message);
    // Fail open — accept the selfie for manual review if Vision API is unavailable
    res.json({ faceDetected: true, message: "Verification service unavailable; selfie accepted for manual review." });
  }
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
