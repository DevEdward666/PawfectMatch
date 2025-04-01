const express = require('express');
const router = express.Router();
const userController = require('./userController');
const authMiddleware = require('./authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes - require authentication
router.get('/profile', authMiddleware.authenticate, userController.getUserProfile);
router.put('/profile', authMiddleware.authenticate, userController.updateUserProfile);
router.put('/change-password', authMiddleware.authenticate, userController.changePassword);

// Admin routes - require admin role
router.get('/getAllUsers', authMiddleware.authenticate, authMiddleware.isAdmin, userController.getAllUsers);
router.get('/getUser:id', authMiddleware.authenticate, authMiddleware.isAdmin, userController.getUserById);
router.post('/create', authMiddleware.authenticate, authMiddleware.isAdmin, userController.createUser);
router.put('/update/:id', authMiddleware.authenticate, authMiddleware.isAdmin, userController.updateUser);
router.put('/:id/reset-password', authMiddleware.authenticate, authMiddleware.isAdmin, userController.resetUserPassword);
router.delete('/delete/:id', authMiddleware.authenticate, authMiddleware.isAdmin, userController.deleteUser);

module.exports = router;