
const express = require("express");
const path = require("path");

const Registration = require("../models/Registration");
const emailTransporter = require("../config/email");

const router = express.Router();

const phoneLengths = {
  "+234": 10, "+1": 10, "+44": 10, "+233": 9,
  "+254": 9, "+27": 9, "+91": 10, "+61": 9,
  "+353": 9, "+256": 9, "+255": 9, "+250": 9,
  "+966": 9, "+971": 9, "+49": 10, "+33": 9,
  "+81": 10, "+65": 8, "+63": 10, "+92": 10,
  "+62": 10, "+55": 11, "+52": 10, "+86": 11,
};

const descriptions = [
  "Student",
  "Working professional",
  "Business owner / Entrepreneur",
  "Graduate",
  "Job seeker",
  "Freelancer",
  "Content creator",
  "Other",
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createReference() {
  return `MNT-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

async function sendEnrollmentEmail(registration) {
  const whatsappLink =
    "https://chat.whatsapp.com/I8A8jV2k6NrKOEat54T5qB?s=cl&p=a&mlu=4&ilr=4";

  const programmeDetails = `
LORI'S TIMELINE — FEBRUARY 2027 COHORT

Hello ${registration.name},

Congratulations! Your payment has been confirmed, and your place in the Lori's Timeline Video Editing Mentorship — February 2027 Cohort is secured.

PAYMENT & ENROLMENT
Payment Status: Confirmed
Enrolment Status: Successful
Cohort: February 2027

YOUR PROGRAMME DETAILS
Start Date: Monday, February 1, 2027
Duration: 4 weeks
Class Days: Mondays and Fridays
Class Time: 8:00 PM WAT
Class Duration: 60–90 minutes
Platform: Google Meet or Zoom
Meeting Link: To be communicated before each session.

YOUR WEEKLY SCHEDULE

MONDAY — Live Class
Learn editing concepts, techniques, and practical demonstrations.

TUESDAY — Personal Practice
Practise the techniques covered in class.

WEDNESDAY — Assignment Submission
Complete and submit your weekly assignment by the communicated deadline.

THURSDAY — Feedback & Q&A
Review common mistakes, ask questions, and receive guidance.

FRIDAY — Practical Workshop
Take part in guided exercises and hands-on editing sessions.

SATURDAY — Independent Practice
Continue practising and exploring additional tasks.

SUNDAY — Rest Day
No formal class activities.

WHAT YOUR MENTORSHIP INCLUDES
- Weekly assignments and assessments.
- One-on-one mentorship session.
- Final video-editing project.
- Portfolio development and professional guidance.
- Graduation, certificates, and student recognition.

HOW TO PREPARE
- Mark your calendar for the start date and scheduled classes.
- Attend sessions regularly and participate actively.
- Complete assignments on time.
- Practise consistently and apply feedback.

JOIN THE WHATSAPP GROUP
Join the official Lori's Timeline WhatsApp Group for important announcements, programme updates, and further instructions.

${whatsappLink}

Please watch your inbox for meeting links, assignment deadlines, and individual mentorship details.

We look forward to helping you develop your editing skills, build your portfolio, and grow in confidence.

Welcome aboard!

Best regards,
Lori's Timeline Team
Where Vision Meets Precision.
`;

  await emailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to: registration.email,
    subject: "Payment Confirmed & Welcome to Lori's Timeline | February 2027 Cohort",

    text: programmeDetails,

    html: `
      <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;color:#333;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">

          <div style="background:#222;padding:28px;text-align:center;">
            <img src="cid:lorisTimelineLogo" alt="Lori's Timeline Logo" width="70"
              style="display:block;margin:0 auto 12px;border:0;">
            <h1 style="color:#ff00ff;margin:0;">LORI'S TIMELINE</h1>
            <p style="color:#fff;">YOUR JOURNEY STARTS HERE</p>
          </div>

          <div style="padding:28px;line-height:1.7;">
            <h2 style="color:#ff00ff;">PAYMENT CONFIRMED</h2>
            <h3>Welcome to Lori's Timeline!</h3>

            <p>Hello ${escapeHtml(registration.name)},</p>

            <p>Congratulations! Your payment has been confirmed, and your place in the
              <strong>Lori's Timeline Video Editing Mentorship — February 2027 Cohort</strong>
              is secured.</p>

            <p>We look forward to four weeks of learning, practical exercises, feedback, and creative growth.</p>

            <div style="background:#fff8e5;padding:18px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;">PAYMENT &amp; ENROLMENT</h3>
              <p><strong>Payment Status:</strong> Confirmed</p>
              <p><strong>Enrolment Status:</strong> <span style="color:#ff00ff;">SUCCESSFUL</span></p>
              <p><strong>Cohort:</strong> February 2027</p>
            </div>

            <h3 style="color:#ff00ff;">YOUR PROGRAMME DETAILS</h3>
            <ul>
              <li><strong>Start Date:</strong> Monday, February 1, 2027</li>
              <li><strong>Duration:</strong> 4 weeks</li>
              <li><strong>Class Days:</strong> Mondays and Fridays</li>
              <li><strong>Class Time:</strong> 8:00 PM WAT</li>
              <li><strong>Class Duration:</strong> 60–90 minutes</li>
              <li><strong>Class Platform:</strong> Google Meet or Zoom</li>
              <li><strong>Meeting Link:</strong> To be communicated before each session</li>
            </ul>

            <h3 style="color:#ff00ff;">YOUR WEEKLY SCHEDULE</h3>
            <p><strong>MONDAY — Live Class</strong><br>
            Learn editing concepts, techniques, and practical demonstrations.</p>

            <p><strong>TUESDAY — Personal Practice</strong><br>
            Practise the techniques covered in class.</p>

            <p><strong>WEDNESDAY — Assignment Submission</strong><br>
            Complete and submit your weekly assignment by the communicated deadline.</p>

            <p><strong>THURSDAY — Feedback &amp; Q&amp;A</strong><br>
            Review common mistakes, ask questions, and receive guidance.</p>

            <p><strong>FRIDAY — Practical Workshop</strong><br>
            Take part in guided exercises and hands-on editing sessions.</p>

            <p><strong>SATURDAY — Independent Practice</strong><br>
            Continue practising and exploring additional tasks.</p>

            <p><strong>SUNDAY — Rest Day</strong><br>
            No formal class activities.</p>

            <h3 style="color:#ff00ff;">WHAT YOUR MENTORSHIP INCLUDES</h3>
            <ul>
              <li>Weekly assignments and assessments.</li>
              <li>One-on-one mentorship session.</li>
              <li>Final video-editing project.</li>
              <li>Portfolio development and professional guidance.</li>
              <li>Graduation, certificates, and student recognition.</li>
            </ul>

            <h3 style="color:#ff00ff;">HOW TO PREPARE</h3>
            <ul>
              <li>Mark your calendar for the start date and scheduled classes.</li>
              <li>Attend sessions regularly and participate actively.</li>
              <li>Complete assignments on time.</li>
              <li>Practise consistently and apply feedback.</li>
            </ul>

            <div style="background:#222;padding:22px;border-radius:10px;text-align:center;margin:26px 0;">
              <h3 style="color:#fff;margin-top:0;">JOIN THE WHATSAPP GROUP</h3>
              <p style="color:#fff;">Join the official Lori's Timeline WhatsApp Group for important announcements, programme updates, and further instructions.</p>
              <a href="${whatsappLink}"
                style="display:inline-block;background:#ff00ff;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;">
                Join the Lori's Timeline WhatsApp Group
              </a>
            </div>

            <p>Please watch your inbox for meeting links, assignment deadlines, and individual mentorship details.</p>

            <p>We look forward to helping you develop your editing skills, build your portfolio, and grow in confidence.</p>

            <p>Welcome aboard!</p>

            <p>Best regards,<br>
            <strong>Lori's Timeline Team</strong><br>
            <em>Where Vision Meets Precision.</em></p>
          </div>

          <div style="background:#222;color:#fff;padding:18px;text-align:center;font-size:12px;">
            Copyright &copy; ${new Date().getFullYear()} Lori's Timeline. All rights reserved.
          </div>
        </div>
      </div>
    `,

    attachments: [{
      filename: "lt-logo.png",
      path: path.join(__dirname, "../assets/lt-logo.png"),
      cid: "lorisTimelineLogo",
      contentDisposition: "inline",
      contentType: "image/png",
    }],
  });
}


// Save a registration as pending and return checkout details.
router.post("/", async (req, res) => {
  try {
    const {
      name, email, confirmEmail, countryCode, phone, description, goal,
    } = req.body;

    if (
      !name || !email || !confirmEmail || !countryCode ||
      !phone || !description || !goal
    ) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanConfirmEmail = String(confirmEmail).trim().toLowerCase();
    const cleanCountryCode = String(countryCode).trim();
    const cleanPhone = String(phone).trim();
    const cleanDescription = String(description).trim();
    const cleanGoal = String(goal).trim();

    if (!/^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/.test(cleanName) || cleanName.length > 120) {
      return res.status(400).json({
        message: "Please enter your first and last name.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (cleanEmail !== cleanConfirmEmail) {
      return res.status(400).json({
        message: "Email addresses do not match.",
      });
    }

    const expectedLength = phoneLengths[cleanCountryCode];

    if (!expectedLength) {
      return res.status(400).json({
        message: "Please select a supported country code.",
      });
    }

    if (!/^\d+$/.test(cleanPhone) || cleanPhone.length !== expectedLength) {
      return res.status(400).json({
        message: `Enter exactly ${expectedLength} digits for the selected country.`,
      });
    }

    if (!descriptions.includes(cleanDescription)) {
      return res.status(400).json({
        message: "Please select what best describes you.",
      });
    }

    // Reject any repeat registration for the same normalized email.
    const existingRegistration = await Registration.findOne({ email: cleanEmail });
    if (existingRegistration) {
      return res.status(409).json({
        message: existingRegistration.status === "enrolled"
          ? "This email is already enrolled."
          : "This email already has a registration.",
      });
    }

    let registration;
    if (!registration) {
      registration = await Registration.create({
        name: cleanName,
        email: cleanEmail,
        countryCode: cleanCountryCode,
        phone: cleanPhone,
        description: cleanDescription,
        goal: cleanGoal,
        paymentReference: createReference(),
        status: "pending",
      });

      // Optional registration-received email; this is not an enrolment confirmation.
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: registration.email,
          subject: "Registration received — Lori's Timeline",
          text: `Hi ${registration.name},

We received your mentorship registration. Your status is pending until payment is confirmed.

Please continue to checkout to complete payment.

Lori's Timeline`,
        });
      } catch (emailError) {
        console.error("Registration email failed:", emailError.message);
      }
    }

    if (!registration.paymentReference) {
  registration.paymentReference = createReference();
  await registration.save();
}

    return res.status(201).json({
      message: "Registration saved as pending.",
      registrationId: registration._id,
      paymentReference: registration.paymentReference,
      status: registration.status,
      amount: 15000,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email or payment reference is already registered.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

// Development-only simulation: emails a clearly labelled demo notice.
// It never changes the registration status or claims real payment was verified.
router.post("/:id/simulate-payment", async (req, res) => {
  const { outcome } = req.body || {};
  if (!["success", "failed", "abandoned"].includes(outcome)) {
    return res.status(400).json({ message: "Choose a valid simulation outcome." });
  }

  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found. Please register again." });
    }

    const subject = outcome === "success"
      ? "DEMO ONLY: Simulated payment result — Lori's Timeline"
      : "DEMO ONLY: Checkout simulation result — Lori's Timeline";
    const message = outcome === "success"
      ? `Hello ${registration.name},

This is a TEST EMAIL from Lori's Timeline.

You selected “Simulate successful payment” on the website. This was only a demonstration: no money was charged, your registration is still pending, and no real payment has been verified. You are NOT enrolled yet.

Your registration reference: ${registration.paymentReference}

Lori's Timeline Team`
      : `Hello ${registration.name},

This is a TEST EMAIL from Lori's Timeline.

You selected the “${outcome === "failed" ? "Simulate failed payment" : "Close checkout"}” demo option. No money was charged and your registration remains pending.

Your registration reference: ${registration.paymentReference}

Lori's Timeline Team`;

    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: registration.email,
      subject,
      text: message,
    });

    return res.json({ message: "Demo email sent.", emailSent: true, demoOnly: true });
  } catch (error) {
    console.error("Demo payment email failed:", error.message);
    return res.status(502).json({
      message: `The demo email could not be sent: ${error.message}. Check the Resend sender/domain configuration in Render.`,
      emailSent: false,
    });
  }
});
 
module.exports = router;
