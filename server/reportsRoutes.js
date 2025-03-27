const express = require('express');
const router = express.Router();
const reportsController = require('./reportsController');
const authMiddleware = require('./authMiddleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Submit report - any authenticated user
router.post('/', reportsController.submitReport);

// Get reports for the current user
router.get('/user', reportsController.getUserReports);

// Get single report with details - users can only access their own reports, admins can access all
router.get('/:id', reportsController.getReportById);

// Admin-only routes
router.get('/', authMiddleware.isAdmin, reportsController.getAllReports);
router.put('/:id/status', authMiddleware.isAdmin, reportsController.updateReportStatus);
router.post('/:id/respond', authMiddleware.isAdmin, reportsController.respondToReport);

module.exports = router;