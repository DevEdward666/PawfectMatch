const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq, or, and, desc } = require('drizzle-orm');

// Database connection
const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
const db = drizzle(pool);

// Get schema
const schema = require('../shared/schema');
const { messages, users } = schema;

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id; // Set by auth middleware
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
      .where(eq(users.id, receiverId));
    
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
    .where(eq(users.id, senderId));
    
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
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get user's messages (inbox and sent)
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id; // Set by auth middleware
    
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
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.receiverId, userId))
    .orderBy(desc(messages.createdAt));
    
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
    .leftJoin(users, eq(messages.receiverId, users.id))
    .where(eq(messages.senderId, userId))
    .orderBy(desc(messages.createdAt));
    
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
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Get message by ID
exports.getMessageById = async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.id; // Set by auth middleware
    
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
    .where(eq(messages.id, messageId));
    
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
        .where(eq(messages.id, messageId));
      
      message.isRead = true;
    }
    
    // Get sender and receiver details
    const [sender] = await db.select({
      id: users.id,
      name: users.name,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, message.senderId));
    
    const [receiver] = await db.select({
      id: users.id,
      name: users.name,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, message.receiverId));
    
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
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message',
      error: error.message
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.id; // Set by auth middleware
    
    if (isNaN(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }
    
    // Check if message exists and belongs to user
    const [message] = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
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
      .where(eq(messages.id, messageId));
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// Get all admin users (for messaging)
exports.getAdminUsers = async (req, res) => {
  try {
    const adminUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email
    })
    .from(users)
    .where(eq(users.role, 'admin'));
    
    res.status(200).json({
      success: true,
      data: adminUsers
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin users',
      error: error.message
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id; // Set by auth middleware
    
    const [unreadCount] = await db.select({
      count: db.count()
    })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      )
    );
    
    res.status(200).json({
      success: true,
      data: {
        unreadCount: Number(unreadCount.count)
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};