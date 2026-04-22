/**
 * Course Model — In-Memory Data Store
 *
 * Stores courses in a plain array. Provides helper methods for CRUD operations.
 * Each course has: id, name, description, credits.
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage — all courses live here
let courses = [];

/** Return all courses. */
const getAll = () => courses;

/** Find a course by its unique ID. Returns the course object or undefined if not found. */
const getById = (id) => courses.find((c) => c.id === id);

/** Create a new course and add to the store. Automatically generates a UUID. */
const create = ({ name, description, credits }) => {
  const course = {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    credits,
    createdAt: new Date().toISOString(),
  };
  courses.push(course);
  return course;
};

/** Update an existing course by ID. Only overwrites provided fields. */
const update = (id, data) => {
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;

  courses[index] = {
    ...courses[index],
    ...(data.name && { name: data.name.trim() }),
    ...(data.description && { description: data.description.trim() }),
    ...(data.credits && { credits: data.credits }),
    updatedAt: new Date().toISOString(),
  };

  return courses[index];
};

/** Delete a course by ID. Returns the deleted course or null if not found. */
const remove = (id) => {
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const deleted = courses.splice(index, 1);
  return deleted[0];
};

module.exports = { getAll, getById, create, update, remove };
