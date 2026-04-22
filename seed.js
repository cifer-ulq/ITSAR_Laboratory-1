/**
 * Seed Script — Populates the monolithic API with sample test data.
 *
 * Run this after starting the server:
 *   node seed.js
 */

const BASE_URL = 'http://localhost:3000';

const students = [
  { fullName: 'Maria Santos',   email: 'maria.santos@email.com',   age: 20 },
  { fullName: 'Juan Dela Cruz', email: 'juan.delacruz@email.com',  age: 22 },
  { fullName: 'Ana Reyes',      email: 'ana.reyes@email.com',       age: 19 },
  { fullName: 'Carlos Garcia',  email: 'carlos.garcia@email.com',  age: 21 },
];

const courses = [
  { name: 'Introduction to Computer Science', description: 'Fundamentals of computing and programming', credits: 3 },
  { name: 'Data Structures',   description: 'Arrays, linked lists, trees, graphs, and algorithms', credits: 3 },
  { name: 'Web Development',   description: 'HTML, CSS, JavaScript, and modern frameworks',        credits: 4 },
  { name: 'Database Management', description: 'SQL, NoSQL, and database design principles',        credits: 3 },
];

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function seed() {
  console.log('Seeding sample data...\n');

  console.log('--- Creating Students ---');
  const createdStudents = [];
  for (const student of students) {
    const result = await postJSON(`${BASE_URL}/students`, student);
    console.log(`  Created: ${result.data.fullName} (ID: ${result.data.id})`);
    createdStudents.push(result.data);
  }

  console.log('\n--- Creating Courses ---');
  const createdCourses = [];
  for (const course of courses) {
    const result = await postJSON(`${BASE_URL}/courses`, course);
    console.log(`  Created: ${result.data.name} (ID: ${result.data.id})`);
    createdCourses.push(result.data);
  }

  console.log('\n--- Creating Enrollments ---');
  const enrollmentPairs = [
    [0, 0], [0, 2],
    [1, 0], [1, 1],
    [2, 1], [2, 3],
    [3, 2], [3, 3],
  ];

  for (const [si, ci] of enrollmentPairs) {
    const result = await postJSON(`${BASE_URL}/enrollments`, {
      studentId: createdStudents[si].id,
      courseId:  createdCourses[ci].id,
    });
    console.log(`  Enrolled: ${createdStudents[si].fullName} -> ${createdCourses[ci].name}`);
  }

  console.log('\nSeed complete!');
  console.log(`  GET http://localhost:3000/students`);
  console.log(`  GET http://localhost:3000/courses`);
  console.log(`  GET http://localhost:3000/enrollments`);
}

seed().catch((err) => {
  console.error('Seed failed. Is the server running on port 3000?');
  console.error(err.message);
});
