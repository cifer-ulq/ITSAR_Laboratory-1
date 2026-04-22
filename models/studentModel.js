/**
 * Student Model — In-Memory Data Store
 *
 * Stores students in a plain array. Provides helper methods for CRUD operations.
 * Each student has: id, fullName, email, age.
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage — all students live here
let students = [];

/** Return all students. */
const getAll = () => students;

/** Find a student by their unique ID. Returns the student object or undefined if not found. */
const getById = (id) => students.find((s) => s.id === id);

/** Find a student by email. Useful for checking duplicates. */
const getByEmail = (email) => students.find((s) => s.email === email);

/** Create a new student and add to the store. Automatically generates a UUID. */
const create = ({ fullName, email, age }) => {
  const student = {
    id: uuidv4(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    age,
    createdAt: new Date().toISOString(),
  };
  students.push(student);
  return student;
};

/** Update an existing student by ID. Only overwrites provided fields. */
const update = (id, data) => {
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;

  students[index] = {
    ...students[index],
    ...(data.fullName && { fullName: data.fullName.trim() }),
    ...(data.email && { email: data.email.trim().toLowerCase() }),
    ...(data.age && { age: data.age }),
    updatedAt: new Date().toISOString(),
  };

  return students[index];
};

/** Delete a student by ID. Returns the deleted student or null if not found. */
const remove = (id) => {
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const deleted = students.splice(index, 1);
  return deleted[0];
};

module.exports = { getAll, getById, getByEmail, create, update, remove };
