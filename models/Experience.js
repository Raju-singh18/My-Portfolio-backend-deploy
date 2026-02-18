const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: Date, // null for current position
  isCurrent: { type: Boolean, default: false },
  description: { type: String, required: true },
  technologies: [String],
  achievements: [String],
  type: { 
    type: String, 
    enum: ['work', 'education', 'volunteer', 'certification'],
    default: 'work'
  },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Experience', experienceSchema);