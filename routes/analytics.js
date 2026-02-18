const express = require('express');
const Analytics = require('../models/Analytics');
const Project = require('../models/Project');
const Blog = require('../models/Blog');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const router = express.Router();

// Track page view (public)
router.post('/track', async (req, res) => {
  try {
    const {
      type,
      page,
      projectId,
      blogId,
      metadata
    } = req.body;
    
    const analytics = new Analytics({
      type,
      page,
      projectId,
      blogId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      referrer: req.get('Referrer'),
      metadata
    });
    
    await analytics.save();
    res.status(201).json({ message: 'Event tracked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard analytics (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Total counts
    const totalProjects = await Project.countDocuments();
    const totalBlogs = await Blog.countDocuments({ isPublished: true });
    const totalMessages = await Contact.countDocuments();
    
    // Analytics for the period
    const periodFilter = { createdAt: { $gte: startDate } };
    
    const pageViews = await Analytics.countDocuments({
      ...periodFilter,
      type: 'page_view'
    });
    
    const projectViews = await Analytics.countDocuments({
      ...periodFilter,
      type: 'project_view'
    });
    
    const blogViews = await Analytics.countDocuments({
      ...periodFilter,
      type: 'blog_view'
    });
    
    const resumeDownloads = await Analytics.countDocuments({
      ...periodFilter,
      type: 'resume_download'
    });
    
    const contactForms = await Analytics.countDocuments({
      ...periodFilter,
      type: 'contact_form'
    });
    
    // Top projects by views
    const topProjects = await Analytics.aggregate([
      {
        $match: {
          ...periodFilter,
          type: 'project_view',
          projectId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$projectId',
          views: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: '$project'
      },
      {
        $project: {
          title: '$project.title',
          views: 1
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Top blog posts by views
    const topBlogs = await Analytics.aggregate([
      {
        $match: {
          ...periodFilter,
          type: 'blog_view',
          blogId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$blogId',
          views: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: '_id',
          as: 'blog'
        }
      },
      {
        $unwind: '$blog'
      },
      {
        $project: {
          title: '$blog.title',
          views: 1
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Daily views for chart
    const dailyViews = await Analytics.aggregate([
      {
        $match: {
          ...periodFilter,
          type: { $in: ['page_view', 'project_view', 'blog_view'] }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          views: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    res.json({
      summary: {
        totalProjects,
        totalBlogs,
        totalMessages,
        pageViews,
        projectViews,
        blogViews,
        resumeDownloads,
        contactForms
      },
      topProjects,
      topBlogs,
      dailyViews: dailyViews.map(item => ({
        date: item._id.date,
        views: item.views
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed analytics (admin only)
router.get('/detailed', auth, async (req, res) => {
  try {
    const { 
      type, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const filter = {};
    
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const analytics = await Analytics.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('projectId', 'title')
      .populate('blogId', 'title');
    
    const total = await Analytics.countDocuments(filter);
    
    res.json({
      analytics,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
