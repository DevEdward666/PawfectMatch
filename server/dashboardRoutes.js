const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboardController');
const authMiddleware = require('./authMiddleware');

// All routes are admin-only
router.use(authMiddleware.authenticate);
router.use(authMiddleware.isAdmin);

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Get recent adoption applications
router.get('/recent-adoptions', dashboardController.getRecentAdoptions);

// Get recent reports
router.get('/recent-reports', dashboardController.getRecentReports);

// Get inventory status
router.get('/inventory', dashboardController.getInventoryStatus);

// Get adoption trends
router.get('/adoption-trends', dashboardController.getAdoptionTrends);

module.exports = router;