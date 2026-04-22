# Lab 1 Report — Monolithic vs Microservices Architecture

---

## Part A — Monolithic Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Monolithic Server                     │
│                    (port 3000)                          │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  /students │  │  /courses  │  │   /enrollments   │  │
│  │  routes    │  │  routes    │  │     routes       │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
│        │               │                  │            │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌────────▼─────────┐  │
│  │  Student   │  │   Course   │  │   Enrollment     │  │
│  │ Controller │  │ Controller │  │   Controller     │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
│        │               │                  │            │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌────────▼─────────┐  │
│  │  Student   │  │   Course   │  │   Enrollment     │  │
│  │   Model    │  │   Model    │  │     Model        │  │
│  │(in-memory) │  │(in-memory) │  │  (in-memory)     │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│         ONE shared Node.js process / data store         │
└─────────────────────────────────────────────────────────┘
         ▲
         │  HTTP (browser or curl)
     Client / Browser
```

All three domains share the same process. The Enrollment Controller calls
`studentModel.getById()` directly — **no network hop required**.

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /students | Create student |
| GET | /students | List all students |
| GET | /students/:id | Get student by ID |
| PUT | /students/:id | Update student |
| DELETE | /students/:id | Delete student + cascade enrollments |
| POST | /courses | Create course |
| GET | /courses | List all courses |
| GET | /courses/:id | Get course by ID |
| PUT | /courses/:id | Update course |
| DELETE | /courses/:id | Delete course + cascade enrollments |
| POST | /enrollments | Enroll student in course |
| GET | /enrollments | List all enrollments |
| GET | /enrollments/student/:id | Get enrollments by student |

---

## Part B — Microservices Architecture

### Architecture Diagram

```
        Client (browser / curl)
              │
              ▼
┌─────────────────────────┐
│   Enrollment Service    │
│      (port 3003)        │
│  Orchestrator           │
│  - POST /enrollments    │
│  - GET  /enrollments    │
│  - GET  /enrollments/:id│
└──────────┬──────────────┘
           │  HTTP GET /students/:id
           ├─────────────────────────► ┌─────────────────────┐
           │                           │   Student Service   │
           │                           │     (port 3001)     │
           │                           │  - POST /students   │
           │                           │  - GET  /students   │
           │                           │  - GET  /students/:id│
           │                           └─────────────────────┘
           │  HTTP GET /courses/:id
           └─────────────────────────► ┌─────────────────────┐
                                       │   Course Service    │
                                       │     (port 3002)     │
                                       │  - POST /courses    │
                                       │  - GET  /courses    │
                                       │  - GET  /courses/:id│
                                       └─────────────────────┘
