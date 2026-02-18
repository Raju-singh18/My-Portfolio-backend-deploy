const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['page_view', 'project_view', 'blog_view', 'contact_form', 'resume_download', 'social_click']
  },
  page: String, // page URL or identifier
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  userAgent: String,
  ipAddress: String,
  referrer: String,
  country: String,
  city: String,
  device: String, // mobile, desktop, tablet
  browser: String,
  os: String,
  sessionId: String,
  metadata: mongoose.Schema.Types.Mixed // additional data
}, { timestamps: true });

// Index for better query performance
analyticsSchema.index({ type: 1, createdAt: -1 });
analyticsSchema.index({ projectId: 1, createdAt: -1 });
analyticsSchema.index({ blogId: 1, createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);