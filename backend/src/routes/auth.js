const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);

module.exports = router;