```

Each service has its own isolated in-memory store. Communication is HTTP only.

---

## Comparison Table

| Criteria | Monolithic | Microservices |
|----------|-----------|---------------|
| **Ease of Development** | **Easier** — one project, direct function calls between modules | **Harder** — three projects, HTTP orchestration, timeout/error handling required |
| **Deployment Difficulty** | **Simple** — `npm start` runs everything | **Complex** — three services must each be started and managed separately |
| **Scalability** | **Limited** — entire app scales as one unit | **Flexible** — each service can be scaled independently |
| **Failure Impact** | **High** — one crash brings down the whole system | **Isolated** — a crashed Course Service does not affect the Student Service |
| **Performance** | **Faster** — direct in-process function calls (nanoseconds) | **Slower** — enrollment requires two HTTP round trips (milliseconds) |

---

## Reflection

After building both versions, I would choose **microservices** for any system expected to grow, and **monolithic** for small, self-contained projects.

The monolithic version was noticeably faster to build. Calling `studentModel.getById()` directly from the enrollment controller required no HTTP client, no port configuration, and no network error handling. Debugging was also simpler — one log stream, one process to restart.

However, the monolithic architecture has a critical weakness: it scales and fails as one unit. A bug in the courses route crashes the entire application, taking down students and enrollments with it. You also cannot scale only the slow part — every new instance must include all three domains.

The microservices version isolates these concerns. When I tested the Course Service going offline, the Enrollment Service correctly returned `503 Service Unavailable` while the Student Service continued operating normally. This **fault isolation** is the most compelling reason to choose microservices for production workloads.

The added complexity — three processes to manage, HTTP orchestration code, handling timeouts (504) and connection refused (503) — is real. But it is a worthwhile trade-off for a system that needs to grow and be maintained by multiple developers.

**Conclusion:** The monolithic version taught me how to structure a layered Node.js application (routes → controllers → models). The microservices version taught me how distributed systems fail and how to handle those failures gracefully. Both lessons are essential, and the contrast between the two architectures made each one clearer.

---

# Lab 2 Report — Microservices Edge Case Testing

## 1. Architecture Overview

The system is composed of three independently deployable Node.js services:

```
┌────────────────┐       HTTP GET        ┌──────────────────┐
│   Enrollment   │ ────────────────────► │  Student Service │
│    Service     │                       │   (port 3001)    │
│  (port 3003)   │       HTTP GET        └──────────────────┘
│  Orchestrator  │ ────────────────────► ┌──────────────────┐
│                │                       │  Course Service  │
└────────────────┘                       │   (port 3002)    │
       ▲                                 └──────────────────┘
       │
   curl -i
   (client)
```

### Why This Structure?

Each service owns a single bounded context:

| Service | Owns | Depends On |
|---------|------|------------|
| Student Service | Student data (name, email) | Nothing |
| Course Service | Course data (name, code) | Nothing |
| Enrollment Service | Enrollment records (student_id, course_id) | Student + Course |

The Enrollment Service is an **orchestrator**: it must call the other two services before it can fulfill a request. This design intentionally introduces inter-service dependencies so we can demonstrate error-handling patterns that arise in distributed systems.

---

## 2. Design Decisions for Error Handling

### 2.1 Standardized Error Response Envelope

Every error response follows the same JSON shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable explanation"
}
```

**Why?** Clients (and automated tests) can rely on parsing a single envelope structure. The `error` field is a machine-readable constant, ideal for `switch` statements in consumer code. The `message` field is human-friendly and useful for debugging.

### 2.2 HTTP Status Code Selection

| Code | When Used | Rationale |
|------|-----------|-----------|
| **400 Bad Request** | Missing or invalid fields in request body | RFC 7231 §6.5.1 — the server cannot process the request due to a client error. We validate fields before touching any data store or calling dependencies. |
| **404 Not Found** | The requested resource ID does not exist | RFC 7231 §6.5.4 — the origin server did not find a current representation. Used both for direct lookups and when the orchestrator confirms a student/course doesn't exist upstream. |
| **409 Conflict** | Attempting a duplicate enrollment | RFC 7231 §6.5.8 — the request conflicts with the current state. A `(student_id, course_id)` pair is a natural composite key; inserting a duplicate violates this unique constraint. |
| **503 Service Unavailable** | A dependency service is offline (ECONNREFUSED) | RFC 7231 §6.6.4 — the server is currently unable to handle the request due to a temporary overload or maintenance. Signals to the client that a retry may succeed later. |
| **504 Gateway Timeout** | A dependency service did not respond within the configured timeout | RFC 7231 §6.6.5 — the server, acting as a gateway, did not receive a timely response from an upstream server. The Enrollment Service acts as the gateway. |

### 2.3 Validation-First Approach

All POST handlers validate input **before** performing any side effects:

1. Check required fields exist and are the correct type.
2. (Enrollment only) Call Student Service.
3. (Enrollment only) Call Course Service.
4. Check for duplicates.
5. Persist.

This ordering is deliberately chosen: we avoid making network calls to dependencies when the input is obviously invalid. Cheap checks come first; expensive I/O comes later.

