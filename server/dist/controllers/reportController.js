"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToReport = exports.updateReportStatus = exports.getAllReports = exports.getReportById = exports.getUserReports = exports.submitReport = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
// Submit a new report
const submitReport = async (req, res) => {
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
        const newReport = {
            userId,
            title,
            description,
            location,
            imageUrl,
            status: 'pending'
        };
        const [createdReport] = await connection_1.db.insert(schema_1.reports).values(newReport).returning();
        return res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: createdReport
        });
    }
    catch (error) {
        console.error('Submit report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while submitting report'
        });
    }
};
exports.submitReport = submitReport;
// Get user reports
const getUserReports = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userReports = await connection_1.db
            .select()
            .from(schema_1.reports)
            .where((0, drizzle_orm_1.eq)(schema_1.reports.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.reports.createdAt));
        // Get responses for each report
        const reportsWithResponses = await Promise.all(userReports.map(async (report) => {
            const responses = await connection_1.db
                .select({
                response: schema_1.reportResponses,
                admin: {
                    id: schema_1.users.id,
                    name: schema_1.users.name,
                    email: schema_1.users.email
                }
            })
                .from(schema_1.reportResponses)
                .where((0, drizzle_orm_1.eq)(schema_1.reportResponses.reportId, report.id))
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.reportResponses.adminId, schema_1.users.id))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.reportResponses.createdAt));
            return {
                ...report,
                responses: responses.map(({ response, admin }) => ({
                    ...response,
                    admin
                }))
            };
        }));
        return res.status(200).json({
            success: true,
            data: reportsWithResponses
        });
    }
    catch (error) {
        console.error('Get user reports error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching reports'
        });
    }
};
exports.getUserReports = getUserReports;
// Get report by ID
const getReportById = async (req, res) => {
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
        const [report] = await connection_1.db
            .select()
            .from(schema_1.reports)
            .where((0, drizzle_orm_1.eq)(schema_1.reports.id, reportId));
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
        const [reporter] = await connection_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, report.userId));
        // Get responses
        const responses = await connection_1.db
            .select({
            response: schema_1.reportResponses,
            admin: {
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email
            }
        })
            .from(schema_1.reportResponses)
            .where((0, drizzle_orm_1.eq)(schema_1.reportResponses.reportId, reportId))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.reportResponses.adminId, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.reportResponses.createdAt));
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
    }
    catch (error) {
        console.error('1 Get report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching report'
        });
    }
};
exports.getReportById = getReportById;
// Admin: Get all reports
const getAllReports = async (req, res) => {
    try {
        const { status } = req.query;
        const StatusEnum = zod_1.z.enum(["pending", "resolved", "reviewing"]);
        let conditions = [];
        let query = connection_1.db
            .select({
            report: schema_1.reports,
            reporter: {
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email
            }
        })
            .from(schema_1.reports)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.reports.userId, schema_1.users.id));
        const statusParsed = StatusEnum.safeParse(status);
        if (statusParsed.success) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.reports.status, statusParsed.data));
        }
        if (conditions.length > 0) {
            query.where((0, drizzle_orm_1.and)(...conditions));
        }
        const allReports = await query.orderBy((0, drizzle_orm_1.desc)(schema_1.reports.createdAt));
        return res.status(200).json({
            success: true,
            data: allReports
        });
    }
    catch (error) {
        console.error("Get all reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching reports"
        });
    }
};
exports.getAllReports = getAllReports;
// Admin: Update report status
const updateReportStatus = async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        const { status } = req.body;
        // Check if report exists
        const [report] = await connection_1.db
            .select()
            .from(schema_1.reports)
            .where((0, drizzle_orm_1.eq)(schema_1.reports.id, reportId));
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        // Update report status
        const [updatedReport] = await connection_1.db
            .update(schema_1.reports)
            .set({
            status,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.reports.id, reportId))
            .returning();
        return res.status(200).json({
            success: true,
            message: 'Report status updated successfully',
            data: updatedReport
        });
    }
    catch (error) {
        console.error('Update report status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating report status'
        });
    }
};
exports.updateReportStatus = updateReportStatus;
// Admin: Respond to a report
const respondToReport = async (req, res) => {
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
        const [report] = await connection_1.db
            .select()
            .from(schema_1.reports)
            .where((0, drizzle_orm_1.eq)(schema_1.reports.id, reportId));
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        // Create response
        const newResponse = {
            reportId,
            adminId,
            response
        };
        const [createdResponse] = await connection_1.db
            .insert(schema_1.reportResponses)
            .values(newResponse)
            .returning();
        // Update report status to reviewing if it's pending
        if (report.status === 'pending') {
            await connection_1.db
                .update(schema_1.reports)
                .set({
                status: 'reviewing',
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.reports.id, reportId));
        }
        return res.status(201).json({
            success: true,
            message: 'Response added successfully',
            data: createdResponse
        });
    }
    catch (error) {
        console.error('Respond to report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while responding to report'
        });
    }
};
exports.respondToReport = respondToReport;
