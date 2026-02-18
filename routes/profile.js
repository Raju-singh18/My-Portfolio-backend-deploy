const express = require('express');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const router = express.Router();

// Get public profile (public)
router.get('/', async (req, res) => {
  try {
    const profile = await Profile.findOne({ isVisible: true });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Remove sensitive fields for public view
    const publicProfile = profile.toObject();
    if (!profile.showEmail) delete publicProfile.email;
    if (!profile.showPhone) delete publicProfile.phone;
    
    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get full profile for admin
router.get('/admin', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne();
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update profile (admin only)
router.post('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne();
    
    if (profile) {
      // Update existing profile
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      // Create new profile
      profile = new Profile(req.body);
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update specific profile fields (admin only)
router.patch('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload resume (admin only)
router.post('/resume', auth, async (req, res) => {
  try {
    const { resumeUrl } = req.body;
    
    const profile = await Profile.findOneAndUpdate(
      {},
      { resumeUrl },
      { new: true, upsert: true }
    );
    
    res.json({ message: 'Resume updated successfully', resumeUrl: profile.resumeUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resume download link (public)
router.get('/resume/download', async (req, res) => {
  try {
    const profile = await Profile.findOne({ isVisible: true });
    if (!profile || !profile.resumeUrl) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Track download analytics
    const Analytics = require('../models/Analytics');
    const analytics = new Analytics({
      type: 'resume_download',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      referrer: req.get('Referrer')
    });
    await analytics.save();
    
    res.json({ downloadUrl: profile.resumeUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
