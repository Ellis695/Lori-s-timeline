const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 30, default: "" },
  enquiryType: { type: String, required: true, enum: ["Request a Quote", "General Project Enquiry"] },
  service: { type: String, required: true, trim: true, maxlength: 120 },
  details: { type: String, required: true, trim: true, maxlength: 5000 },
  budget: { type: String, trim: true, maxlength: 100, default: "" },
  deliveryDate: { type: String, trim: true, maxlength: 40, default: "" },
  status: {
    type: String,
    enum: ["New", "Contacted", "Quoted", "Accepted", "Declined"],
    default: "New"
  }
}, { timestamps: true });

module.exports = mongoose.model("Enquiry", enquirySchema);
