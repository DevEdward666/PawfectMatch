"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.resetUserPassword = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = exports.changePassword = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../models/schema");
const auth_1 = require("../config/auth");
const drizzle_orm_1 = require("drizzle-orm");
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        // Check if email already exists
        const existingUser = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Create new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role: 'user' // Default role
        };
        const [createdUser] = await connection_1.db.insert(schema_1.users).values(newUser).returning();
        // Generate token
        const token = (0, auth_1.generateToken)(createdUser.id, createdUser.email, createdUser.role);
        // Return user without password
        const { password: _, ...userWithoutPassword } = createdUser;
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: userWithoutPassword, token }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while registering user'
        });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const [user] = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        // Check if password is correct
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        // Generate token
        const token = (0, auth_1.generateToken)(user.id, user.email, user.role);
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: userWithoutPassword, token }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while logging in'
        });
    }
};
exports.loginUser = loginUser;
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }
        const [user] = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
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
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching user profile'
        });
    }
};
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (req, res) => {
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
        const [updatedUser] = await connection_1.db
            .update(schema_1.users)
            .set({
            name,
            phone,
            address,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
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
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating user profile'
        });
    }
};
exports.updateUserProfile = updateUserProfile;
const changePassword = async (req, res) => {
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
        const [user] = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Verify current password
        const isPasswordValid = await (0, auth_1.comparePassword)(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        // Hash new password
        const hashedPassword = await (0, auth_1.hashPassword)(newPassword);
        // Update password
        await connection_1.db
            .update(schema_1.users)
            .set({
            password: hashedPassword,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
};
exports.changePassword = changePassword;
// Admin controllers
const getAllUsers = async (req, res) => {
    try {
        const usersList = await connection_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            role: schema_1.users.role,
            phone: schema_1.users.phone,
            address: schema_1.users.address,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt
        }).from(schema_1.users);
        return res.status(200).json({
            success: true,
            data: usersList
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const [user] = await connection_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            role: schema_1.users.role,
            phone: schema_1.users.phone,
            address: schema_1.users.address,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
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
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching user'
        });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, address } = req.body;
        // Check if email already exists
        const existingUser = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Create new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            phone,
            address
        };
        const [createdUser] = await connection_1.db.insert(schema_1.users).values(newUser).returning({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            role: schema_1.users.role,
            phone: schema_1.users.phone,
            address: schema_1.users.address,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt
        });
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: createdUser
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating user'
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, role, phone, address } = req.body;
        // Check if user exists
        const existingUser = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Check if email is being changed and if it's already in use
        if (email && email !== existingUser[0].email) {
            const emailCheck = await connection_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.email, email), (0, drizzle_orm_1.eq)(schema_1.users.id, userId)));
            if (emailCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }
        // Update user
        const [updatedUser] = await connection_1.db
            .update(schema_1.users)
            .set({
            name,
            email,
            role,
            phone,
            address,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .returning({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            role: schema_1.users.role,
            phone: schema_1.users.phone,
            address: schema_1.users.address,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt
        });
        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating user'
        });
    }
};
exports.updateUser = updateUser;
const resetUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;
        // Check if user exists
        const existingUser = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Hash new password
        const hashedPassword = await (0, auth_1.hashPassword)(newPassword);
        // Update password
        await connection_1.db
            .update(schema_1.users)
            .set({
            password: hashedPassword,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while resetting password'
        });
    }
};
exports.resetUserPassword = resetUserPassword;
const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const existingUser = await connection_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Delete user
        await connection_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting user'
        });
    }
};
exports.deleteUser = deleteUser;
