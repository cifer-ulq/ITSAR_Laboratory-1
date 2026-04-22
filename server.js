/**
 * Student Course System - Main Entry Point (Monolithic — Lab 1 Part A)
 *
 * A simple REST API for managing students, courses, and enrollments.
 * Uses Express.js with in-memory data storage.
 * All three domains (students, courses, enrollments) live in ONE process.
 */

const express = require('express');
const path = require('path');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Global Middleware ---------------

// Parse incoming JSON request bodies
app.use(express.json());

// Serve static frontend files from the public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Simple request logger — prints method, url, and timestamp for every request
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --------------- Routes ---------------

app.use('/students', studentRoutes);
app.use('/courses', courseRoutes);
app.use('/enrollments', enrollmentRoutes);

// Health check / root
app.get('/', (req, res) => {
  res.json({
    message: 'Student Course System API is running',
    endpoints: {
      students: '/students',
      courses: '/courses',
      enrollments: '/enrollments',
    },
  });
});

// --------------- Error Handling ---------------

// Catch 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// --------------- Start Server ---------------

app.listen(PORT, () => {
  console.log(`Monolithic server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});

module.exports = app;
