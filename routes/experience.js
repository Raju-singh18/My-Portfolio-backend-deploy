const express = require('express');
const Experience = require('../models/Experience');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all visible experiences (public)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isVisible: true };
    
    if (type) {
      filter.type = type;
    }
    
    const experiences = await Experience.find(filter)
      .sort({ order: 1, startDate: -1 });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get experiences grouped by type (public)
router.get('/grouped', async (req, res) => {
  try {
    const experiences = await Experience.find({ isVisible: true })
      .sort({ order: 1, startDate: -1 });
    
    const grouped = experiences.reduce((acc, exp) => {
      if (!acc[exp.type]) {
        acc[exp.type] = [];
      }
      acc[exp.type].push(exp);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all experiences for admin
router.get('/admin', auth, async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ order: 1, startDate: -1 });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single experience
router.get('/:id', async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    res.json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create experience (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const experience = new Experience(req.body);
    await experience.save();
    res.status(201).json(experience);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update experience (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const experience = await Experience.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    res.json(experience);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete experience (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const experience = await Experience.findByIdAndDelete(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
