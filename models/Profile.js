const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  title: { type: String, required: true }, // e.g., "Full Stack Developer"
  bio: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  location: String,
  website: String,
  profileImage: String,
  resumeUrl: String,
  
  // Social Links
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    instagram: String,
    youtube: String,
    portfolio: String
  },
  
  // Professional Info
  yearsOfExperience: Number,
  currentPosition: String,
  currentCompany: String,
  availability: {
    type: String,
    enum: ['available', 'busy', 'not-available'],
    default: 'available'
  },
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  
  // Settings
  isVisible: { type: Boolean, default: true },
  allowContact: { type: Boolean, default: true },
  showEmail: { type: Boolean, default: false },
  showPhone: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
