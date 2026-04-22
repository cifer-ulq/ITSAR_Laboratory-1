# Curl Test Commands — Lab 2: Microservices Edge Case Testing

> **Prerequisite:** All three services must be running before executing these tests.
>
> ```
> Student Service   → http://localhost:3001
> Course Service    → http://localhost:3002
> Enrollment Service → http://localhost:3003
> ```
>
> Use `curl -i` to display HTTP status codes and headers.

---

## 1. Happy Path Tests

### 1.1 Create a Student (201 Created)

```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Charlie Brown\", \"email\": \"charlie@example.com\"}"
```

**Expected:** `HTTP/1.1 201 Created` with `{ "id": 3, "message": "created" }`

### 1.2 List All Students (200 OK)

```bash
curl -i http://localhost:3001/students
```

**Expected:** `HTTP/1.1 200 OK` with JSON array of students.

### 1.3 Get a Single Student (200 OK)

```bash
curl -i http://localhost:3001/students/1
```

**Expected:** `HTTP/1.1 200 OK` with `{ "id": 1, "name": "Alice Johnson", "email": "alice@example.com" }`

### 1.4 Create a Course (201 Created)

```bash
curl -i -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Web Development\", \"code\": \"CS301\"}"
```

**Expected:** `HTTP/1.1 201 Created` with `{ "id": 3, "message": "created" }`

### 1.5 List All Courses (200 OK)

```bash
curl -i http://localhost:3002/courses
```

**Expected:** `HTTP/1.1 200 OK` with JSON array of courses.

### 1.6 Get a Single Course (200 OK)

```bash
curl -i http://localhost:3002/courses/1
```

**Expected:** `HTTP/1.1 200 OK` with `{ "id": 1, "name": "Introduction to Computing", "code": "CS101" }`

### 1.7 Create an Enrollment (201 Created)

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 1}"
```

**Expected:** `HTTP/1.1 201 Created` with `{ "id": 1, "message": "created" }`

### 1.8 List All Enrollments (200 OK)

```bash
curl -i http://localhost:3003/enrollments
```

**Expected:** `HTTP/1.1 200 OK` with JSON array of enrollments.

### 1.9 Get a Single Enrollment (200 OK)

```bash
curl -i http://localhost:3003/enrollments/1
```

**Expected:** `HTTP/1.1 200 OK` with `{ "id": 1, "student_id": 1, "course_id": 1 }`

---

## 2. Validation Error Tests (400 Bad Request)

### 2.1 Create Student — Missing Name

```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"noname@example.com\"}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "MISSING_FIELD", "message": "Field 'name' is required and must be a non-empty string." }
```

### 2.2 Create Student — Missing Email

```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"No Email\"}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "INVALID_EMAIL", "message": "Field 'email' is required and must be a valid email address." }
```

### 2.3 Create Student — Invalid Email

```bash
curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Bad Email\", \"email\": \"not-an-email\"}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "INVALID_EMAIL", "message": "Field 'email' is required and must be a valid email address." }
```

### 2.4 Create Course — Missing Name

```bash
curl -i -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"CS999\"}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "MISSING_FIELD", "message": "Field 'name' is required and must be a non-empty string." }
```

### 2.5 Create Course — Missing Code

```bash
curl -i -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"No Code Course\"}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "MISSING_FIELD", "message": "Field 'code' is required and must be a non-empty string." }
```

### 2.6 Create Enrollment — Missing student_id

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"course_id\": 1}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "MISSING_FIELD", "message": "Field 'student_id' is required." }
```

### 2.7 Create Enrollment — Missing course_id

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "MISSING_FIELD", "message": "Field 'course_id' is required." }
```

### 2.8 Create Enrollment — Empty Body

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "MISSING_FIELD", "message": "Field 'student_id' is required." }
```

