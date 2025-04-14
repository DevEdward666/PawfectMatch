import express from 'express';
import {
  sendMessage,
  getUserMessages,
  getMessageById,
  deleteMessage,
  getAllMessages,
  getUnreadCount,
  getAdminUsers,
  adminDeleteMessage,
  markAsRead
} from '../controllers/messageController';
import { authenticate, isAdmin } from '../middlewares/auth';

const router = express.Router();


// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/', sendMessage);

// Get user's messages (inbox and sent)
router.get('/', getUserMessages);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get all admin users (for messaging)
router.get('/admins', getAdminUsers);

// Get message by ID
router.get('/:id', getMessageById);

// Delete message
router.delete('/:id', deleteMessage);
// Mark message as read
router.put('/:id/read', (req, res) => {
    // Extract ID from params
    const messageId = parseInt(req.params.id);
    // In js, update the message to isRead = true
    // This endpoint is already called from the frontend, but was missing from routes
    markAsRead(req, res);
  });
// Admin routes - requires admin role
// Get all messages in the system (admin only)
router.get('/admin/all', isAdmin, getAllMessages);

// Admin delete message (admin can delete any message)
router.delete('/admin/:id', isAdmin, adminDeleteMessage);

export default router;
