# SAR Lab 1 — Monolithic vs Microservices: Student Course System

## Group Members — ITSAR Laboratory #1

- Gimarangan, Vhan Jhun C.
- Hallara, Kim R.
- Biojan, Christian A.
- Dolar, Eva Jane
- Nacion, Althea
- Malabago, Anessa

---

## Overview

This repository contains **both** implementations of a Simple Student Course System,
built for Laboratory 1 of System Architecture and Integration 2.

| Part | Folder | Port | Description |
|------|--------|------|-------------|
| **Part A — Monolithic** | `monolithic/` | 3000 | Single Express app, all domains in one process, frontend included |
| **Part B — Student Service** | `student-service/` | 3001 | Manages student records |
| **Part B — Course Service** | `course-service/` | 3002 | Manages course records |
| **Part B — Enrollment Service** | `enrollment-service/` | 3003 | Orchestrator — calls Student + Course services over HTTP |

---

## Quick Start

### Install all dependencies (npm workspaces)

```bash
npm install
```

### Run the Monolithic app (Part A)

```bash
npm run start:mono
# → http://localhost:3000  (includes web UI)
```

Optionally seed sample data:

```bash
cd monolithic && node seed.js
```

### Run the Microservices (Part B)

Open **three separate terminals**:

```bash
# Terminal 1
npm run start:students    # port 3001

# Terminal 2
npm run start:courses     # port 3002

# Terminal 3
npm run start:enrollment  # port 3003
```

---

## Project Structure

```
├── monolithic/                    # Part A — Monolithic system
│   ├── server.js                  # Express entry point
│   ├── package.json
│   ├── seed.js                    # Populates sample data
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── studentModel.js
│   │   ├── courseModel.js
│   │   └── enrollmentModel.js
│   ├── controllers/
│   │   ├── studentController.js
│   │   ├── courseController.js
│   │   └── enrollmentController.js
│   ├── routes/
│   │   ├── studentRoutes.js
│   │   ├── courseRoutes.js
│   │   └── enrollmentRoutes.js
│   └── public/                    # Frontend (served by Express)
│       ├── index.html
│       ├── styles.css
│       └── script.js
├── student-service/               # Part B — Microservice
│   ├── index.js
│   └── package.json
├── course-service/                # Part B — Microservice
│   ├── index.js
│   └── package.json
├── enrollment-service/            # Part B — Microservice (Orchestrator)
│   ├── index.js
│   └── package.json
├── tests/
│   └── curl-tests.md              # Curl commands for testing all endpoints
├── docs/
│   ├── report.md                  # Lab 1 full report (comparison table + reflection)
│   └── evidence/                  # Saved curl output text files
└── README.md                      # ← You are here
```
```

## Prerequisites

- **Node.js** v16 or later
- **npm** (bundled with Node.js)
- **curl** (pre-installed on most OS; for Windows use Git Bash or WSL)

## Setup & Run Instructions

### 1. Install dependencies

Open **three separate terminals** (or use `start` / `&` to background processes).

```bash
# Terminal 1 — Student Service
cd student-service
npm install

# Terminal 2 — Course Service
cd course-service
npm install

# Terminal 3 — Enrollment Service
cd enrollment-service
npm install
```

### 2. Start each service

```bash
# Terminal 1
cd student-service
npm start          # → http://localhost:3001

# Terminal 2
cd course-service
npm start          # → http://localhost:3002

# Terminal 3
cd enrollment-service
npm start          # → http://localhost:3003
```

### 3. Verify services are running

```bash
curl -i http://localhost:3001/students
curl -i http://localhost:3002/courses
curl -i http://localhost:3003/enrollments
```

All three should return `200 OK` with JSON arrays.

## Edge Cases Implemented

| HTTP Status | Scenario | How to Test |
|-------------|----------|-------------|
| **400** Bad Request | Missing or invalid fields in POST body | Send POST with empty body or wrong types |
| **404** Not Found | Resource ID does not exist | GET a non-existent student/course/enrollment |
| **409** Conflict | Duplicate enrollment (same student + course) | POST the same enrollment twice |
| **503** Service Unavailable | Dependency service is offline | Stop Student or Course service, then POST enrollment |
| **504** Gateway Timeout | Dependency too slow to respond | Set `DEPENDENCY_TIMEOUT_MS=1` on Enrollment Service |

## Environment Variables

The Enrollment Service accepts optional environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `STUDENT_SERVICE_URL` | `http://localhost:3001` | Base URL for Student Service |
| `COURSE_SERVICE_URL` | `http://localhost:3002` | Base URL for Course Service |
| `DEPENDENCY_TIMEOUT_MS` | `5000` | Timeout (ms) for dependency HTTP calls |

### Testing 504 Gateway Timeout

To force a timeout on the Enrollment Service side, restart it with a very low timeout:

```bash
# PowerShell
$env:DEPENDENCY_TIMEOUT_MS="1"; node index.js

# Bash / macOS / Linux
DEPENDENCY_TIMEOUT_MS=1 node index.js
```

Then POST an enrollment — the Enrollment Service will time out waiting for the Student/Course service and return `504 Gateway Timeout`.

## Testing

All curl commands are documented in [`tests/curl-tests.md`](tests/curl-tests.md).

Saved outputs (evidence) should be placed in [`docs/evidence/`](docs/evidence/).

## License

This project is for educational purposes — System Architecture and Integration 2, Laboratory 2.
