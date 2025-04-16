"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdoptionTrends = exports.getInventoryStatus = exports.getRecentReports = exports.getRecentAdoptions = exports.getDashboardStats = void 0;
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../models/schema");
// Database connection
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });
const db = (0, node_postgres_1.drizzle)(pool);
// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Get count of entities
        const [userCount] = await db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.users);
        const [petCount] = await db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.pets);
        const [productCount] = await db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.products);
        const [adoptionCount] = await db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.adoptionApplications);
        const [reportCount] = await db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.reports);
        // Get pending adoption applications
        const [pendingAdoptionCount] = await db.select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.eq)(schema_1.adoptionApplications.status, 'pending'));
        // Get pending report requests
        const [pendingReportCount] = await db.select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.reports)
            .where((0, drizzle_orm_1.eq)(schema_1.reports.status, 'pending'));
        // Get unread admin messages (all messages to this admin that are unread)
        const adminId = req.user?.id;
        const [unreadMessageCount] = await db.select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.receiverId, adminId), (0, drizzle_orm_1.eq)(schema_1.messages.isRead, false)));
        // Get user registration trend (last 7 days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const newUsers = await db.select({
            date: (0, drizzle_orm_1.sql) `DATE(${schema_1.users.createdAt})`,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.gt)(schema_1.users.createdAt, last7Days))
            .groupBy((0, drizzle_orm_1.sql) `DATE(${schema_1.users.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `DATE(${schema_1.users.createdAt})`);
        // Get adoption trend (last 7 days)
        const newAdoptions = await db.select({
            date: (0, drizzle_orm_1.sql) `DATE(${schema_1.adoptionApplications.createdAt})`,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.gt)(schema_1.adoptionApplications.createdAt, last7Days))
            .groupBy((0, drizzle_orm_1.sql) `DATE(${schema_1.adoptionApplications.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `DATE(${schema_1.adoptionApplications.createdAt})`);
        // Compile stats
        const stats = {
            counts: {
                users: Number(userCount.count),
                pets: Number(petCount.count),
                products: Number(productCount.count),
                adoptions: Number(adoptionCount.count),
                reports: Number(reportCount.count)
            },
            pending: {
                adoptions: Number(pendingAdoptionCount.count),
                reports: Number(pendingReportCount.count),
                messages: Number(unreadMessageCount.count)
            },
            trends: {
                users: newUsers.map(item => ({
                    date: item.date,
                    count: Number(item.count)
                })),
                adoptions: newAdoptions.map(item => ({
                    date: item.date,
                    count: Number(item.count)
                }))
            }
        };
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};
exports.getDashboardStats = getDashboardStats;
// Get recent adoption applications
const getRecentAdoptions = async (req, res) => {
    try {
        const limit = parseInt(req.query?.limit?.toString()) || 5;
        if (limit > 20) {
            return res.status(400).json({
                success: false,
                message: 'Limit cannot exceed 20'
            });
        }
        const recentAdoptions = await db.select({
            id: schema_1.adoptionApplications.id,
            userId: schema_1.adoptionApplications.userId,
            petId: schema_1.adoptionApplications.petId,
            status: schema_1.adoptionApplications.status,
            message: schema_1.adoptionApplications.message,
            createdAt: schema_1.adoptionApplications.createdAt,
            userName: schema_1.users.name,
            petName: schema_1.pets.name,
            petSpecies: schema_1.pets.species,
            petBreed: schema_1.pets.breed
        })
            .from(schema_1.adoptionApplications)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.userId, schema_1.users.id))
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.adoptionApplications.createdAt))
            .limit(limit);
        // Format response
        const formattedAdoptions = recentAdoptions.map(adoption => ({
            id: adoption.id,
            status: adoption.status,
            message: adoption.message,
            createdAt: adoption.createdAt,
            user: {
                id: adoption.userId,
                name: adoption.userName
            },
            pet: {
                id: adoption.petId,
                name: adoption.petName,
                species: adoption.petSpecies,
                breed: adoption.petBreed
            }
        }));
        res.status(200).json({
            success: true,
            data: formattedAdoptions
        });
    }
    catch (error) {
        console.error('Error fetching recent adoptions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent adoptions',
            error: error.message
        });
    }
};
exports.getRecentAdoptions = getRecentAdoptions;
// Get recent reports
const getRecentReports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit?.toString()) || 5;
        if (limit > 20) {
            return res.status(400).json({
                success: false,
                message: 'Limit cannot exceed 20'
            });
        }
        const recentReports = await db.select({
            id: schema_1.reports.id,
            userId: schema_1.reports.userId,
            title: schema_1.reports.title,
            status: schema_1.reports.status,
            createdAt: schema_1.reports.createdAt,
            userName: schema_1.users.name
        })
            .from(schema_1.reports)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.reports.userId, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.reports.createdAt))
            .limit(limit);
        // Format response
        const formattedReports = recentReports.map(report => ({
            id: report.id,
            title: report.title,
            status: report.status,
            createdAt: report.createdAt,
            user: {
                id: report.userId,
                name: report.userName
            }
        }));
        res.status(200).json({
            success: true,
            data: formattedReports
        });
    }
    catch (error) {
        console.error('Error fetching recent reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent reports',
            error: error.message
        });
    }
};
exports.getRecentReports = getRecentReports;
// Get inventory status
const getInventoryStatus = async (req, res) => {
    try {
        // Get products with low stock
        const lowStockProducts = await db.select({
            id: schema_1.products.id,
            name: schema_1.products.name,
            category: schema_1.products.category,
            price: schema_1.products.price,
            stock: schema_1.products.stock
        })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.lt)(schema_1.products.stock, 10)) // Consider low stock as less than 10
            .orderBy(schema_1.products.stock);
        // Get pet statistics by species
        const petsBySpecies = await db.select({
            species: schema_1.pets.species,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.pets)
            .groupBy(schema_1.pets.species)
            .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
        // Get pet statistics by status
        const petsByStatus = await db.select({
            status: schema_1.pets.status,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.pets)
            .groupBy(schema_1.pets.status)
            .orderBy(schema_1.pets.status);
        // Format response
        const inventoryStatus = {
            lowStockProducts: lowStockProducts,
            petsBySpecies: petsBySpecies.map(item => ({
                species: item.species,
                count: Number(item.count)
            })),
            petsByStatus: petsByStatus.map(item => ({
                status: item.status,
                count: Number(item.count)
            }))
        };
        res.status(200).json({
            success: true,
            data: inventoryStatus
        });
    }
    catch (error) {
        console.error('Error fetching inventory status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory status',
            error: error.message
        });
    }
};
exports.getInventoryStatus = getInventoryStatus;
// Get adoption trends
const getAdoptionTrends = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        let startDate;
        const endDate = new Date();
        // Set start date based on period
        switch (period) {
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
        }
        // Get adoption trends by status
        const adoptionsByStatus = await db.select({
            status: schema_1.adoptionApplications.status,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.adoptionApplications)
            .where((0, drizzle_orm_1.between)(schema_1.adoptionApplications.createdAt, startDate, endDate))
            .groupBy(schema_1.adoptionApplications.status);
        // Get species popularity in adoptions
        const adoptionsBySpecies = await db.select({
            species: schema_1.pets.species,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.adoptionApplications)
            .leftJoin(schema_1.pets, (0, drizzle_orm_1.eq)(schema_1.adoptionApplications.petId, schema_1.pets.id))
            .where((0, drizzle_orm_1.between)(schema_1.adoptionApplications.createdAt, startDate, endDate))
            .groupBy(schema_1.pets.species)
            .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.count)()));
        // Format response
        const trends = {
            byStatus: adoptionsByStatus.map(item => ({
                status: item.status,
                count: Number(item.count)
            })),
            bySpecies: adoptionsBySpecies.map(item => ({
                species: item.species,
                count: Number(item.count)
            })),
            period: period
        };
        res.status(200).json({
            success: true,
            data: trends
        });
    }
    catch (error) {
        console.error('Error fetching adoption trends:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching adoption trends',
            error: error.message
        });
    }
};
exports.getAdoptionTrends = getAdoptionTrends;
