/**
 * API Gateway — Port 3010
 *
 * Single entry point for the Microservices system (Part B).
 * Serves the same web UI as the monolithic app but routes every
 * API call to the correct downstream microservice via HTTP.
 *
 *   /students   → Student Service  (port 3001)
 *   /courses    → Course Service   (port 3002)
 *   /enrollments→ Enrollment Service (port 3003)
 */

const express = require("express");
const axios   = require("axios");
const path    = require("path");
const app     = express();
const PORT    = process.env.PORT || 3010;

const STUDENT_URL    = process.env.STUDENT_SERVICE_URL    || "http://localhost:3001";
const COURSE_URL     = process.env.COURSE_SERVICE_URL     || "http://localhost:3002";
const ENROLLMENT_URL = process.env.ENROLLMENT_SERVICE_URL || "http://localhost:3003";

// ---------- middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- generic proxy helper ----------
async function proxy(req, res, targetBase) {
  const url = `${targetBase}${req.path === "/" ? "" : req.path}`;
  try {
    const response = await axios({
      method:  req.method,
      url,
      data:    req.body,
      params:  req.query,
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,   // forward all status codes as-is
    });
    return res.status(response.status).json(response.data);
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return res.status(503).json({ error: "Service unavailable. Is the service running?" });
    }
    return res.status(502).json({ error: "Bad gateway", message: err.message });
  }
}

// ---------- routes ----------
app.all("/students*",    (req, res) => proxy(req, res, STUDENT_URL));
app.all("/courses*",     (req, res) => proxy(req, res, COURSE_URL));
app.all("/enrollments*", (req, res) => proxy(req, res, ENROLLMENT_URL));

// Root — served by static middleware (index.html)
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`  → Student Service    : ${STUDENT_URL}`);
  console.log(`  → Course Service     : ${COURSE_URL}`);
  console.log(`  → Enrollment Service : ${ENROLLMENT_URL}`);
});
