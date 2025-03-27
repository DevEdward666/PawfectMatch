import { Request, Response } from 'express';
import { db } from '../config/database';
import { users, User, InsertUser } from '../models/schema';
import { hashPassword, comparePassword, generateToken } from '../config/auth';
import { eq, and } from 'drizzle-orm';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser: InsertUser = {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: 'user' // Default role
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();

    // Generate token
    const token = generateToken(createdUser.id, createdUser.email, createdUser.role);

    // Return user without password
    const { password: _, ...userWithoutPassword } = createdUser;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while registering user'
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password is correct
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging in'
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phone, address } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        phone,
        address,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating user profile'
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// Admin controllers

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const usersList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      address: users.address,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);

    return res.status(200).json({
      success: true,
      data: usersList
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      address: users.address,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser: InsertUser = {
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      phone,
      address
    };

    const [createdUser] = await db.insert(users).values(newUser).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      address: users.address,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role, phone, address } = req.body;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser[0].email) {
      const emailCheck = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.id, userId, true)));
      
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        email,
        role,
        phone,
        address,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        address: users.address,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId));

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};
