import { Request, Response } from 'express';
import { db } from '../../src/db/connection';
import { reports, reportResponses, users, InsertReport, InsertReportResponse } from '../models/schema';
import { and,eq, desc, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { z } from "zod";
// Submit a new report
export const submitReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, location } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    let imageUrl = null;
    if (req.file && req.file.buffer) {
      imageUrl = req.file.buffer.toString('base64');
    }
    
    // Create new report
    const newReport: InsertReport = {
      userId,
      title,
      description,
      location,
      imageUrl,
      status: 'pending'
    };
    
    const [createdReport] = await db.insert(reports).values(newReport).returning();
    
    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: createdReport
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting report'
    });
  }
};

// Get user reports
export const getUserReports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
    
    // Get responses for each report
    const reportsWithResponses = await Promise.all(
      userReports.map(async (report) => {
        const responses = await db
          .select({
            response: reportResponses,
            admin: {
              id: users.id,
              name: users.name,
              email: users.email
            }
          })
          .from(reportResponses)
          .where(eq(reportResponses.reportId, report.id))
          .leftJoin(users, eq(reportResponses.adminId, users.id))
          .orderBy(desc(reportResponses.createdAt));
        
        return {
          ...report,
          responses: responses.map(({ response, admin }) => ({
            ...response,
            admin
          }))
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: reportsWithResponses
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
};

// Get report by ID
export const getReportById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const reportId = parseInt(req.params.id);
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get report
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId));
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Check if user is authorized (admin or report owner)
    if (report.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this report'
      });
    }
    
    // Get report submitter
    const [reporter] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, report.userId));
    
    // Get responses
    const responses = await db
      .select({
        response: reportResponses,
        admin: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(reportResponses)
      .where(eq(reportResponses.reportId, reportId))
      .leftJoin(users, eq(reportResponses.adminId, users.id))
      .orderBy(desc(reportResponses.createdAt));
    
    return res.status(200).json({
      success: true,
      data: {
        ...report,
        reporter,
        responses: responses.map(({ response, admin }) => ({
          ...response,
          admin
        }))
      }
    });
  } catch (error) {
    console.error('1 Get report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
};

// Admin: Get all reports
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const StatusEnum = z.enum(["pending", "resolved", "reviewing"]);
    let conditions = [];
    let query = db
      .select({
        report: reports,
        reporter: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(reports)
      .leftJoin(users, eq(reports.userId, users.id));

      const statusParsed = StatusEnum.safeParse(status);
      if (statusParsed.success) {
        conditions.push(eq(reports.status, statusParsed.data));
      }
      if (conditions.length > 0) {
        query.where(and(...conditions)); 
      }
    const allReports = await query.orderBy(desc(reports.createdAt));
   
    return res.status(200).json({
      success: true,
      data: allReports
    });
  } catch (error) {
    console.error("Get all reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching reports"
    });
  }
};


// Admin: Update report status
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Check if report exists
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId));
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Update report status
    const [updatedReport] = await db
      .update(reports)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(reports.id, reportId))
      .returning();
    
    return res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Update report status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating report status'
    });
  }
};

// Admin: Respond to a report
export const respondToReport = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const reportId = parseInt(req.params.id);
    const { response } = req.body;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Check if report exists
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId));
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Create response
    const newResponse: InsertReportResponse = {
      reportId,
      adminId,
      response
    };
    
    const [createdResponse] = await db
      .insert(reportResponses)
      .values(newResponse)
      .returning();
    
    // Update report status to reviewing if it's pending
    if (report.status === 'pending') {
      await db
        .update(reports)
        .set({
          status: 'reviewing',
          updatedAt: new Date()
        })
        .where(eq(reports.id, reportId));
    }
    
    return res.status(201).json({
      success: true,
      message: 'Response added successfully',
      data: createdResponse
    });
  } catch (error) {
    console.error('Respond to report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while responding to report'
    });
  }
};
