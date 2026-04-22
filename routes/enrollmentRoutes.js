/**
 * Enrollment Routes — /enrollments endpoints
 */

const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { validateEnrollment } = require('../middleware/validate');

router.post('/', validateEnrollment, enrollmentController.createEnrollment);
router.get('/', enrollmentController.getAllEnrollments);
router.get('/student/:id', enrollmentController.getEnrollmentsByStudent);

module.exports = router;
