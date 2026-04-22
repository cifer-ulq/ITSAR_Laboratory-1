/**
 * Student Controller
 *
 * Handles HTTP request/response logic for student endpoints.
 * Delegates data operations to the student model.
 */

const studentModel = require('../models/studentModel');
const enrollmentModel = require('../models/enrollmentModel');

/** POST /students — Create a new student. */
const createStudent = (req, res) => {
  const { fullName, email, age } = req.body;

  // Check for duplicate email
  const existingStudent = studentModel.getByEmail(email);
  if (existingStudent) {
    return res.status(409).json({ error: `A student with email "${email}" already exists` });
  }

  const student = studentModel.create({ fullName, email, age });
  res.status(201).json({ message: 'Student created successfully', data: student });
};

/** GET /students — Get all students. */
const getAllStudents = (req, res) => {
  const students = studentModel.getAll();
  res.json({ message: 'Students retrieved successfully', data: students, count: students.length });
};

/** GET /students/:id — Get a single student by ID. */
const getStudentById = (req, res) => {
  const student = studentModel.getById(req.params.id);

  if (!student) {
    return res.status(404).json({ error: `Student with ID "${req.params.id}" not found` });
  }

  res.json({ message: 'Student retrieved successfully', data: student });
};

/** PUT /students/:id — Update an existing student. */
const updateStudent = (req, res) => {
  const { id } = req.params;
  const { fullName, email, age } = req.body;

  const existing = studentModel.getById(id);
  if (!existing) {
    return res.status(404).json({ error: `Student with ID "${id}" not found` });
  }

  // If email is changing, check for duplicate
  if (email && email.toLowerCase() !== existing.email) {
    const duplicate = studentModel.getByEmail(email);
    if (duplicate) {
      return res.status(409).json({ error: `A student with email "${email}" already exists` });
    }
  }

  const updated = studentModel.update(id, { fullName, email, age });
  res.json({ message: 'Student updated successfully', data: updated });
};

/** DELETE /students/:id — Delete a student and their enrollments. */
const deleteStudent = (req, res) => {
  const { id } = req.params;

  const deleted = studentModel.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: `Student with ID "${id}" not found` });
  }

  // Business rule: deleting a student also removes their enrollments
  const removedEnrollments = enrollmentModel.removeByStudentId(id);

  res.json({
    message: 'Student deleted successfully',
    data: deleted,
    enrollmentsRemoved: removedEnrollments,
  });
};

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };
