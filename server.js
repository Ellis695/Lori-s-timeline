const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

dotenv.config();

const registrationRoute = require("./routes/registration");
const adminRoute = require("./routes/admin");

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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Lori's Timeline backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
