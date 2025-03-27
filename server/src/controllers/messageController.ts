import { Request, Response } from 'express';
import { db } from '../config/database';
import { messages, users, InsertMessage } from '../models/schema';
import { eq, and, or, desc } from 'drizzle-orm';

// Send a new message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, subject, content } = req.body;
    
    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Check if receiver exists
    const receiverExists = await db
      .select()
      .from(users)
      .where(eq(users.id, receiverId));
    
    if (receiverExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }
    
    // Create message
    const newMessage: InsertMessage = {
      senderId,
      receiverId,
      subject,
      content,
      isRead: false
    };
    
    const [createdMessage] = await db
      .insert(messages)
      .values(newMessage)
      .returning();
    
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: createdMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
};

// Get all messages for a user (inbox and sent)
export const getUserMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get all messages where user is sender or receiver
    const userMessages = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ))
      .leftJoin(users, eq(messages.senderId, users.id))
      .orderBy(desc(messages.createdAt));
    
    // Format messages into inbox and sent
    const inbox = userMessages
      .filter(({ message }) => message.receiverId === userId)
      .map(({ message, sender }) => ({
        ...message,
        sender
      }));
    
    const sent = userMessages
      .filter(({ message }) => message.senderId === userId)
      .map(({ message, sender }) => ({
        ...message,
        sender
      }));
    
    return res.status(200).json({
      success: true,
      data: {
        inbox,
        sent
      }
    });
  } catch (error) {
    console.error('Get user messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};

// Get message by ID
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get message
    const [message] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
      );
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized'
      });
    }
    
    // Get sender and receiver details
    const [sender] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, message.senderId));
    
    const [receiver] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, message.receiverId));
    
    // If user is the receiver and message is unread, mark as read
    if (userId === message.receiverId && !message.isRead) {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId));
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ...message,
        sender,
        receiver
      }
    });
  } catch (error) {
    console.error('Get message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching message'
    });
  }
};

// Delete a message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Check if message exists and user is authorized
    const [message] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
      );
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized'
      });
    }
    
    // Delete message
    await db.delete(messages).where(eq(messages.id, messageId));
    
    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
};

// Admin: Get all messages
export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const allMessages = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .orderBy(desc(messages.createdAt));
    
    // Format the result
    const formattedMessages = await Promise.all(
      allMessages.map(async ({ message, sender }) => {
        const [receiver] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role
          })
          .from(users)
          .where(eq(users.id, message.receiverId));
        
        return {
          ...message,
          sender,
          receiver
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};
