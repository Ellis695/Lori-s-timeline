
const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      match: [/^[A-Za-z ]+$/, "Name must contain letters and spaces only"],
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
    },

    countryCode: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{7,15}$/, "Phone number must contain 7 to 15 digits"],
    },

    description: {
      type: String,
      required: true,
      enum: [
        "Student",
        "Working professional",
        "Business owner / Entrepreneur",
        "Graduate",
        "Job seeker",
        "Freelancer",
        "Content creator",
        "Other",
      ],
    },

    goal: {
      type: String,
      required: true,
      trim: true,
    },

    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "enrolled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
