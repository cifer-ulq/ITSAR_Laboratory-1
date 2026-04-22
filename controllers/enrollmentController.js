/**
 * Enrollment Controller
 *
 * Handles HTTP request/response logic for enrollment endpoints.
 * Enforces business rules: student and course must exist, no duplicates.
 * NOTE: In the monolithic version all three models are directly imported —
 * no HTTP calls are needed (contrast with the microservices version).
 */

const enrollmentModel = require('../models/enrollmentModel');
const studentModel = require('../models/studentModel');
const courseModel = require('../models/courseModel');

/**
 * POST /enrollments — Enroll a student in a course.
 *
 * Business Rules:
 *   - Student must exist
 *   - Course must exist
 *   - No duplicate enrollment (same student + same course)
 */
const createEnrollment = (req, res) => {
  const { studentId, courseId } = req.body;

  // Verify student exists (direct model call — no HTTP needed in monolith)
  const student = studentModel.getById(studentId);
  if (!student) {
    return res.status(404).json({ error: `Student with ID "${studentId}" not found` });
  }

  // Verify course exists
  const course = courseModel.getById(courseId);
  if (!course) {
    return res.status(404).json({ error: `Course with ID "${courseId}" not found` });
  }

  // Check for duplicate enrollment
  if (enrollmentModel.exists(studentId, courseId)) {
    return res.status(409).json({
      error: `Student "${student.fullName}" is already enrolled in "${course.name}"`,
    });
  }

  const enrollment = enrollmentModel.create({ studentId, courseId });

  res.status(201).json({
    message: 'Enrollment created successfully',
    data: {
      ...enrollment,
      studentName: student.fullName,
      courseName: course.name,
    },
  });
};

/** GET /enrollments — Get all enrollments, enriched with student and course names. */
const getAllEnrollments = (req, res) => {
  const enrollments = enrollmentModel.getAll();

  const enriched = enrollments.map((e) => {
    const student = studentModel.getById(e.studentId);
    const course = courseModel.getById(e.courseId);
    return {
      ...e,
      studentName: student ? student.fullName : 'Unknown',
      courseName: course ? course.name : 'Unknown',
    };
  });

  res.json({
    message: 'Enrollments retrieved successfully',
    data: enriched,
    count: enriched.length,
  });
};

/** GET /enrollments/student/:id — Get all enrollments for a specific student. */
const getEnrollmentsByStudent = (req, res) => {
  const { id } = req.params;

  const student = studentModel.getById(id);
  if (!student) {
    return res.status(404).json({ error: `Student with ID "${id}" not found` });
  }

  const enrollments = enrollmentModel.getByStudentId(id);

  const enriched = enrollments.map((e) => {
    const course = courseModel.getById(e.courseId);
    return {
      ...e,
      courseName: course ? course.name : 'Unknown',
    };
  });

  res.json({
    message: `Enrollments for student "${student.fullName}"`,
    data: enriched,
    count: enriched.length,
  });
};

module.exports = { createEnrollment, getAllEnrollments, getEnrollmentsByStudent };
