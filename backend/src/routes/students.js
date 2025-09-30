const express = require('express');
const { body } = require('express-validator');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  createBulkStudents,
  updateStudent,
  deleteStudent,
  getStudentStats,
  validateStudentCredentials,
  resetStudentPassword,
  saveStudentProject,
  loadStudentProjects,
  loadStudentProject,
  deleteStudentProject
} = require('../controllers/studentController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const studentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ max: 200 })
    .withMessage('School name cannot exceed 200 characters'),
  
  body('className')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ max: 50 })
    .withMessage('Class name cannot exceed 50 characters')
];

// Public routes (for now - can be protected later)
router.get('/', getAllStudents);
router.get('/stats', getStudentStats);

// Student credential validation (public endpoint for BixCode integration)
router.post('/validate-credentials', validateStudentCredentials);

// Student password reset (public endpoint for BixCode integration)
router.post('/reset-password', resetStudentPassword);

// Student project cloud storage (public endpoints for BixCode integration)
router.post('/save-project', saveStudentProject);
router.get('/load-projects', loadStudentProjects);
router.get('/load-project/:projectId', loadStudentProject);
router.delete('/delete-project/:projectId', deleteStudentProject);

// Parameterized routes must come AFTER specific routes
router.get('/:id', getStudentById);

// Protected routes (require authentication)
router.post('/', studentValidation, createStudent);
router.post('/bulk', createBulkStudents);
router.put('/:id', studentValidation, updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
