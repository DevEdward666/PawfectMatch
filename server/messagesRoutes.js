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

module.exports = router;