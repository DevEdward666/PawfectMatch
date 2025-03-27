const express = require('express');
const router = express.Router();
const userController = require('./userController');
const authMiddleware = require('./authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes
router.get('/profile', authMiddleware.authenticate, userController.getUserProfile);

module.exports = router;