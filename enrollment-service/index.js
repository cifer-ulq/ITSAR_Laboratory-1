/**
 * Enrollment Service — Port 3003  (Orchestrator)
 *
 * Responsibilities:
 *   • POST /enrollments          → Enroll a student in a course
 *   • GET  /enrollments          → List all enrollments
 *   • GET  /enrollments/:id      → Get one enrollment
 *
 * Orchestration flow (POST):
 *   1. Validate incoming JSON (400 if missing fields).
 *   2. Call Student Service to verify student exists (404 / 503 / 504).
 *   3. Call Course Service to verify course exists   (404 / 503 / 504).
 *   4. Check for duplicate enrollment               (409).
 *   5. Persist enrollment and return 201.
 *
 * Status codes emitted:
 *   200  OK
 *   201  Created
 *   400  Bad Request          — missing / invalid fields
 *   404  Not Found            — student or course not found, or enrollment ID missing
 *   409  Conflict             — duplicate enrollment
 *   503  Service Unavailable  — dependency service is offline
 *   504  Gateway Timeout      — dependency service is too slow
 */

const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3003;

// ---------- configuration ----------
const STUDENT_SERVICE_URL =
  process.env.STUDENT_SERVICE_URL || "http://localhost:3001";
const COURSE_SERVICE_URL =
  process.env.COURSE_SERVICE_URL || "http://localhost:3002";

// Timeout for dependency calls (ms).  Keep low so the 504 test is fast.
const DEPENDENCY_TIMEOUT_MS = parseInt(process.env.DEPENDENCY_TIMEOUT_MS, 10) || 5000;

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
const enrollments = {};
let nextId = 1;

// ---------- helper: call dependency ----------
/**
 * Makes a GET request to a dependency service.
 *
 * On success → returns the parsed response data.
 * On 404      → returns null           (resource missing)
 * On ECONNREFUSED / ENOTFOUND → throws with status 503
 * On timeout  → throws with status 504
 */
async function fetchDependency(baseUrl, path, serviceName) {
  try {
    const response = await axios.get(`${baseUrl}${path}`, {
      timeout: DEPENDENCY_TIMEOUT_MS,
    });
    return response.data;
  } catch (err) {
    // Axios wraps HTTP-level errors (non-2xx) in err.response
    if (err.response) {
      if (err.response.status === 404) {
        return null; // resource not found — handled by caller
      }
      // Any other non-2xx from the dependency
      throw {
        status: err.response.status,
        error: "DEPENDENCY_ERROR",
        message: `${serviceName} returned status ${err.response.status}.`,
      };
    }

    // Network-level errors (service is down or DNS failure)
    if (
      err.code === "ECONNREFUSED" ||
      err.code === "ENOTFOUND" ||
      err.code === "ECONNRESET"
    ) {
      throw {
        status: 503,
        error: "SERVICE_UNAVAILABLE",
        message: `${serviceName} is currently unavailable (connection refused).`,
      };
    }

    // Timeout
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" || (err.message && err.message.includes("timeout"))) {
      throw {
        status: 504,
        error: "GATEWAY_TIMEOUT",
        message: `${serviceName} did not respond in time.`,
      };
    }

    // Catch-all
    throw {
      status: 503,
      error: "SERVICE_UNAVAILABLE",
      message: `${serviceName} is currently unavailable.`,
    };
  }
}

// ---------- routes ----------

