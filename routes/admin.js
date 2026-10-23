const express = require("express");
const crypto = require("crypto");
const Registration = require("../models/Registration");
const emailTransporter = require("../config/email");

const router = express.Router();
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(value).digest("hex");
}

function createToken(username) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  })).toString("base64url");
  return payload + "." + sign(payload);
}

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !process.env.ADMIN_SESSION_SECRET ||
      !safeEqual(signature, sign(payload))) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.username || session.expiresAt < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Your session expired. Please sign in again." });
    }
    req.admin = session;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid admin session." });
  }
}

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return res.status(503).json({ message: "Admin login is not configured on the server yet." });
  }
  if (!safeEqual(username, process.env.ADMIN_USERNAME) ||
      !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ message: "Incorrect username or password." });
  }
  return res.json({ token: createToken(process.env.ADMIN_USERNAME), expiresIn: TOKEN_TTL_SECONDS });
});

router.get("/registrations", requireAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .select("name email phone countryCode goal paymentReference status createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    const enrolled = registrations.filter((item) => item.status === "enrolled");
    const pending = registrations.filter((item) => item.status === "pending");
    res.json({
      stats: {
        total: registrations.length,
        enrolled: enrolled.length,
        pending: pending.length,
        revenue: enrolled.length * 15000
      },
      registrations
    });
  } catch (error) {
    console.error("Admin registrations error:", error.message);
    res.status(500).json({ message: "Could not load registrations." });
  }
});

router.patch("/registrations/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["pending", "enrolled"].includes(status)) {
      return res.status(400).json({ message: "Choose a valid registration status." });
    }

    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: "Registration not found." });

    const previousStatus = registration.status;
    registration.status = status;
    await registration.save();

    let emailSent = null;
    if (status === "enrolled" && previousStatus !== "enrolled") {
      try {
        // Use the existing confirmation-email implementation only after an admin confirms payment.
        const whatsappLink = "https://chat.whatsapp.com/I8A8jV2k6NrKOEat54T5qB?s=cl&p=a&mlu=4&ilr=4";
        const emailText = `Hello ${registration.name},

Your payment has been manually confirmed by Lori's Timeline. Your place in the February 2027 Video Editing Mentorship cohort is secured.

Start date: Monday, February 1, 2027
Classes: Mondays and Fridays at 8:00 PM WAT
Join the WhatsApp group: ${whatsappLink}

Best regards,
Lori's Timeline Team`;
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: registration.email,
          subject: "Payment Confirmed & Welcome to Lori's Timeline | February 2027 Cohort",
          text: emailText
        });
        emailSent = true;
      } catch (emailError) {
        emailSent = false;
        console.error("Manual enrolment email failed:", emailError.message);
      }
    }

    res.json({
      message: status === "enrolled" ? "Payment marked as confirmed by admin." : "Registration returned to pending.",
      status: registration.status,
      emailSent
    });
  } catch (error) {
    console.error("Admin status update error:", error.message);
    res.status(500).json({ message: "Could not update registration status." });
  }
});

module.exports = router;
