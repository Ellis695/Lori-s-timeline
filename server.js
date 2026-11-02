const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

dotenv.config();

const registrationRoute = require("./routes/registration");
const adminRoute = require("./routes/admin");
const emailTransporter = require("./config/email");

mongoose
  .connect(process.env.MONGODB_URI, { dbName: "loris-timeline" })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection failed:", error.message));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.send("Lori's Timeline backend is running.");
});

app.use("/api/registrations", registrationRoute);
app.use("/api/admin", adminRoute);


app.post("/api/contact", async (req, res) => {
  const Enquiry = require("./models/Enquiry");
  const { name, email, phone, enquiryType, project, details, budget, deliveryDate } = req.body || {};
  const cleanName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanType = typeof enquiryType === "string" ? enquiryType.trim() : "";
  const cleanProject = typeof project === "string" ? project.trim() : "";
  const cleanDetails = typeof details === "string" ? details.trim() : "";
  const cleanBudget = typeof budget === "string" ? budget.trim() : "";
  const cleanDeliveryDate = typeof deliveryDate === "string" ? deliveryDate.trim() : "";
  const wordCount = cleanDetails.split(/\s+/).filter(Boolean).length;
  const phoneLengths = {
    "+234":10, "+1":10, "+44":10, "+233":9, "+254":9, "+27":9,
    "+91":10, "+61":9, "+353":9, "+256":9, "+255":9, "+250":9,
    "+966":9, "+971":9, "+49":10, "+33":9, "+81":10, "+65":8,
    "+63":10, "+92":10, "+62":10, "+55":11, "+52":10, "+86":11
  };
  const phoneMatch = cleanPhone.match(/^(\\+\\d{1,3}) (\\d+)$/);
  const validPhone = !cleanPhone || Boolean(
    phoneMatch && phoneLengths[phoneMatch[1]] === phoneMatch[2].length
  );

  if (!/^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/.test(cleanName) || cleanName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254 ||
      (cleanPhone && (cleanPhone.length > 30 || !validPhone)) ||
      !["Request a Quote", "General Project Enquiry"].includes(cleanType) ||
      !cleanProject || cleanProject.length > 120 || wordCount < 5 || cleanDetails.length > 5000 ||
      cleanBudget.length > 100 || cleanDeliveryDate.length > 40) {
    return res.status(400).json({ message: "Please check your details. Describe your project in at least five words." });
  }

  try {
    const enquiry = await Enquiry.create({
      name: cleanName, email: cleanEmail, phone: cleanPhone,
      enquiryType: cleanType, service: cleanProject, details: cleanDetails,
      budget: cleanBudget, deliveryDate: cleanDeliveryDate, status: "New"
    });

    let emailSent = false;
    try {
      await emailTransporter.sendMail({
        to: "loristimeline@gmail.com",
        replyTo: cleanEmail,
        subject: `Website enquiry — ${cleanType} — ${cleanName}`,
        text: `A new enquiry was submitted through Lori's Timeline.

Enquiry ID: ${enquiry._id}
Type: ${cleanType}
Name: ${cleanName}
Email: ${cleanEmail}
Phone: ${cleanPhone || "Not provided"}
Service: ${cleanProject}
Budget: ${cleanBudget || "Not provided"}
Expected delivery: ${cleanDeliveryDate || "Not provided"}

Project details:
${cleanDetails}`,
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Contact enquiry email failed:", emailError.message);
    }

    return res.status(201).json({
      message: "Your enquiry has been received successfully.",
      enquiryId: enquiry._id,
      emailNotificationSent: emailSent
    });
  } catch (error) {
    console.error("Contact enquiry save failed:", error.message);
    return res.status(500).json({ message: "We couldn't save your enquiry right now. Please try again later." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Lori's Timeline backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