---

## 3. Handling "Dependency Down" Scenarios

### 3.1 Connection Refused (503)

When the Student or Course service process is stopped, the TCP connection is refused by the OS. Axios throws an error with `code: 'ECONNREFUSED'`. The `fetchDependency` helper maps this to a **503 Service Unavailable** response.

**Why 503 and not 500?** A 500 implies a bug in the Enrollment Service itself. A 503 accurately communicates that the service is temporarily unable to serve the request because an external dependency is unavailable. The client knows a retry is reasonable.

### 3.2 Timeout (504)

When the Enrollment Service's HTTP client (Axios) exceeds `DEPENDENCY_TIMEOUT_MS` waiting for a response, Axios throws with `code: 'ECONNABORTED'`. This is mapped to **504 Gateway Timeout**.

**Why 504 and not 408?** HTTP 408 means the *server is timing out waiting for the client* to complete its request. HTTP 504 means the server, acting as a *gateway*, timed out waiting for an *upstream* server. Since the Enrollment Service is the gateway in this relationship, 504 is semantically correct.

### 3.3 Testing Strategy

- **503**: Stop the target service process (Ctrl+C), then send the enrollment curl. The OS will refuse the connection immediately.
- **504**: Restart the Enrollment Service with `DEPENDENCY_TIMEOUT_MS=1` (1 millisecond). Even a localhost response takes longer than 1 ms, so the timeout fires reliably without needing a special "slow" endpoint.

---

## 4. Handling Duplicate Enrollments (409)

The enrollment store uses an in-memory JavaScript object. Before inserting, we iterate over all existing enrollments and check for a matching `(student_id, course_id)` pair. If found, we return **409 Conflict** with the `DUPLICATE_ENROLLMENT` error code.

In a production system, this would be enforced with a database unique index on `(student_id, course_id)`. The in-memory approach mirrors that semantic.

---

## 5. Idempotency Considerations

The current design is **not idempotent** for enrollment creation — repeated POSTs with the same payload will return 409 instead of silently succeeding. This is intentional for the lab: we want to demonstrate conflict detection. In a production system, you might implement PUT-based idempotent enrollment with a client-supplied idempotency key, but that is beyond the scope of this exercise.

---

## 6. In-Memory Data Store

All three services use plain JavaScript objects as data stores. This means:

- Data is lost when a service restarts.
- Seeded records (Alice, Bob, CS101, CS201) are re-created on startup.
- No external database dependency — the services can run anywhere Node.js is installed.

This trade-off is acceptable for a laboratory exercise focused on HTTP communication patterns and error handling rather than persistence.

---

## 7. Reflections

### What Went Well

- The standardized error envelope makes automated verification straightforward — every error response has the same shape.
- Separating validation from orchestration keeps the code clean and testable.
- Using Axios timeouts provides a reliable way to simulate and handle slow dependencies.

### Challenges

- Distinguishing between 503 and 504 requires inspecting Axios error `code` values, which are not well-documented. Testing both paths required careful reading of Axios source code.
- In-memory stores reset on restart, which means the 503 test (stop a service) also clears that service's data. The seeded data mitigates this, but a database-backed service would not have this issue.

### Potential Improvements

- **Circuit Breaker Pattern**: After N consecutive failures to a dependency, stop trying for a cooldown period. This prevents cascading timeouts and reduces load on a struggling service.
- **Retry with Exponential Backoff**: For transient failures, automatically retry 2–3 times with increasing delays before returning 503/504.
- **Health Check Endpoints**: Each service could expose `GET /health` so monitoring tools can detect outages proactively.
- **Database Persistence**: Replace in-memory stores with SQLite or PostgreSQL for durability across restarts.

---

## 8. References

- RFC 7231 — HTTP/1.1 Semantics and Content
- Express.js Documentation — https://expressjs.com/
- Axios Documentation — https://axios-http.com/
