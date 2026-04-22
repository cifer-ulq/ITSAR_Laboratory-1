/**
 * Enrollment Model — In-Memory Data Store
 *
 * Stores enrollments in a plain array.
 * Each enrollment links a studentId to a courseId.
 */

// In-memory storage — all enrollments live here
let enrollments = [];

/** Return all enrollments. */
const getAll = () => enrollments;

/** Get all enrollments for a specific student. */
const getByStudentId = (studentId) => enrollments.filter((e) => e.studentId === studentId);

/** Get all enrollments for a specific course. */
const getByCourseId = (courseId) => enrollments.filter((e) => e.courseId === courseId);

/** Check if a specific student-course enrollment already exists. */
const exists = (studentId, courseId) =>
  enrollments.some((e) => e.studentId === studentId && e.courseId === courseId);

/** Create a new enrollment. Returns the newly created enrollment object. */
const create = ({ studentId, courseId }) => {
  const enrollment = {
    studentId,
    courseId,
    enrolledAt: new Date().toISOString(),
  };
  enrollments.push(enrollment);
  return enrollment;
};

/** Remove all enrollments for a given student (cascade delete). */
const removeByStudentId = (studentId) => {
  const before = enrollments.length;
  enrollments = enrollments.filter((e) => e.studentId !== studentId);
  return before - enrollments.length;
};

/** Remove all enrollments for a given course (cascade delete). */
const removeByCourseId = (courseId) => {
  const before = enrollments.length;
  enrollments = enrollments.filter((e) => e.courseId !== courseId);
  return before - enrollments.length;
};

module.exports = {
  getAll,
  getByStudentId,
  getByCourseId,
  exists,
  create,
  removeByStudentId,
  removeByCourseId,
};