### 2.9 Create Enrollment — Invalid Types (Strings Instead of Integers)

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": \"abc\", \"course_id\": \"xyz\"}"
```

**Expected:** `HTTP/1.1 400 Bad Request`
```json
{ "error": "INVALID_FIELD", "message": "Field 'student_id' must be an integer." }
```

---

## 3. Not Found Tests (404 Not Found)

### 3.1 Get Non-Existent Student

```bash
curl -i http://localhost:3001/students/999
```

**Expected:** `HTTP/1.1 404 Not Found`
```json
{ "error": "STUDENT_NOT_FOUND", "message": "Student with ID 999 was not found." }
```

### 3.2 Get Non-Existent Course

```bash
curl -i http://localhost:3002/courses/999
```

**Expected:** `HTTP/1.1 404 Not Found`
```json
{ "error": "COURSE_NOT_FOUND", "message": "Course with ID 999 was not found." }
```

### 3.3 Get Non-Existent Enrollment

```bash
curl -i http://localhost:3003/enrollments/999
```

**Expected:** `HTTP/1.1 404 Not Found`
```json
{ "error": "ENROLLMENT_NOT_FOUND", "message": "Enrollment with ID 999 was not found." }
```

### 3.4 Enroll Non-Existent Student (404 via Orchestration)

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 999, \"course_id\": 1}"
```

**Expected:** `HTTP/1.1 404 Not Found`
```json
{ "error": "STUDENT_NOT_FOUND", "message": "Student with ID 999 was not found." }
```

### 3.5 Enroll in Non-Existent Course (404 via Orchestration)

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 999}"
```

**Expected:** `HTTP/1.1 404 Not Found`
```json
{ "error": "COURSE_NOT_FOUND", "message": "Course with ID 999 was not found." }
```

---

## 4. Duplicate Enrollment Test (409 Conflict)

### 4.1 First Enrollment (should succeed)

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 2, \"course_id\": 2}"
```

**Expected:** `HTTP/1.1 201 Created`

### 4.2 Duplicate Enrollment (should fail)

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 2, \"course_id\": 2}"
```

**Expected:** `HTTP/1.1 409 Conflict`
```json
{ "error": "DUPLICATE_ENROLLMENT", "message": "Student 2 is already enrolled in course 2." }
```

---

## 5. Dependency Down Test (503 Service Unavailable)

> **To simulate:** Stop the Student Service (Ctrl+C in its terminal), then try to create an enrollment.

### 5.1 Student Service Down

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 1}"
```

**Expected:** `HTTP/1.1 503 Service Unavailable`
```json
{ "error": "SERVICE_UNAVAILABLE", "message": "Student Service is currently unavailable (connection refused)." }
```

> **After testing:** Restart the Student Service before the next set of tests.

### 5.2 Course Service Down

> **To simulate:** Stop the Course Service, keep Student Service running.

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 1}"
```

**Expected:** `HTTP/1.1 503 Service Unavailable`
```json
{ "error": "SERVICE_UNAVAILABLE", "message": "Course Service is currently unavailable (connection refused)." }
```

> **After testing:** Restart the Course Service before the next set of tests.

---

## 6. Timeout Test (504 Gateway Timeout)

> **To simulate:** Restart the Enrollment Service with a very low dependency timeout so any normal network call exceeds it.
>
> ```bash
> # PowerShell
> cd enrollment-service
> $env:DEPENDENCY_TIMEOUT_MS="1"; node index.js
>
> # Bash / macOS / Linux
> cd enrollment-service
> DEPENDENCY_TIMEOUT_MS=1 node index.js
> ```

### 6.1 Enrollment with Timeout

```bash
curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 1}"
```

**Expected:** `HTTP/1.1 504 Gateway Timeout`
```json
{ "error": "GATEWAY_TIMEOUT", "message": "Student Service did not respond in time." }
```

> **After testing:** Restart the Enrollment Service without the timeout override to restore normal behavior.

---

## Saving Evidence

To save curl output to text files for the `docs/evidence/` folder:

```bash
curl -i http://localhost:3001/students > docs/evidence/01-list-students.txt 2>&1

curl -i -X POST http://localhost:3001/students \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"noname@example.com\"}" > docs/evidence/02-student-missing-name.txt 2>&1

curl -i http://localhost:3001/students/999 > docs/evidence/03-student-not-found.txt 2>&1

curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 2, \"course_id\": 2}" > docs/evidence/04-duplicate-enrollment.txt 2>&1

curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 1}" > docs/evidence/05-service-unavailable.txt 2>&1

curl -i -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -d "{\"student_id\": 1, \"course_id\": 1}" > docs/evidence/06-gateway-timeout.txt 2>&1
```
