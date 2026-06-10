const express = require("express");
const router = express.Router();
const mailController = require("../controllers/mail.controller");

// No auth required — just needs email + userType in body
router.post("/resend-verification", mailController.sendVerificationEmail);

router.post("/:userType/reset-password", mailController.forgotPassword);

module.exports = router;
