const express = require('express');
const router = express.Router();
const messagesController = require('./messagesController');
const authMiddleware = require('./authMiddleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Send a message
router.post('/', messagesController.sendMessage);

// Get user's messages (inbox and sent)
router.get('/', messagesController.getUserMessages);

// Get unread message count
router.get('/unread-count', messagesController.getUnreadCount);

// Get all admin users (for messaging)
router.get('/admins', messagesController.getAdminUsers);

// Get message by ID
router.get('/:id', messagesController.getMessageById);

// Delete message
router.delete('/:id', messagesController.deleteMessage);
// Mark message as read
router.put('/:id/read', (req, res) => {
    // Extract ID from params
    const messageId = parseInt(req.params.id);
    // In messagesController.js, update the message to isRead = true
    // This endpoint is already called from the frontend, but was missing from routes
    messagesController.markAsRead(req, res);
  });
// Admin routes - requires admin role
// Get all messages in the system (admin only)
router.get('/admin/all', authMiddleware.isAdmin, messagesController.getAllMessages);

// Admin delete message (admin can delete any message)
router.delete('/admin/:id', authMiddleware.isAdmin, messagesController.adminDeleteMessage);
module.exports = router;