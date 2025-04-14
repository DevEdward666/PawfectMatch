import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, count, and, sql, desc, gt, lt, between } from 'drizzle-orm';
import { Request, Response } from 'express';
import { 
  users, 
  pets, 
  products, 
  adoptionApplications, 
  reports,
  messages
} from '../models/schema';
// Database connection
const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
const db = drizzle(pool);


// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response)  => {
  try {
    // Get count of entities
    const [userCount] = await db.select({ count: count() }).from(users);
    const [petCount] = await db.select({ count: count() }).from(pets);
    const [productCount] = await db.select({ count: count() }).from(products);
    const [adoptionCount] = await db.select({ count: count() }).from(adoptionApplications);
    const [reportCount] = await db.select({ count: count() }).from(reports);
    
    // Get pending adoption applications
    const [pendingAdoptionCount] = await db.select({ count: count() })
      .from(adoptionApplications)
      .where(eq(adoptionApplications.status, 'pending'));
    
    // Get pending report requests
    const [pendingReportCount] = await db.select({ count: count() })
      .from(reports)
      .where(eq(reports.status, 'pending'));
    
    // Get unread admin messages (all messages to this admin that are unread)
    const adminId = req.user?.id;
    const [unreadMessageCount] = await db.select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, adminId!),
          eq(messages.isRead, false)
        )
      );
    
    // Get user registration trend (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const newUsers = await db.select({
      date: sql`DATE(${users.createdAt})`,
      count: count()
    })
    .from(users)
    .where(gt(users.createdAt, last7Days))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);
    
    // Get adoption trend (last 7 days)
    const newAdoptions = await db.select({
      date: sql`DATE(${adoptionApplications.createdAt})`,
      count: count()
    })
    .from(adoptionApplications)
    .where(gt(adoptionApplications.createdAt, last7Days))
    .groupBy(sql`DATE(${adoptionApplications.createdAt})`)
    .orderBy(sql`DATE(${adoptionApplications.createdAt})`);
    
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
  } catch (error:any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Get recent adoption applications
export const getRecentAdoptions = async (req: Request, res: Response)  => {
  try {
    
    const limit = parseInt(req.query?.limit?.toString()!) || 5;
    
    if (limit > 20) {
      return res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 20'
      });
    }
    
    const recentAdoptions = await db.select({
      id: adoptionApplications.id,
      userId: adoptionApplications.userId,
      petId: adoptionApplications.petId,
      status: adoptionApplications.status,
      message: adoptionApplications.message,
      createdAt: adoptionApplications.createdAt,
      userName: users.name,
      petName: pets.name,
      petSpecies: pets.species,
      petBreed: pets.breed
    })
    .from(adoptionApplications)
    .leftJoin(users, eq(adoptionApplications.userId, users.id))
    .leftJoin(pets, eq(adoptionApplications.petId, pets.id))
    .orderBy(desc(adoptionApplications.createdAt))
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
  } catch (error:any) {
    console.error('Error fetching recent adoptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent adoptions',
      error: error.message
    });
  }
};

// Get recent reports
export const getRecentReports = async (req: Request, res: Response)  => {
  try {
    const limit = parseInt(req.query.limit?.toString()!) || 5;
    
    if (limit > 20) {
      return res.status(400).json({
        success: false,
        message: 'Limit cannot exceed 20'
      });
    }
    
    const recentReports = await db.select({
      id: reports.id,
      userId: reports.userId,
      title: reports.title,
      status: reports.status,
      createdAt: reports.createdAt,
      userName: users.name
    })
    .from(reports)
    .leftJoin(users, eq(reports.userId, users.id))
    .orderBy(desc(reports.createdAt))
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
  } catch (error:any) {
    console.error('Error fetching recent reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent reports',
      error: error.message
    });
  }
};

// Get inventory status
export const getInventoryStatus = async (req: Request, res: Response)  => {
  try {
    // Get products with low stock
    const lowStockProducts = await db.select({
      id: products.id,
      name: products.name,
      category: products.category,
      price: products.price,
      stock: products.stock
    })
    .from(products)
    .where(lt(products.stock, 10))  // Consider low stock as less than 10
    .orderBy(products.stock);
    
    // Get pet statistics by species
    const petsBySpecies = await db.select({
      species: pets.species,
      count: count()
    })
    .from(pets)
    .groupBy(pets.species)
    .orderBy(desc(count()));
    
    // Get pet statistics by status
    const petsByStatus = await db.select({
      status: pets.status,
      count: count()
    })
    .from(pets)
    .groupBy(pets.status)
    .orderBy(pets.status);
    
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
  } catch (error:any) {
    console.error('Error fetching inventory status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory status',
      error: error.message
    });
  }
};

// Get adoption trends
export const getAdoptionTrends = async (req: Request, res: Response)  => {
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
      status: adoptionApplications.status,
      count: count()
    })
    .from(adoptionApplications)
    .where(between(adoptionApplications.createdAt, startDate, endDate))
    .groupBy(adoptionApplications.status);
    
    // Get species popularity in adoptions
    const adoptionsBySpecies = await db.select({
      species: pets.species,
      count: count()
    })
    .from(adoptionApplications)
    .leftJoin(pets, eq(adoptionApplications.petId, pets.id))
    .where(between(adoptionApplications.createdAt, startDate, endDate))
    .groupBy(pets.species)
    .orderBy(desc(count()));
    
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
  } catch (error:any) {
    console.error('Error fetching adoption trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adoption trends',
      error: error.message
    });
  }
};