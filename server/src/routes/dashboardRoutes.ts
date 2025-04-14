import express  from 'express';
import {getDashboardStats,getRecentAdoptions,getRecentReports,getInventoryStatus,getAdoptionTrends}  from '../controllers/dashboardController';
import {authenticate,isAdmin} from  '../middlewares/authMiddleware';

const router = express.Router();
// All routes are admin-only
router.use(authenticate);
router.use(isAdmin);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get recent adoption applications
router.get('/recent-adoptions', getRecentAdoptions);

// Get recent reports
router.get('/recent-reports', getRecentReports);

// Get inventory status
router.get('/inventory', getInventoryStatus);

// Get adoption trends
router.get('/adoption-trends', getAdoptionTrends);


export default router;