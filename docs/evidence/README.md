# Evidence Folder

This folder contains saved curl output text files demonstrating each edge case.

## How to Generate Evidence

Run each curl command from `tests/curl-tests.md` and redirect output to a `.txt` file in this folder:

```bash
curl -i http://localhost:3001/students > docs/evidence/01-list-students.txt 2>&1
```

## Expected Files

| File | Proves |
|------|--------|
| `01-list-students.txt` | Happy path — 200 OK |
| `02-create-student.txt` | Happy path — 201 Created |
| `03-student-missing-name.txt` | 400 Bad Request — validation |
| `04-student-invalid-email.txt` | 400 Bad Request — validation |
| `05-student-not-found.txt` | 404 Not Found |
| `06-create-course.txt` | Happy path — 201 Created |
| `07-course-missing-name.txt` | 400 Bad Request — validation |
| `08-course-not-found.txt` | 404 Not Found |
| `09-create-enrollment.txt` | Happy path — 201 Created |
| `10-enrollment-missing-field.txt` | 400 Bad Request — validation |
| `11-enrollment-student-not-found.txt` | 404 Not Found (via orchestration) |
| `12-enrollment-course-not-found.txt` | 404 Not Found (via orchestration) |
| `13-duplicate-enrollment.txt` | 409 Conflict |
| `14-service-unavailable.txt` | 503 Service Unavailable |
| `15-gateway-timeout.txt` | 504 Gateway Timeout |
