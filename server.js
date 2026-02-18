// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');
// const projectRoutes = require('./routes/projects');
// const contactRoutes = require('./routes/contact');
// const skillRoutes = require('./routes/skills');
// const experienceRoutes = require('./routes/experience');
// const blogRoutes = require('./routes/blog');
// const profileRoutes = require('./routes/profile');
// const analyticsRoutes = require('./routes/analytics');
// const uploadRoutes = require('./routes/upload');
// const { Server } = require('http');

// const app = express();
// const URL = process.env.API_URL;


// // Middleware
// app.use(cors({
//   origin: [URL, 'http://localhost:5174', 'http://localhost:3000'],
//   credentials: true
// }));
// app.use(express.json());

// // Serve static files from uploads directory with proper headers
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
//   setHeaders: (res, path) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//   }
// }));

// // Test route to check uploads directory
// app.get('/test-uploads', (req, res) => {
//   const fs = require('fs');
//   const uploadsPath = path.join(__dirname, 'uploads');
  
//   try {
//     if (!fs.existsSync(uploadsPath)) {
//       return res.json({ message: 'Uploads directory does not exist', path: uploadsPath });
//     }
    
//     const files = fs.readdirSync(uploadsPath, { withFileTypes: true });
//     const structure = {};
    
//     files.forEach(file => {
//       if (file.isDirectory()) {
//         const subPath = path.join(uploadsPath, file.name);
//         const subFiles = fs.readdirSync(subPath);
//         structure[file.name] = subFiles.map(f => ({
//           name: f,
//           url: `http://localhost:5000/uploads/${file.name}/${f}`
//         }));
//       } else {
//         if (!structure.root) structure.root = [];
//         structure.root.push({
//           name: file.name,
//           url: `http://localhost:5000/uploads/${file.name}`
//         });
//       }
//     });
    
//     res.json({
//       message: 'Uploads directory structure',
//       path: uploadsPath,
//       structure,
//       testUrls: Object.values(structure).flat().slice(0, 5)
//     });
//   } catch (error) {
//     res.json({ error: error.message, path: uploadsPath });
//   }
// });

// // Image proxy route for testing
// app.get('/api/image-proxy/:type/:filename', (req, res) => {
//   const { type, filename } = req.params;
//   const imagePath = path.join(__dirname, 'uploads', type, filename);
  
//   if (require('fs').existsSync(imagePath)) {
//     res.sendFile(imagePath);
//   } else {
//     res.status(404).json({ error: 'Image not found', path: imagePath });
//   }
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/contact', contactRoutes);
// app.use('/api/skills', skillRoutes);
// app.use('/api/experience', experienceRoutes);
// app.use('/api/blog', blogRoutes);
// app.use('/api/profile', profileRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/upload', uploadRoutes);

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });

// module.exports = app;



const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const contactRoutes = require("./routes/contact");
const skillRoutes = require("./routes/skills");
const experienceRoutes = require("./routes/experience");
const blogRoutes = require("./routes/blog");
const profileRoutes = require("./routes/profile");
const analyticsRoutes = require("./routes/analytics");
const uploadRoutes = require("./routes/upload");

const app = express();

/* =========================
   CORS Configuration
========================= */
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   Health Check Route
========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running successfully 🚀",
  });
});

/* =========================
   API Routes
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);

/* =========================
   MongoDB Connection
========================= */
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// Connect on every request (Serverless safe)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

/* =========================
   Export App (NO app.listen)
========================= */
module.exports = app;
