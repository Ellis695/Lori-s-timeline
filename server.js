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
  const { name, email, project, details } = req.body || {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim() : "";
  const cleanProject = typeof project === "string" ? project.trim() : "";
  const cleanDetails = typeof details === "string" ? details.trim() : "";
  const detailsWordCount = cleanDetails.split(/\\s+/).filter(Boolean).length;

  if (!/^\p{L}[\p{L}\p{M}]*(?:[ '\u2019-]\p{L}[\p{L}\p{M}]*)+$/u.test(cleanName) || cleanName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254 ||
      !cleanProject || cleanProject.length > 120 || detailsWordCount < 20 || cleanDetails.length > 5000) {
    return res.status(400).json({ message: "Please enter your full name (first and last name) and check your other details." });
  }

  try {
    await emailTransporter.sendMail({
      to: "loristimeline@gmail.com",
      replyTo: cleanEmail,
      subject: `Website enquiry — ${cleanName}`,
      text: `A new enquiry was submitted through Lori's Timeline.\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nService: ${cleanProject}\n\nProject details:\n${cleanDetails || "Not provided"}`,
    });
    return res.json({ message: "Your enquiry has been sent successfully." });
  } catch (error) {
    console.error("Contact enquiry email failed:", error.message);
    return res.status(502).json({
      message: "We couldn't send your enquiry right now. Please try again later or email loristimeline@gmail.com directly."
    });
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
