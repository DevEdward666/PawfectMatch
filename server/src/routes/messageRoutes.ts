import express from 'express';
import {
  sendMessage,
  getUserMessages,
  getMessageById,
  deleteMessage,
  getAllMessages
} from '../controllers/messageController';
import { authenticate, isAdmin } from '../middlewares/auth';

const router = express.Router();

// Protected routes (require authentication)
router.post('/', authenticate, sendMessage);
router.get('/', authenticate, getUserMessages);
router.get('/:id', authenticate, getMessageById);
router.delete('/:id', authenticate, deleteMessage);

// Admin routes
router.get('/admin/all', authenticate, isAdmin, getAllMessages);

export default router;
