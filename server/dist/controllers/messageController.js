"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeleteMessage = exports.markAsRead = exports.getAllMessages = exports.getUnreadCount = exports.getAdminUsers = exports.deleteMessage = exports.getMessageById = exports.getUserMessages = exports.sendMessage = void 0;
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const drizzle_orm_1 = require("drizzle-orm");
// Database connection
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });
const db = (0, node_postgres_1.drizzle)(pool);
// Get schema
const schema = __importStar(require("../models/schema"));
const { messages, users } = schema;
// Send a message
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user?.id; // Set by auth middleware
        const { receiverId, subject, content } = req.body;
        // Validate required fields
        if (!receiverId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and content are required'
            });
        }
        // Check if receiver exists
        const [receiver] = await db.select()
            .from(users)
            .where((0, drizzle_orm_1.eq)(users.id, receiverId));
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }
        // Create message
        const [newMessage] = await db.insert(messages)
            .values({
            senderId,
            receiverId,
            subject,
            content,
            isRead: false
        })
            .returning();
        // Get sender details
        const [sender] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role
        })
            .from(users)
            .where((0, drizzle_orm_1.eq)(users.id, senderId));
        // Format response
        const messageData = {
            ...newMessage,
            sender: {
                id: sender.id,
                name: sender.name,
                email: sender.email,
                role: sender.role
            }
        };
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: messageData
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};
exports.sendMessage = sendMessage;
// Get user's messages (inbox and sent)
const getUserMessages = async (req, res) => {
    try {
        const userId = req.user?.id; // Set by auth middleware
        // Get inbox messages
        const inboxMessages = await db.select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            subject: messages.subject,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            senderName: users.name,
            senderRole: users.role
        })
            .from(messages)
            .leftJoin(users, (0, drizzle_orm_1.eq)(messages.senderId, users.id))
            .where((0, drizzle_orm_1.eq)(messages.receiverId, userId))
            .orderBy((0, drizzle_orm_1.desc)(messages.createdAt));
        // Format inbox messages
        const formattedInbox = inboxMessages.map(message => ({
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            subject: message.subject,
            content: message.content,
            isRead: message.isRead,
            createdAt: message.createdAt,
            sender: {
                id: message.senderId,
                name: message.senderName,
                role: message.senderRole
            }
        }));
        // Get sent messages
        const sentMessages = await db.select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            subject: messages.subject,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            receiverName: users.name,
            receiverRole: users.role
        })
            .from(messages)
            .leftJoin(users, (0, drizzle_orm_1.eq)(messages.receiverId, users.id))
            .where((0, drizzle_orm_1.eq)(messages.senderId, userId))
            .orderBy((0, drizzle_orm_1.desc)(messages.createdAt));
        // Format sent messages
        const formattedSent = sentMessages.map(message => ({
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            subject: message.subject,
            content: message.content,
            isRead: message.isRead,
            createdAt: message.createdAt,
            receiver: {
                id: message.receiverId,
                name: message.receiverName,
                role: message.receiverRole
            }
        }));
        res.status(200).json({
            success: true,
            data: {
                inbox: formattedInbox,
                sent: formattedSent
            }
        });
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};
exports.getUserMessages = getUserMessages;
// Get message by ID
const getMessageById = async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const userId = req.user?.id; // Set by auth middleware
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID'
            });
        }
        // Get message with sender and receiver info
        const [message] = await db.select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            subject: messages.subject,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt
        })
            .from(messages)
            .where((0, drizzle_orm_1.eq)(messages.id, messageId));
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        // Check if user is authorized to view this message
        if (message.senderId !== userId && message.receiverId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this message'
            });
        }
        // If user is the receiver and message is unread, mark as read
        if (message.receiverId === userId && !message.isRead) {
            await db.update(messages)
                .set({ isRead: true })
                .where((0, drizzle_orm_1.eq)(messages.id, messageId));
            message.isRead = true;
        }
        // Get sender and receiver details
        const [sender] = await db.select({
            id: users.id,
            name: users.name,
            role: users.role
        })
            .from(users)
            .where((0, drizzle_orm_1.eq)(users.id, message.senderId));
        const [receiver] = await db.select({
            id: users.id,
            name: users.name,
            role: users.role
        })
            .from(users)
            .where((0, drizzle_orm_1.eq)(users.id, message.receiverId));
        // Format response
        const messageData = {
            ...message,
            sender: {
                id: sender.id,
                name: sender.name,
                role: sender.role
            },
            receiver: {
                id: receiver.id,
                name: receiver.name,
                role: receiver.role
            }
        };
        res.status(200).json({
            success: true,
            data: messageData
        });
    }
    catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching message',
            error: error.message
        });
    }
};
exports.getMessageById = getMessageById;
// Delete message
const deleteMessage = async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const userId = req.user?.id; // Set by auth middleware
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID'
            });
        }
        // Check if message exists and belongs to user
        const [message] = await db.select()
            .from(messages)
            .where((0, drizzle_orm_1.eq)(messages.id, messageId));
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        // Check if user is authorized to delete this message
        if (message.senderId !== userId && message.receiverId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this message'
            });
        }
        // Delete message
        await db.delete(messages)
            .where((0, drizzle_orm_1.eq)(messages.id, messageId));
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: error.message
        });
    }
};
exports.deleteMessage = deleteMessage;
// Get all admin users (for messaging)
const getAdminUsers = async (req, res) => {
    try {
        const adminUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email
        })
            .from(users)
            .where((0, drizzle_orm_1.eq)(users.role, 'admin'));
        res.status(200).json({
            success: true,
            data: adminUsers
        });
    }
    catch (error) {
        console.error('Error fetching admin users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching admin users',
            error: error.message
        });
    }
};
exports.getAdminUsers = getAdminUsers;
// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id; // Set by auth middleware
        const [unreadCount] = await db.select({
            count: (0, drizzle_orm_1.sql) `COUNT(*)`
        })
            .from(messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(messages.receiverId, userId), (0, drizzle_orm_1.eq)(messages.isRead, false)));
        res.status(200).json({
            success: true,
            data: {
                unreadCount: Number(unreadCount.count)
            }
        });
    }
    catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count',
            error: error.message
        });
    }
};
exports.getUnreadCount = getUnreadCount;
// Admin: Get all messages in the system (requires admin role)
const getAllMessages = async (req, res) => {
    try {
        // Verify admin role (this should be done in middleware, but double-checking here)
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin role required'
            });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page?.toString()) || 1;
        const limit = parseInt(req.query.limit?.toString()) || 20;
        const offset = (page - 1) * limit;
        // Get all messages with sender and receiver info
        const allMessages = await db.select({
            id: messages.id,
            senderId: messages.senderId,
            receiverId: messages.receiverId,
            subject: messages.subject,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            senderName: schema.users.name,
            senderEmail: schema.users.email,
            senderRole: schema.users.role
        })
            .from(messages)
            .leftJoin(schema.users, (0, drizzle_orm_1.eq)(messages.senderId, schema.users.id))
            .orderBy((0, drizzle_orm_1.desc)(messages.createdAt))
            .limit(limit)
            .offset(offset);
        // Get receiver information for each message
        const messagesWithReceivers = await Promise.all(allMessages.map(async (message) => {
            const [receiver] = await db.select({
                id: schema.users.id,
                username: schema.users.name,
                email: schema.users.email,
                role: schema.users.role
            })
                .from(schema.users)
                .where((0, drizzle_orm_1.eq)(schema.users.id, message.receiverId));
            return {
                id: message.id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                subject: message.subject,
                content: message.content,
                isRead: message.isRead,
                createdAt: message.createdAt,
                sender: {
                    id: message.senderId,
                    username: message.senderName,
                    email: message.senderEmail,
                    role: message.senderRole
                },
                receiver: receiver ? {
                    id: receiver.id,
                    username: receiver.username,
                    email: receiver.email,
                    role: receiver.role
                } : null
            };
        }));
        // Get total count for pagination
        const [totalCount] = await db.select({
            count: (0, drizzle_orm_1.sql) `COUNT(*)`
        })
            .from(messages);
        res.status(200).json({
            success: true,
            data: {
                messages: messagesWithReceivers,
                pagination: {
                    totalItems: Number(totalCount.count),
                    currentPage: page,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(Number(totalCount.count) / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching all messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching all messages',
            error: error.message
        });
    }
};
exports.getAllMessages = getAllMessages;
// Mark message as read
const markAsRead = async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const userId = req.user?.id; // Set by auth middleware
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID'
            });
        }
        // Check if message exists and user is the receiver
        const [message] = await db.select()
            .from(messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(messages.id, messageId), (0, drizzle_orm_1.eq)(messages.receiverId, userId)));
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you are not authorized to modify it'
            });
        }
        // Update message to mark as read
        await db.update(messages)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(messages.id, messageId));
        res.status(200).json({
            success: true,
            message: 'Message marked as read successfully'
        });
    }
    catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking message as read',
            error: error.message
        });
    }
};
exports.markAsRead = markAsRead;
// Admin: Delete a message (admin can delete any message)
const adminDeleteMessage = async (req, res) => {
    try {
        // Verify admin role
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin role required'
            });
        }
        const messageId = parseInt(req.params.id);
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID'
            });
        }
        // Check if message exists
        const [message] = await db.select()
            .from(messages)
            .where((0, drizzle_orm_1.eq)(messages.id, messageId));
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        // Delete message
        await db.delete(messages)
            .where((0, drizzle_orm_1.eq)(messages.id, messageId));
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: error.message
        });
    }
};
exports.adminDeleteMessage = adminDeleteMessage;
