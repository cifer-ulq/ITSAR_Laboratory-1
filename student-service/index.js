/**
 * Student Service — Port 3001
 *
 * Responsibilities:
 *   • POST /students       → Create a student (validates name & email)
 *   • GET  /students       → List all students
 *   • GET  /students/:id   → Get one student (404 if missing)
 *
 * Status codes emitted:
 *   200  OK
 *   201  Created
 *   400  Bad Request   — missing / invalid fields
 *   404  Not Found     — student ID does not exist
 */

const express = require("express");
const app = express();
const PORT = 3001;

// ---------- middleware ----------
app.use(express.json());

// Catch malformed JSON bodies (SyntaxError thrown by express.json())
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
const students = {};
let nextId = 1;

// ---------- helpers ----------
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- routes ----------

// POST /students — Create a new student
app.post("/students", (req, res) => {
  const { fullName, email, age } = req.body || {};

  // 400 — missing fields
  if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
    return res.status(400).json({
      error: "MISSING_FIELD",
      message: "Field 'fullName' is required and must be a non-empty string.",
    });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: "INVALID_EMAIL",
      message:
        "Field 'email' is required and must be a valid email address.",
    });
  }

  const id = nextId++;
  students[id] = { id, fullName: fullName.trim(), email: email.trim(), age: age || null };

  return res.status(201).json({ message: "Student created successfully", data: students[id] });
});

// GET /students — List all students
app.get("/students", (_req, res) => {
  const all = Object.values(students);
  return res.status(200).json({ message: "Students retrieved successfully", data: all, count: all.length });
});

// GET /students/:id — Get one student
app.get("/students/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Student ID must be a valid integer.",
    });
  }

  const student = students[id];
  if (!student) {
    return res.status(404).json({
      error: "STUDENT_NOT_FOUND",
      message: `Student with ID ${id} was not found.`,
    });
  }

  return res.status(200).json({ message: "Student retrieved successfully", data: student });
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`Student Service running on http://localhost:${PORT}`);
});