// POST /enrollments — Enroll a student in a course
app.post("/enrollments", async (req, res) => {
  const body = req.body || {};
  // Accept both camelCase and snake_case; coerce strings to numbers (HTML selects send strings)
  const student_id = parseInt(body.studentId ?? body.student_id, 10);
  const course_id  = parseInt(body.courseId  ?? body.course_id,  10);

  // --- 400 validation ---
  if (body.studentId === undefined && body.student_id === undefined) {
    return res.status(400).json({
      error: "MISSING_FIELD",
      message: "Field 'studentId' is required.",
    });
  }
  if (isNaN(student_id)) {
    return res.status(400).json({
      error: "INVALID_FIELD",
      message: "Field 'studentId' must be an integer.",
    });
  }
  if (body.courseId === undefined && body.course_id === undefined) {
    return res.status(400).json({
      error: "MISSING_FIELD",
      message: "Field 'courseId' is required.",
    });
  }
  if (isNaN(course_id)) {
    return res.status(400).json({
      error: "INVALID_FIELD",
      message: "Field 'courseId' must be an integer.",
    });
  }

  // --- Verify student exists (calls Student Service) ---
  let student;
  try {
    student = await fetchDependency(
      STUDENT_SERVICE_URL,
      `/students/${student_id}`,
      "Student Service"
    );
  } catch (depErr) {
    return res.status(depErr.status).json({
      error: depErr.error,
      message: depErr.message,
    });
  }

  if (!student) {
    return res.status(404).json({
      error: "STUDENT_NOT_FOUND",
      message: `Student with ID ${student_id} was not found.`,
    });
  }

  // --- Verify course exists (calls Course Service) ---
  let course;
  try {
    course = await fetchDependency(
      COURSE_SERVICE_URL,
      `/courses/${course_id}`,
      "Course Service"
    );
  } catch (depErr) {
    return res.status(depErr.status).json({
      error: depErr.error,
      message: depErr.message,
    });
  }

  if (!course) {
    return res.status(404).json({
      error: "COURSE_NOT_FOUND",
      message: `Course with ID ${course_id} was not found.`,
    });
  }

  // --- 409 duplicate check ---
  const isDuplicate = Object.values(enrollments).some(
    (e) => e.studentId === student_id && e.courseId === course_id
  );
  if (isDuplicate) {
    return res.status(409).json({
      error: "DUPLICATE_ENROLLMENT",
      message: `Student ${student_id} is already enrolled in course ${course_id}.`,
    });
  }

  // --- Persist ---
  const id = nextId++;
  enrollments[id] = { id, studentId: student_id, courseId: course_id };

  return res.status(201).json({ message: "Enrollment created successfully", data: enrollments[id] });
});

// GET /enrollments — List all enrollments (enriched with student/course names)
app.get("/enrollments", async (_req, res) => {
  const all = Object.values(enrollments);
  if (all.length === 0) {
    return res.status(200).json({ message: "Enrollments retrieved successfully", data: [], count: 0 });
  }
  try {
    const [studentsRes, coursesRes] = await Promise.all([
      axios.get(`${STUDENT_SERVICE_URL}/students`, { timeout: DEPENDENCY_TIMEOUT_MS }),
      axios.get(`${COURSE_SERVICE_URL}/courses`,   { timeout: DEPENDENCY_TIMEOUT_MS }),
    ]);
    const studentsMap = {};
    const coursesMap  = {};
    const studentList = studentsRes.data.data || studentsRes.data;
    const courseList  = coursesRes.data.data  || coursesRes.data;
    studentList.forEach((s) => { studentsMap[s.id] = s.fullName || s.name; });
    courseList.forEach((c)  => { coursesMap[c.id]  = c.name; });

    const enriched = all.map((e) => ({
      ...e,
      studentName: studentsMap[e.studentId] || `Student #${e.studentId}`,
      courseName:  coursesMap[e.courseId]   || `Course #${e.courseId}`,
    }));
    return res.status(200).json({ message: "Enrollments retrieved successfully", data: enriched, count: enriched.length });
  } catch (_err) {
    // If services are down, return raw data without names
    return res.status(200).json({ message: "Enrollments retrieved successfully", data: all, count: all.length });
  }
});

// GET /enrollments/:id — Get one enrollment
app.get("/enrollments/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Enrollment ID must be a valid integer.",
    });
  }

  const enrollment = enrollments[id];
  if (!enrollment) {
    return res.status(404).json({
      error: "ENROLLMENT_NOT_FOUND",
      message: `Enrollment with ID ${id} was not found.`,
    });
  }

  return res.status(200).json(enrollment);
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`Enrollment Service running on http://localhost:${PORT}`);
  console.log(`  → Student Service URL : ${STUDENT_SERVICE_URL}`);
  console.log(`  → Course  Service URL : ${COURSE_SERVICE_URL}`);
  console.log(`  → Dependency timeout  : ${DEPENDENCY_TIMEOUT_MS} ms`);
});
