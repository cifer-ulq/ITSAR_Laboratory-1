/**
 * Course Service — Port 3002
 *
 * Responsibilities:
 *   • POST /courses       → Create a course (validates name & code)
 *   • GET  /courses       → List all courses
 *   • GET  /courses/:id   → Get one course (404 if missing)
 *
 * Special test endpoints:
 *   • GET /courses/slow/:id → Artificially delayed response (for 504 testing)
 *
 * Status codes emitted:
 *   200  OK
 *   201  Created
 *   400  Bad Request   — missing / invalid fields
 *   404  Not Found     — course ID does not exist
 */

const express = require("express");
const app = express();
const PORT = 3002;

// ---------- middleware ----------
app.use(express.json());

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "INVALID_JSON",
      message: "Request body contains malformed JSON.",
    });
  }
  return res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
  });
});

// ---------- in-memory store ----------
const courses = {};
let nextId = 1;

// ---------- routes ----------

// POST /courses — Create a new course
app.post("/courses", (req, res) => {
  const { name, description, credits } = req.body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      error: "MISSING_FIELD",
      message: "Field 'name' is required and must be a non-empty string.",
    });
  }
  if (!description || typeof description !== "string" || description.trim() === "") {
    return res.status(400).json({
      error: "MISSING_FIELD",
      message: "Field 'description' is required and must be a non-empty string.",
    });
  }

  const id = nextId++;
  courses[id] = { id, name: name.trim(), description: description.trim(), credits: credits || null };

  return res.status(201).json({ message: "Course created successfully", data: courses[id] });
});

// GET /courses — List all courses
app.get("/courses", (_req, res) => {
  const all = Object.values(courses);
  return res.status(200).json({ message: "Courses retrieved successfully", data: all, count: all.length });
});

// GET /courses/:id — Get one course
app.get("/courses/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Course ID must be a valid integer.",
    });
  }

  const course = courses[id];
  if (!course) {
    return res.status(404).json({
      error: "COURSE_NOT_FOUND",
      message: `Course with ID ${id} was not found.`,
    });
  }

  return res.status(200).json({ message: "Course retrieved successfully", data: course });
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`Course Service running on http://localhost:${PORT}`);
});
