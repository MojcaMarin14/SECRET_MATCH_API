const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Javne poti
router.post('/register', authController.register);
router.post('/login', authController.login);

// Zaščitene poti
router.get('/profile', auth, authController.getProfile);

module.exports = router;