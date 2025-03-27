import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser
} from '../controllers/userController';
import { authenticate, isAdmin } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.put('/change-password', authenticate, changePassword);

// Admin routes
router.get('/', authenticate, isAdmin, getAllUsers);
router.get('/:id', authenticate, isAdmin, getUserById);
router.post('/', authenticate, isAdmin, createUser);
router.put('/:id', authenticate, isAdmin, updateUser);
router.put('/:id/reset-password', authenticate, isAdmin, resetUserPassword);
router.delete('/:id', authenticate, isAdmin, deleteUser);

export default router;
