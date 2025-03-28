const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { eq, and, desc } = require('drizzle-orm');

// Database connection
const pool = new Pool({   connectionString: process.env.DATABASE_URL + '?sslmode=require'});
const db = drizzle(pool);

// Get schema
const schema = require('../shared/schema');
const { reports, users, reportResponses } = schema;

// Submit a report
exports.submitReport = async (req, res) => {
  try {
    const { title, description, location, imageUrl } = req.body;
    const userId = req.user.id; // Set by auth middleware
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }
    
    // Create report
    const [newReport] = await db.insert(reports)
      .values({
        userId,
        title,
        description,
        location,
        imageUrl,
        status: 'pending' // Default status
      })
      .returning();
    
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: newReport
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
};

// Get reports by user
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.id; // Set by auth middleware
    
    const userReports = await db.select({
      id: reports.id,
      userId: reports.userId,
      title: reports.title,
      description: reports.description,
      location: reports.location,
      imageUrl: reports.imageUrl,
      status: reports.status,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt
    })
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));
    
    // Count responses for each report
    const reportsWithResponseCount = await Promise.all(
      userReports.map(async (report) => {
        const [responseCount] = await db.select({
          count: db.count()
        })
        .from(reportResponses)
        .where(eq(reportResponses.reportId, report.id));
        
        return {
          ...report,
          responseCount: Number(responseCount.count)
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: reportsWithResponseCount
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reports',
      error: error.message
    });
  }
};

// Get report by ID with responses
exports.getReportById = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const userId = req.user.id; // Set by auth middleware
    const isAdmin = req.user.role === 'admin';
    
    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }
    
    // Get report
    const [report] = await db.select({
      id: reports.id,
      userId: reports.userId,
      title: reports.title,
      description: reports.description,
      location: reports.location,
      imageUrl: reports.imageUrl,
      status: reports.status,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
      reporterName: users.name,
      reporterEmail: users.email
    })
    .from(reports)
    .leftJoin(users, eq(reports.userId, users.id))
    .where(eq(reports.id, reportId));
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Check if user is authorized to view this report
    if (!isAdmin && report.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this report'
      });
    }
    
    // Get responses
    const responses = await db.select({
      id: reportResponses.id,
      reportId: reportResponses.reportId,
      adminId: reportResponses.adminId,
      response: reportResponses.response,
      createdAt: reportResponses.createdAt,
      adminName: users.name
    })
    .from(reportResponses)
    .leftJoin(users, eq(reportResponses.adminId, users.id))
    .where(eq(reportResponses.reportId, reportId))
    .orderBy(reportResponses.createdAt);
    
    // Restructure the response object
    const reportData = {
      ...report,
      reporter: {
        id: report.userId,
        name: report.reporterName,
        email: report.reporterEmail
      },
      responses
    };
    
    // Remove redundant fields
    delete reportData.reporterName;
    delete reportData.reporterEmail;
    
    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const allReports = await db.select({
      id: reports.id,
      userId: reports.userId,
      title: reports.title,
      description: reports.description,
      location: reports.location,
      imageUrl: reports.imageUrl,
      status: reports.status,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(reports)
    .leftJoin(users, eq(reports.userId, users.id))
    .orderBy(desc(reports.createdAt));
    
    // Count responses for each report
    const reportsWithResponseCount = await Promise.all(
      allReports.map(async (report) => {
        const [responseCount] = await db.select({
          count: db.count()
        })
        .from(reportResponses)
        .where(eq(reportResponses.reportId, report.id));
        
        return {
          ...report,
          reporter: {
            id: report.userId,
            name: report.userName,
            email: report.userEmail
          },
          responseCount: Number(responseCount.count)
        };
      })
    );
    
    // Clean up the response
    const formattedReports = reportsWithResponseCount.map(report => {
      const { userName, userEmail, ...rest } = report;
      return rest;
    });
    
    res.status(200).json({
      success: true,
      data: formattedReports
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all reports',
      error: error.message
    });
  }
};

// Update report status (admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }
    
    if (!status || !['pending', 'reviewing', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, reviewing, or resolved)'
      });
    }
    
    // Check if report exists
    const [existingReport] = await db.select()
      .from(reports)
      .where(eq(reports.id, reportId));
    
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Update report status
    const [updatedReport] = await db.update(reports)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(reports.id, reportId))
      .returning();
    
    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report status',
      error: error.message
    });
  }
};

// Respond to report (admin only)
exports.respondToReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const adminId = req.user.id; // Set by auth middleware
    const { response } = req.body;
    
    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }
    
    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }
    
    // Check if report exists
    const [existingReport] = await db.select()
      .from(reports)
      .where(eq(reports.id, reportId));
    
    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Create response
    const [newResponse] = await db.insert(reportResponses)
      .values({
        reportId,
        adminId,
        response
      })
      .returning();
    
    // If report is in pending status, update to reviewing
    if (existingReport.status === 'pending') {
      await db.update(reports)
        .set({
          status: 'reviewing',
          updatedAt: new Date()
        })
        .where(eq(reports.id, reportId));
    }
    
    // Get admin details
    const [admin] = await db.select({
      id: users.id,
      name: users.name
    })
    .from(users)
    .where(eq(users.id, adminId));
    
    // Format response
    const responseData = {
      ...newResponse,
      admin: {
        id: admin.id,
        name: admin.name
      }
    };
    
    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error responding to report:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to report',
      error: error.message
    });
  }
};