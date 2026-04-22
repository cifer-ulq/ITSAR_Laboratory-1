/**
 * Course Routes — /courses endpoints
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { validateCourse } = require('../middleware/validate');

router.post('/', validateCourse, courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', validateCourse, courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
