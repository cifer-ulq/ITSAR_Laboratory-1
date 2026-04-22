/**
 * Course Controller
 *
 * Handles HTTP request/response logic for course endpoints.
 * Delegates data operations to the course model.
 */

const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');

/** POST /courses — Create a new course. */
const createCourse = (req, res) => {
  const { name, description, credits } = req.body;

  const course = courseModel.create({ name, description, credits });
  res.status(201).json({ message: 'Course created successfully', data: course });
};

/** GET /courses — Get all courses. */
const getAllCourses = (req, res) => {
  const courses = courseModel.getAll();
  res.json({ message: 'Courses retrieved successfully', data: courses, count: courses.length });
};

/** GET /courses/:id — Get a single course by ID. */
const getCourseById = (req, res) => {
  const course = courseModel.getById(req.params.id);

  if (!course) {
    return res.status(404).json({ error: `Course with ID "${req.params.id}" not found` });
  }

  res.json({ message: 'Course retrieved successfully', data: course });
};

/** PUT /courses/:id — Update an existing course. */
const updateCourse = (req, res) => {
  const { id } = req.params;
  const { name, description, credits } = req.body;

  const existing = courseModel.getById(id);
  if (!existing) {
    return res.status(404).json({ error: `Course with ID "${id}" not found` });
  }

  const updated = courseModel.update(id, { name, description, credits });
  res.json({ message: 'Course updated successfully', data: updated });
};

/** DELETE /courses/:id — Delete a course and related enrollments. */
const deleteCourse = (req, res) => {
  const { id } = req.params;

  const deleted = courseModel.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: `Course with ID "${id}" not found` });
  }

  // Business rule: deleting a course also removes related enrollments
  const removedEnrollments = enrollmentModel.removeByCourseId(id);

  res.json({
    message: 'Course deleted successfully',
    data: deleted,
    enrollmentsRemoved: removedEnrollments,
  });
};

module.exports = { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse };
