/**
 * Validation Middleware
 *
 * Reusable validators for request data. Each function checks specific fields
 * and returns 400 Bad Request if validation fails.
 */

// Simple email regex — covers most common email formats
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate student creation/update data.
 * Checks: fullName (required string), email (valid format), age (positive integer).
 */
const validateStudent = (req, res, next) => {
  const { fullName, email, age } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    errors.push('fullName is required and must be a non-empty string');
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('email is required and must be a valid email format');
  }

  if (
    age === undefined ||
    age === null ||
    typeof age !== 'number' ||
    age <= 0 ||
    !Number.isInteger(age)
  ) {
    errors.push('age is required and must be a positive integer');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

/**
 * Validate course creation/update data.
 * Checks: name (required string), description (required string), credits (positive number).
 */
const validateCourse = (req, res, next) => {
  const { name, description, credits } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }

  if (credits === undefined || credits === null || typeof credits !== 'number' || credits <= 0) {
    errors.push('credits is required and must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

/**
 * Validate enrollment data.
 * Checks: studentId (required string), courseId (required string).
 */
const validateEnrollment = (req, res, next) => {
  const { studentId, courseId } = req.body;
  const errors = [];

  if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
    errors.push('studentId is required and must be a non-empty string');
  }

  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    errors.push('courseId is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

module.exports = { validateStudent, validateCourse, validateEnrollment };
