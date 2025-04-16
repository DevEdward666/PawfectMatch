"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Send a message
router.post('/', messageController_1.sendMessage);
// Get user's messages (inbox and sent)
router.get('/', messageController_1.getUserMessages);
// Get unread message count
router.get('/unread-count', messageController_1.getUnreadCount);
// Get all admin users (for messaging)
router.get('/admins', messageController_1.getAdminUsers);
// Get message by ID
router.get('/:id', messageController_1.getMessageById);
// Delete message
router.delete('/:id', messageController_1.deleteMessage);
// Mark message as read
router.put('/:id/read', (req, res) => {
    // Extract ID from params
    const messageId = parseInt(req.params.id);
    // In js, update the message to isRead = true
    // This endpoint is already called from the frontend, but was missing from routes
    (0, messageController_1.markAsRead)(req, res);
});
// Admin routes - requires admin role
// Get all messages in the system (admin only)
router.get('/admin/all', auth_1.isAdmin, messageController_1.getAllMessages);
// Admin delete message (admin can delete any message)
router.delete('/admin/:id', auth_1.isAdmin, messageController_1.adminDeleteMessage);
exports.default = router;
